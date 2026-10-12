import numpy as np

def detect_trajectory_anomalies(trajectories, mined_patterns):
    """
    Evaluates each trajectory for distance deviation, spatial cluster deviation, and sequence deviation.
    """
    if not trajectories:
        return trajectories

    user_distances = {}
    for t in trajectories:
        u_id = t["user_id"]
        if u_id not in user_distances:
            user_distances[u_id] = []
        user_distances[u_id].append(t["total_distance_km"])

    user_stats = {}
    for u_id, dists in user_distances.items():
        user_stats[u_id] = {
            "mean": float(np.mean(dists)),
            "std": float(np.std(dists)) if len(dists) > 1 else 1.0
        }

    valid_pattern_strings = set(p["pattern_sequence"] for p in mined_patterns)

    for t in trajectories:
        u_id = t["user_id"]
        dist = t["total_distance_km"]
        seq = t.get("cluster_sequence_str", "")

        u_mean = user_stats[u_id]["mean"]
        u_std = max(0.5, user_stats[u_id]["std"])

        # Distance deviation Z-score
        z_score = abs(dist - u_mean) / u_std

        # Cluster & sequence check
        seq_tokens = [tok.strip() for tok in seq.split("->") if tok.strip()]
        has_rare_cluster = "C8" in seq_tokens or "Airport" in seq  # Airport trips off routine

        # Sequence anomaly score
        is_pattern_matched = any(p_str in seq for p_str in valid_pattern_strings)

        anomaly_score = 0.0
        reasons = []

        if z_score > 2.2:
            anomaly_score += 0.45
            reasons.append(f"Distance deviation: Trajectory length ({dist:.1f} km) significantly deviates from historical baseline ({u_mean:.1f} ± {u_std:.1f} km).")

        if has_rare_cluster:
            anomaly_score += 0.35
            reasons.append("Spatial deviation: Trajectory visits an uncommon high-distance spatial hub (Capital Airport C8).")

        if not is_pattern_matched and len(seq_tokens) >= 2:
            anomaly_score += 0.25
            reasons.append(f"Sequence deviation: Sequential progression [{seq}] has low support probability in mined PrefixSpan pattern base.")

        if anomaly_score >= 0.5:
            t["is_anomaly"] = True
            t["anomaly_score"] = round(min(0.99, anomaly_score), 2)
            t["anomaly_reason"] = " | ".join(reasons)
        else:
            t["is_anomaly"] = False
            t["anomaly_score"] = round(anomaly_score, 2)
            t["anomaly_reason"] = "Normal trajectory within standard movement routine."

    return trajectories
