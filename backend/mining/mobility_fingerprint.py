import math
import numpy as np
from collections import Counter

def calculate_radius_of_gyration(gps_points):
    """
    Computes Radius of Gyration (Rg) in km for a user's GPS points collection.
    Rg measures the characteristic distance of a user's travel area around center of mass.
    """
    if not gps_points or len(gps_points) < 2:
        return 0.0

    lats = [p["latitude"] for p in gps_points]
    lons = [p["longitude"] for p in gps_points]

    mean_lat = np.mean(lats)
    mean_lon = np.mean(lons)

    # Convert lat/lon offset to approximate kilometers
    # 1 deg lat ~ 111 km, 1 deg lon ~ 111 * cos(lat) km
    cos_lat = math.cos(math.radians(mean_lat))
    sq_dists = []

    for lat, lon in zip(lats, lons):
        dy = (lat - mean_lat) * 111.0
        dx = (lon - mean_lon) * 111.0 * cos_lat
        sq_dists.append(dx*dx + dy*dy)

    rg_km = math.sqrt(float(np.mean(sq_dists)))
    return round(rg_km, 2)

def calculate_regularity_score(cluster_sequences):
    """
    Calculates Regularity Score (0-100%) based on Shannon Entropy of user cluster visits.
    Low entropy = high routine predictability (high regularity score).
    """
    all_tokens = []
    for seq in cluster_sequences:
        all_tokens.extend([tok.strip() for tok in seq.split("->") if tok.strip()])

    if not all_tokens:
        return 50.0

    counts = Counter(all_tokens)
    total = len(all_tokens)

    entropy = 0.0
    for tok, c in counts.items():
        p = c / float(total)
        entropy -= p * math.log2(p)

    max_entropy = math.log2(len(counts)) if len(counts) > 1 else 1.0
    normalized_entropy = entropy / max_entropy if max_entropy > 0 else 0.0
    regularity_score = (1.0 - normalized_entropy) * 100.0
    return round(max(10.0, min(99.0, regularity_score)), 1)
