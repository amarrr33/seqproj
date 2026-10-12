import os
import json
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import engine, Base, get_db
import models
from seed_data import seed_database

# Create tables if not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LifeTrail API",
    description="Human Mobility Intelligence Platform using Sequential and Spatial Data Mining",
    version="1.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Automatically seed database on first startup if empty
    db = next(get_db())
    user_count = db.query(models.User).count()
    if user_count == 0:
        print("[LifeTrail API] Database empty. Running initial ETL & Mining pipeline...")
        seed_database()

@app.get("/api/overview")
def get_overview(db: Session = Depends(get_db)):
    total_users = db.query(models.User).count()
    total_points = db.query(models.GPSPoint).count()
    total_trips = db.query(models.Trajectory).count()
    total_stay_points = db.query(models.StayPoint).count()

    avg_dist_query = db.query(func.avg(models.Trajectory.total_distance_km)).scalar() or 0.0
    avg_daily_query = db.query(func.avg(models.User.avg_daily_travel_km)).scalar() or 0.0

    return {
        "total_users": total_users,
        "total_gps_points": total_points,
        "total_trips": total_trips,
        "total_stay_points": total_stay_points,
        "avg_distance_km": round(float(avg_dist_query), 2),
        "avg_daily_travel_km": round(float(avg_daily_query), 2),
        "avg_stops_per_trip": round(total_stay_points / float(max(1, total_trips)), 1)
    }

@app.get("/api/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return [{
        "id": u.id,
        "user_code": u.user_code,
        "total_trips": u.total_trips,
        "total_points": u.total_points,
        "total_distance_km": u.total_distance_km,
        "avg_daily_travel_km": u.avg_daily_travel_km,
        "radius_gyration_km": u.radius_gyration_km,
        "regularity_score": u.regularity_score,
        "unique_locations_visited": u.unique_locations_visited,
        "most_visited_cluster": u.most_visited_cluster,
        "longest_trip_km": u.longest_trip_km
    } for u in users]

@app.get("/api/users/{user_id}/fingerprint")
def get_user_fingerprint(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    routines = db.query(models.Routine).filter(models.Routine.user_id == user_id).order_by(models.Routine.frequency.desc()).all()

    return {
        "user_id": user.id,
        "user_code": user.user_code,
        "total_trips": user.total_trips,
        "total_distance_km": user.total_distance_km,
        "avg_daily_travel_km": user.avg_daily_travel_km,
        "radius_gyration_km": user.radius_gyration_km,
        "regularity_score": user.regularity_score,
        "unique_locations_visited": user.unique_locations_visited,
        "most_visited_cluster": user.most_visited_cluster,
        "longest_trip_km": user.longest_trip_km,
        "routines": [{
            "sequence_str": r.sequence_str,
            "frequency": r.frequency,
            "confidence": r.confidence,
            "description": r.description
        } for r in routines]
    }

@app.get("/api/trajectories")
def get_trajectories(user_id: Optional[int] = None, is_anomaly: Optional[bool] = None, db: Session = Depends(get_db)):
    query = db.query(models.Trajectory)
    if user_id is not None:
        query = query.filter(models.Trajectory.user_id == user_id)
    if is_anomaly is not None:
        query = query.filter(models.Trajectory.is_anomaly == is_anomaly)

    trajectories = query.order_by(models.Trajectory.start_time.desc()).all()

    return [{
        "id": t.id,
        "user_id": t.user_id,
        "user_code": t.user.user_code if t.user else f"User_{t.user_id}",
        "trip_code": t.trip_code,
        "start_time": t.start_time.isoformat(),
        "end_time": t.end_time.isoformat(),
        "point_count": t.point_count,
        "total_distance_km": t.total_distance_km,
        "avg_speed_kmh": t.avg_speed_kmh,
        "max_speed_kmh": t.max_speed_kmh,
        "duration_minutes": t.duration_minutes,
        "cluster_sequence_str": t.cluster_sequence_str,
        "is_anomaly": t.is_anomaly,
        "anomaly_score": t.anomaly_score,
        "anomaly_reason": t.anomaly_reason
    } for t in trajectories]

@app.get("/api/trajectories/{trajectory_id}")
def get_trajectory_detail(trajectory_id: int, db: Session = Depends(get_db)):
    traj = db.query(models.Trajectory).filter(models.Trajectory.id == trajectory_id).first()
    if not traj:
        raise HTTPException(status_code=404, detail="Trajectory not found")

    points = db.query(models.GPSPoint).filter(models.GPSPoint.trajectory_id == trajectory_id).order_by(models.GPSPoint.sequence_index.asc()).all()

    return {
        "id": traj.id,
        "user_id": traj.user_id,
        "user_code": traj.user.user_code if traj.user else f"User_{traj.user_id}",
        "trip_code": traj.trip_code,
        "start_time": traj.start_time.isoformat(),
        "end_time": traj.end_time.isoformat(),
        "total_distance_km": traj.total_distance_km,
        "avg_speed_kmh": traj.avg_speed_kmh,
        "duration_minutes": traj.duration_minutes,
        "cluster_sequence_str": traj.cluster_sequence_str,
        "is_anomaly": traj.is_anomaly,
        "anomaly_score": traj.anomaly_score,
        "anomaly_reason": traj.anomaly_reason,
        "points": [{
            "latitude": p.latitude,
            "longitude": p.longitude,
            "altitude": p.altitude,
            "timestamp": p.timestamp.isoformat(),
            "sequence_index": p.sequence_index,
            "speed_kmh": p.speed_kmh
        } for p in points]
    }

@app.get("/api/stay-points")
def get_stay_points(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.StayPoint)
    if user_id is not None:
        query = query.filter(models.StayPoint.user_id == user_id)

    stay_points = query.all()
    return [{
        "id": sp.id,
        "user_id": sp.user_id,
        "user_code": sp.user.user_code if sp.user else f"User_{sp.user_id}",
        "latitude": sp.latitude,
        "longitude": sp.longitude,
        "arrival_time": sp.arrival_time.isoformat() if sp.arrival_time else None,
        "departure_time": sp.departure_time.isoformat() if sp.departure_time else None,
        "duration_minutes": sp.duration_minutes,
        "cluster_id": sp.cluster_id,
        "cluster_name": sp.cluster.name if sp.cluster else "Unclustered Noise"
    } for sp in stay_points]

@app.get("/api/clusters")
def get_spatial_clusters(db: Session = Depends(get_db)):
    clusters = db.query(models.SpatialCluster).all()
    res = []
    for c in clusters:
        hull = []
        if c.convex_hull_json:
            try:
                hull = json.loads(c.convex_hull_json)
            except Exception:
                hull = []
        res.append({
            "id": c.id,
            "cluster_label": c.cluster_label,
            "name": c.name,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "stay_point_count": c.stay_point_count,
            "total_visits": c.total_visits,
            "avg_stay_duration_min": c.avg_stay_duration_min,
            "radius_meters": c.radius_meters,
            "convex_hull": hull
        })
    return res

@app.get("/api/prefixspan")
def get_prefixspan_patterns(min_support: Optional[float] = None, db: Session = Depends(get_db)):
    query = db.query(models.SequentialPattern)
    if min_support is not None:
        query = query.filter(models.SequentialPattern.support_ratio >= min_support)

    patterns = query.order_by(models.SequentialPattern.support_count.desc()).all()
    return [{
        "id": p.id,
        "pattern_sequence": p.pattern_sequence,
        "pattern_length": p.pattern_length,
        "support_count": p.support_count,
        "support_ratio": p.support_ratio,
        "confidence_score": p.confidence_score,
        "explanation": p.explanation
    } for p in patterns]

@app.get("/api/routines")
def get_routines(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Routine)
    if user_id is not None:
        query = query.filter(models.Routine.user_id == user_id)

    routines = query.order_by(models.Routine.frequency.desc()).all()
    return [{
        "id": r.id,
        "user_id": r.user_id,
        "user_code": r.user.user_code if r.user else f"User_{r.user_id}",
        "sequence_str": r.sequence_str,
        "frequency": r.frequency,
        "confidence": r.confidence,
        "occurrences": r.occurrences,
        "description": r.description
    } for r in routines]

@app.get("/api/anomalies")
def get_anomalies(db: Session = Depends(get_db)):
    anomalies = db.query(models.Trajectory).filter(models.Trajectory.is_anomaly == True).order_by(models.Trajectory.anomaly_score.desc()).all()
    return [{
        "id": t.id,
        "user_id": t.user_id,
        "user_code": t.user.user_code if t.user else f"User_{t.user_id}",
        "trip_code": t.trip_code,
        "start_time": t.start_time.isoformat(),
        "total_distance_km": t.total_distance_km,
        "cluster_sequence_str": t.cluster_sequence_str,
        "anomaly_score": t.anomaly_score,
        "anomaly_reason": t.anomaly_reason
    } for t in anomalies]

@app.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db)):
    trajectories = db.query(models.Trajectory).all()
    clusters = db.query(models.SpatialCluster).all()
    stay_points = db.query(models.StayPoint).all()

    distances = [t.total_distance_km for t in trajectories]
    durations = [t.duration_minutes for t in trajectories]
    stay_durations = [sp.duration_minutes for sp in stay_points]

    cluster_names = [c.name.split(":")[1].strip() if ":" in c.name else c.name for c in clusters]
    cluster_counts = [c.total_visits for c in clusters]

    # Daily travel distribution
    day_counts = {"Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0}
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for t in trajectories:
        d_name = days[t.start_time.weekday()]
        day_counts[d_name] += 1

    return {
        "distance_distribution": distances,
        "travel_time_distribution": durations,
        "stay_duration_distribution": stay_durations,
        "cluster_sizes": {
            "labels": cluster_names,
            "values": cluster_counts
        },
        "weekly_travel": day_counts
    }

@app.post("/api/reseed")
def reseed_data():
    seed_database()
    return {"message": "Database reseeded successfully with full mining pipeline execution."}
