import os
import glob
import math
import random
import datetime
import pandas as pd
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "geolife_data")

# Real-world Beijing Mobility Landmarks (Center of GeoLife Dataset)
BEIJING_HUBS = {
    "C1": {"name": "Tsinghua Residential & Student Hub", "lat": 39.9997, "lon": 116.3265},
    "C2": {"name": "Zhongguancun High-Tech Park", "lat": 39.9834, "lon": 116.3156},
    "C3": {"name": "Peking University Academic Complex", "lat": 39.9892, "lon": 116.3060},
    "C4": {"name": "Beijing CBD Financial Center", "lat": 39.9087, "lon": 116.4605},
    "C5": {"name": "Olympic Green Park & Sports Hub", "lat": 39.9926, "lon": 116.3970},
    "C6": {"name": "Sanlitun Commercial & Shopping Zone", "lat": 39.9360, "lon": 116.4542},
    "C7": {"name": "Wangfujing Cultural District", "lat": 39.9118, "lon": 116.4116},
    "C8": {"name": "Capital International Airport Terminal", "lat": 40.0799, "lon": 116.6031},
}

def generate_geolife_synthetic_dataset(data_dir=DATA_DIR, num_users=12, trips_per_user=15):
    """
    Generates authentic GeoLife format PLT trajectory files for testing & simulation
    when GeoLife server is unreachable. Uses actual Beijing GeoLife bounding box & format.
    """
    os.makedirs(data_dir, exist_ok=True)
    hub_keys = list(BEIJING_HUBS.keys())

    # Typical daily routine patterns
    common_routines = [
        ["C1", "C2", "C3", "C1"], # Tsinghua -> Tech Park -> Peking Univ -> Tsinghua
        ["C1", "C2", "C6", "C1"], # Home -> Tech Park -> Sanlitun -> Home
        ["C3", "C2", "C4", "C3"], # Peking Univ -> Tech Park -> CBD -> Peking Univ
        ["C1", "C5", "C7", "C1"], # Home -> Olympic Park -> Wangfujing -> Home
        ["C1", "C8", "C4", "C1"], # Home -> Airport -> CBD -> Home
    ]

    base_date = datetime.datetime(2009, 4, 1, 7, 30, 0) # Historical GeoLife timeline

    for u_idx in range(num_users):
        user_code = f"User_{u_idx+1:03d}"
        user_folder = os.path.join(data_dir, user_code, "Trajectory")
        os.makedirs(user_folder, exist_ok=True)

        user_routine = common_routines[u_idx % len(common_routines)]

        for trip_idx in range(trips_per_user):
            trip_date = base_date + datetime.timedelta(days=trip_idx + u_idx*2, hours=random.randint(0, 3))
            plt_filename = trip_date.strftime("%Y%m%d%H%M%S.plt")
            plt_path = os.path.join(user_folder, plt_filename)

            # Determine route sequence (90% normal routine, 10% anomaly route)
            is_anomaly_trip = (trip_idx == trips_per_user - 1 and u_idx in [2, 5, 9])
            if is_anomaly_trip:
                # Outlier route (e.g. abrupt trip to Airport + far off-path)
                selected_hubs = ["C1", "C8", "C6", "C8"]
            else:
                selected_hubs = user_routine

            records = []
            curr_time = trip_date

            for h_i in range(len(selected_hubs) - 1):
                start_hub = BEIJING_HUBS[selected_hubs[h_i]]
                end_hub = BEIJING_HUBS[selected_hubs[h_i+1]]

                # Stay at start_hub for 15-45 minutes
                stay_mins = random.randint(15, 45) if h_i > 0 else 5
                for _ in range(stay_mins * 6): # Every 10 seconds
                    curr_time += datetime.timedelta(seconds=10)
                    jitter_lat = start_hub["lat"] + random.gauss(0, 0.00015)
                    jitter_lon = start_hub["lon"] + random.gauss(0, 0.00015)
                    days_flt = (curr_time - datetime.datetime(1899, 12, 30)).total_seconds() / 86400.0
                    records.append(f"{jitter_lat:.6f},{jitter_lon:.6f},0,50,{days_flt:.6f},{curr_time.strftime('%Y-%m-%d')},{curr_time.strftime('%H:%M:%S')}")

                # Transit from start_hub to end_hub (15-30 steps interpolation)
                steps = random.randint(30, 60)
                for s in range(steps):
                    frac = s / float(steps)
                    t_lat = start_hub["lat"] + (end_hub["lat"] - start_hub["lat"]) * frac + random.gauss(0, 0.0002)
                    t_lon = start_hub["lon"] + (end_hub["lon"] - start_hub["lon"]) * frac + random.gauss(0, 0.0002)
                    curr_time += datetime.timedelta(seconds=random.randint(5, 15))
                    days_flt = (curr_time - datetime.datetime(1899, 12, 30)).total_seconds() / 86400.0
                    records.append(f"{t_lat:.6f},{t_lon:.6f},0,50,{days_flt:.6f},{curr_time.strftime('%Y-%m-%d')},{curr_time.strftime('%H:%M:%S')}")

            # Write GeoLife PLT file header and records
            header = [
                "Geolife trajectory",
                "WGS 84",
                "Altitude is in Feet",
                "Reserved 3",
                "0,2,255,My Track",
                "0"
            ]
            with open(plt_path, "w", encoding="utf-8") as f:
                f.write("\n".join(header) + "\n")
                f.write("\n".join(records) + "\n")

    print(f"[DatasetLoader] Generated {num_users} users with {trips_per_user} trips each in {data_dir}")

def parse_geolife_plt(file_path):
    """
    Parses a single GeoLife .plt trajectory file into a Pandas DataFrame.
    """
    try:
        df = pd.read_csv(
            file_path,
            skiprows=6,
            header=None,
            names=["latitude", "longitude", "reserved", "altitude", "days", "date_str", "time_str"]
        )
        df["datetime"] = pd.to_datetime(df["date_str"] + " " + df["time_str"])
        df = df.sort_values("datetime").reset_index(drop=True)
        return df
    except Exception as e:
        print(f"Error parsing PLT file {file_path}: {e}")
        return pd.DataFrame()
