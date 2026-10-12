import math
import json
import numpy as np
from sklearn.cluster import DBSCAN
from shapely.geometry import MultiPoint, Polygon

BEIJING_LANDMARKS = [
    (39.9997, 116.3265, "Tsinghua Residential & Student Hub"),
    (39.9834, 116.3156, "Zhongguancun High-Tech Park"),
    (39.9892, 116.3060, "Peking University Academic Complex"),
    (39.9087, 116.4605, "Beijing CBD Financial Center"),
    (39.9926, 116.3970, "Olympic Green Park & Sports Hub"),
    (39.9360, 116.4542, "Sanlitun Commercial & Shopping Zone"),
    (39.9118, 116.4116, "Wangfujing Cultural District"),
    (40.0799, 116.6031, "Capital International Airport Terminal"),
]

def find_nearest_landmark(lat, lon):
    best_dist = float('inf')
    best_name = "Spatial Hotspot"
    for l_lat, l_lon, name in BEIJING_LANDMARKS:
        d = math.sqrt((lat - l_lat)**2 + (lon - l_lon)**2)
        if d < best_dist:
            best_dist = d
            best_name = name
    return best_name

def cluster_stay_points_dbscan(stay_points_list, eps_km=0.5, min_samples=2):
    """
    Runs DBSCAN clustering on stay points using Haversine distance metric.
    Returns list of stay points with cluster_id assigned, and list of spatial cluster dicts.
    """
    if not stay_points_list:
        return stay_points_list, []

    coords = np.array([[sp["latitude"], sp["longitude"]] for sp in stay_points_list])

    # Convert degrees to radians for Haversine
    coords_rad = np.radians(coords)
    kms_per_radian = 6371.0088
    epsilon = eps_km / kms_per_radian

    db = DBSCAN(eps=epsilon, min_samples=min_samples, metric='haversine').fit(coords_rad)
    labels = db.labels_

    clusters_dict = {}
    for idx, sp in enumerate(stay_points_list):
        lbl = int(labels[idx])
        sp["cluster_id"] = lbl
        if lbl == -1:
            continue  # Noise point

        if lbl not in clusters_dict:
            clusters_dict[lbl] = []
        clusters_dict[lbl].append(sp)

    cluster_summaries = []
    for c_id, points in clusters_dict.items():
        c_lats = [p["latitude"] for p in points]
        c_lons = [p["longitude"] for p in points]
        c_durations = [p.get("duration_minutes", 0) for p in points]

        cent_lat = float(np.mean(c_lats))
        cent_lon = float(np.mean(c_lons))
        total_visits = len(points)
        avg_duration = round(float(np.mean(c_durations)), 1) if c_durations else 0.0

        # Compute Convex Hull for cluster visualization
        convex_hull_coords = []
        if len(points) >= 3:
            try:
                pts = [(p["latitude"], p["longitude"]) for p in points]
                mp = MultiPoint(pts)
                hull = mp.convex_hull
                if isinstance(hull, Polygon):
                    convex_hull_coords = list(hull.exterior.coords)
            except Exception:
                convex_hull_coords = []

        if not convex_hull_coords:
            # Generate a small circular polygon around centroid as fallback
            angles = np.linspace(0, 2*np.pi, 12)
            r = 0.002 # ~200 meters
            convex_hull_coords = [(cent_lat + r*np.sin(a), cent_lon + r*np.cos(a)) for a in angles]

        landmark_name = find_nearest_landmark(cent_lat, cent_lon)
        cluster_name = f"Cluster {c_id + 1}: {landmark_name}"

        cluster_summaries.append({
            "cluster_label": c_id,
            "name": cluster_name,
            "latitude": cent_lat,
            "longitude": cent_lon,
            "stay_point_count": len(points),
            "total_visits": total_visits,
            "avg_stay_duration_min": avg_duration,
            "convex_hull_json": json.dumps(convex_hull_coords)
        })

    return stay_points_list, cluster_summaries
