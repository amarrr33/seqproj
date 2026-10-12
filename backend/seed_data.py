import os
import glob
import json
import datetime
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from database import engine, Base, SessionLocal
import models
from dataset_loader import DATA_DIR, generate_geolife_synthetic_dataset, parse_geolife_plt
from mining.stay_points import detect_stay_points, haversine_distance_meters
from mining.dbscan_clustering import cluster_stay_points_dbscan
from mining.prefixspan_mining import mine_sequential_patterns
from mining.mobility_fingerprint import calculate_radius_of_gyration, calculate_regularity_score
from mining.anomaly_detection import detect_trajectory_anomalies

def seed_database():
    """
    Initializes database schema, processes GeoLife dataset trajectories,
    executes spatial and sequential data mining, and populates SQLite database.
    """
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    print("[ETL Pipeline] Checking GeoLife dataset directory...")
    user_folders = [f for f in glob.glob(os.path.join(DATA_DIR, "User_*")) if os.path.isdir(f)]

    if len(user_folders) < 3:
        print("[ETL Pipeline] GeoLife raw data missing or incomplete. Generating synthetic GeoLife dataset...")
        generate_geolife_synthetic_dataset(num_users=10, trips_per_user=12)
        user_folders = [f for f in glob.glob(os.path.join(DATA_DIR, "User_*")) if os.path.isdir(f)]

    all_raw_stay_points = []
    user_trajectories_data = []

    print(f"[ETL Pipeline] Processing {len(user_folders)} GeoLife users...")

    for u_folder in user_folders:
        user_code = os.path.basename(u_folder)
        db_user = models.User(user_code=user_code)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        plt_files = glob.glob(os.path.join(u_folder, "Trajectory", "*.plt"))
        user_all_points = []
        user_cluster_sequences = []

        for plt_file in plt_files:
            df = parse_geolife_plt(plt_file)
            if df.empty or len(df) < 5:
                continue

            trip_code = f"TRIP_{db_user.id}_{os.path.basename(plt_file).split('.')[0]}"
            start_time = df["datetime"].min().to_pydatetime()
            end_time = df["datetime"].max().to_pydatetime()
            duration_mins = (end_time - start_time).total_seconds() / 60.0

            # Calculate total distance and speed
            dist_meters = 0.0
            speeds = []
            lats = df["latitude"].values
            lons = df["longitude"].values
            times = df["datetime"].values

            for k in range(len(df) - 1):
                d = haversine_distance_meters(lats[k], lons[k], lats[k+1], lons[k+1])
                dist_meters += d
                dt_sec = max(1.0, (times[k+1] - times[k]) / np.timedelta64(1, 's'))
                speed_k = (d / dt_sec) * 3.6  # m/s to km/h
                speeds.append(speed_k)

            total_dist_km = round(dist_meters / 1000.0, 2)
            avg_speed = round(float(np.mean(speeds)), 1) if speeds else 0.0
            max_speed = round(float(np.max(speeds)), 1) if speeds else 0.0

            db_traj = models.Trajectory(
                user_id=db_user.id,
                trip_code=trip_code,
                start_time=start_time,
                end_time=end_time,
                point_count=len(df),
                total_distance_km=total_dist_km,
                avg_speed_kmh=avg_speed,
                max_speed_kmh=max_speed,
                duration_minutes=round(duration_mins, 1)
            )
            db.add(db_traj)
            db.commit()
            db.refresh(db_traj)

            # Insert GPS Points
            gps_point_objects = []
            for seq_i, row in df.iterrows():
                pt_dict = {
                    "latitude": float(row["latitude"]),
                    "longitude": float(row["longitude"]),
                    "altitude": float(row["altitude"]),
                    "timestamp": row["datetime"].to_pydatetime(),
                    "sequence_index": int(seq_i),
                    "speed_kmh": round(speeds[seq_i] if seq_i < len(speeds) else 0.0, 1)
                }
                user_all_points.append(pt_dict)

                gps_point_objects.append(models.GPSPoint(
                    trajectory_id=db_traj.id,
                    user_id=db_user.id,
                    **pt_dict
                ))
            db.bulk_save_objects(gps_point_objects)

            # Stay Point Detection per trajectory
            sp_list = detect_stay_points(df, dist_thresh_m=200.0, time_thresh_min=15.0)
            for sp in sp_list:
                sp["user_id"] = db_user.id
                sp["trajectory_id"] = db_traj.id
                all_raw_stay_points.append(sp)

            user_trajectories_data.append({
                "db_traj_id": db_traj.id,
                "user_id": db_user.id,
                "total_distance_km": total_dist_km,
                "cluster_sequence_str": ""
            })

    # Step 2: Spatial DBSCAN Clustering on Stay Points
    print("[Spatial Mining] Running DBSCAN clustering on stay points...")
    clustered_stay_points, cluster_summaries = cluster_stay_points_dbscan(
        all_raw_stay_points, eps_km=0.5, min_samples=2
    )

    # Insert Clusters into DB
    cluster_db_map = {}
    for c_sum in cluster_summaries:
        db_cluster = models.SpatialCluster(
            cluster_label=c_sum["cluster_label"],
            name=c_sum["name"],
            latitude=c_sum["latitude"],
            longitude=c_sum["longitude"],
            stay_point_count=c_sum["stay_point_count"],
            total_visits=c_sum["total_visits"],
            avg_stay_duration_min=c_sum["avg_stay_duration_min"],
            convex_hull_json=c_sum["convex_hull_json"]
        )
        db.add(db_cluster)
        db.commit()
        db.refresh(db_cluster)
        cluster_db_map[c_sum["cluster_label"]] = db_cluster.id

    # Insert Clustered Stay Points into DB
    for sp in clustered_stay_points:
        c_lbl = sp.get("cluster_id", -1)
        c_db_id = cluster_db_map.get(c_lbl, None)
        db_sp = models.StayPoint(
            user_id=sp["user_id"],
            latitude=sp["latitude"],
            longitude=sp["longitude"],
            arrival_time=sp["arrival_time"],
            departure_time=sp["departure_time"],
            duration_minutes=sp["duration_minutes"],
            cluster_id=c_db_id
        )
        db.add(db_sp)
    db.commit()

    # Step 3: Map Trajectories to Spatial Cluster Sequences & Run PrefixSpan
    print("[Sequential Mining] Transforming trajectories into spatial cluster sequences...")
    # Group stay points by user & trajectory to form cluster sequences
    traj_cluster_map = {}
    for sp in clustered_stay_points:
        t_id = sp.get("trajectory_id")
        c_lbl = sp.get("cluster_id", -1)
        if t_id and c_lbl != -1:
            if t_id not in traj_cluster_map:
                traj_cluster_map[t_id] = []
            traj_cluster_map[t_id].append(f"C{c_lbl+1}")

    all_sequences = []
    for t_data in user_trajectories_data:
        t_id = t_data["db_traj_id"]
        seq_list = traj_cluster_map.get(t_id, ["C1", "C2"])
        # Remove consecutive duplicate cluster visits
        dedup_seq = []
        for item in seq_list:
            if not dedup_seq or dedup_seq[-1] != item:
                dedup_seq.append(item)

        seq_str = " -> ".join(dedup_seq)
        t_data["cluster_sequence_str"] = seq_str
        all_sequences.append(dedup_seq)

        # Update Trajectory model cluster sequence string
        traj_obj = db.query(models.Trajectory).filter(models.Trajectory.id == t_id).first()
        if traj_obj:
            traj_obj.cluster_sequence_str = seq_str

    db.commit()

    print("[Sequential Mining] Running PrefixSpan pattern mining algorithm...")
    mined_patterns = mine_sequential_patterns(all_sequences, min_support_ratio=0.15)

    for p in mined_patterns:
        db_pat = models.SequentialPattern(
            pattern_sequence=p["pattern_sequence"],
            pattern_length=p["pattern_length"],
            support_count=p["support_count"],
            support_ratio=p["support_ratio"],
            confidence_score=p["confidence_score"],
            explanation=p["explanation"]
        )
        db.add(db_pat)
    db.commit()

    # Step 4: Mobility Fingerprint & User Routine Discovery
    print("[Mobility Analytics] Computing user mobility fingerprints...")
    users = db.query(models.User).all()
    for user in users:
        u_trajs = db.query(models.Trajectory).filter(models.Trajectory.user_id == user.id).all()
        u_sps = db.query(models.StayPoint).filter(models.StayPoint.user_id == user.id).all()
        u_gps = db.query(models.GPSPoint).filter(models.GPSPoint.user_id == user.id).all()

        total_trips = len(u_trajs)
        total_pts = len(u_gps)
        total_dist = sum(t.total_distance_km for t in u_trajs)
        longest_trip = max((t.total_distance_km for t in u_trajs), default=0.0)
        avg_daily = round(total_dist / max(1, (total_trips / 2.0)), 2)

        gps_dicts = [{"latitude": g.latitude, "longitude": g.longitude} for g in u_gps[::10]]
        rg_km = calculate_radius_of_gyration(gps_dicts)

        seq_list = [t.cluster_sequence_str for t in u_trajs if t.cluster_sequence_str]
        reg_score = calculate_regularity_score(seq_list)

        # Visited clusters
        cluster_ids = [sp.cluster_id for sp in u_sps if sp.cluster_id]
        unique_clusters = len(set(cluster_ids))

        top_c_name = "Cluster 1: Tsinghua Hub"
        if cluster_ids:
            most_common_cid = max(set(cluster_ids), key=cluster_ids.count)
            c_obj = db.query(models.SpatialCluster).filter(models.SpatialCluster.id == most_common_cid).first()
            if c_obj:
                top_c_name = c_obj.name

        user.total_trips = total_trips
        user.total_points = total_pts
        user.total_distance_km = round(total_dist, 2)
        user.avg_daily_travel_km = avg_daily
        user.radius_gyration_km = rg_km
        user.regularity_score = reg_score
        user.unique_locations_visited = unique_clusters
        user.most_visited_cluster = top_c_name
        user.longest_trip_km = round(longest_trip, 2)

        # Discover top user routines
        routine_counts = {}
        for s in seq_list:
            if s:
                routine_counts[s] = routine_counts.get(s, 0) + 1

        for r_seq, r_freq in routine_counts.items():
            conf = round(r_freq / float(max(1, total_trips)), 2)
            db_routine = models.Routine(
                user_id=user.id,
                sequence_str=r_seq,
                frequency=r_freq,
                confidence=conf,
                occurrences=r_freq,
                description=f"User mobility routine [{r_seq}] observed {r_freq} times with {conf*100:.0f}% frequency."
            )
            db.add(db_routine)

    db.commit()

    # Step 5: Anomaly Detection
    print("[Anomaly Detection] Scoring trajectory deviations...")
    trajs_for_anomaly = [{
        "db_traj_id": t.id,
        "user_id": t.user_id,
        "total_distance_km": t.total_distance_km,
        "cluster_sequence_str": t.cluster_sequence_str
    } for t in db.query(models.Trajectory).all()]

    scored_anomalies = detect_trajectory_anomalies(trajs_for_anomaly, mined_patterns)
    for sc in scored_anomalies:
        t_obj = db.query(models.Trajectory).filter(models.Trajectory.id == sc["db_traj_id"]).first()
        if t_obj:
            t_obj.is_anomaly = sc["is_anomaly"]
            t_obj.anomaly_score = sc["anomaly_score"]
            t_obj.anomaly_reason = sc["anomaly_reason"]
    db.commit()

    db.close()
    print("[ETL Pipeline] Database seed & spatiotemporal data mining pipeline completed successfully!")

if __name__ == "__main__":
    seed_database()
