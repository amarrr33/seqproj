import math
import numpy as np

def haversine_distance_meters(lat1, lon1, lat2, lon2):
    """
    Computes Haversine distance in meters between two lat/lon points.
    """
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def detect_stay_points(gps_points_df, dist_thresh_m=200.0, time_thresh_min=15.0):
    """
    Detects stay points from a dataframe of ordered GPS points.
    DataFrame columns required: ['latitude', 'longitude', 'datetime']
    Returns list of dicts: [{latitude, longitude, arrival_time, departure_time, duration_minutes}]
    """
    if gps_points_df.empty or len(gps_points_df) < 2:
        return []

    stay_points = []
    i = 0
    n = len(gps_points_df)

    lats = gps_points_df["latitude"].values
    lons = gps_points_df["longitude"].values
    times = gps_points_df["datetime"].values

    while i < n:
        j = i + 1
        while j < n:
            dist = haversine_distance_meters(lats[i], lons[i], lats[j], lons[j])
            if dist > dist_thresh_m:
                time_diff_sec = (times[j-1] - times[i]) / np.timedelta64(1, 's')
                time_diff_min = time_diff_sec / 60.0
                if time_diff_min >= time_thresh_min:
                    # Calculate centroid lat/lon of points from i to j-1
                    mean_lat = float(np.mean(lats[i:j]))
                    mean_lon = float(np.mean(lons[i:j]))
                    arr_time = pd_to_datetime_safe(times[i])
                    dep_time = pd_to_datetime_safe(times[j-1])

                    stay_points.append({
                        "latitude": mean_lat,
                        "longitude": mean_lon,
                        "arrival_time": arr_time,
                        "departure_time": dep_time,
                        "duration_minutes": round(time_diff_min, 1)
                    })
                    i = j
                else:
                    i += 1
                break
            j += 1
        if j >= n:
            time_diff_sec = (times[n-1] - times[i]) / np.timedelta64(1, 's')
            time_diff_min = time_diff_sec / 60.0
            if time_diff_min >= time_thresh_min:
                mean_lat = float(np.mean(lats[i:n]))
                mean_lon = float(np.mean(lons[i:n]))
                arr_time = pd_to_datetime_safe(times[i])
                dep_time = pd_to_datetime_safe(times[n-1])

                stay_points.append({
                    "latitude": mean_lat,
                    "longitude": mean_lon,
                    "arrival_time": arr_time,
                    "departure_time": dep_time,
                    "duration_minutes": round(time_diff_min, 1)
                })
            break

    return stay_points

def pd_to_datetime_safe(val):
    """Converts numpy datetime64 or pandas Timestamp to python datetime object."""
    if hasattr(val, "to_pydatetime"):
        return val.to_pydatetime()
    return float_or_str_to_dt(val)

def float_or_str_to_dt(val):
    import pandas as pd
    ts = pd.to_datetime(val)
    return ts.to_pydatetime()
