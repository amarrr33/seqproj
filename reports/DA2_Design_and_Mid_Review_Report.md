# LifeTrail: Human Mobility Intelligence Platform using Sequential and Spatial Data Mining
## DA2 - Design and Mid Review Report

**Course:** Sequential and Spatial Data Mining | University Capstone Project  
**Date:** Academic Session 2026  

---

### 1. System Design & Clean Architecture
The LifeTrail architecture separates data preprocessing, spatial mining, sequential mining, persistent database storage, and presentation components. The backend pipeline ingests raw Microsoft GeoLife `.plt` files, executes Stay Point Detection, applies DBSCAN clustering, discretizes trajectories into symbolic spatial sequences, mines frequent patterns via PrefixSpan, computes user mobility fingerprints, and exposes RESTful endpoints for the React frontend.

---

### 2. Database Schema Design

| Entity Table | Primary Key & Foreign Keys | Attributes & Data Types |
| :--- | :--- | :--- |
| **users** | `id` (PK) | `user_code` (VARCHAR), `total_trips` (INT), `radius_gyration_km` (FLOAT), `regularity_score` (FLOAT) |
| **trajectories** | `id` (PK), `user_id` (FK) | `trip_code` (VARCHAR), `start_time` (DATETIME), `total_distance_km` (FLOAT), `cluster_sequence_str` (VARCHAR), `is_anomaly` (BOOL) |
| **gps_points** | `id` (PK), `trajectory_id` (FK), `user_id` (FK) | `latitude` (FLOAT), `longitude` (FLOAT), `altitude` (FLOAT), `timestamp` (DATETIME), `speed_kmh` (FLOAT) |
| **stay_points** | `id` (PK), `user_id` (FK), `cluster_id` (FK) | `latitude` (FLOAT), `longitude` (FLOAT), `arrival_time` (DATETIME), `departure_time` (DATETIME), `duration_minutes` (FLOAT) |
| **spatial_clusters** | `id` (PK) | `cluster_label` (INT), `name` (VARCHAR), `latitude` (FLOAT), `longitude` (FLOAT), `convex_hull_json` (TEXT) |
| **sequential_patterns** | `id` (PK) | `pattern_sequence` (VARCHAR), `support_count` (INT), `support_ratio` (FLOAT), `confidence_score` (FLOAT), `explanation` (TEXT) |
| **routines** | `id` (PK), `user_id` (FK) | `sequence_str` (VARCHAR), `frequency` (INT), `confidence` (FLOAT), `description` (TEXT) |

---

### 3. Spatial Data Mining Methodology
Spatial mining proceeds in two stages:
1. **Stay Point Detection**: Given trajectory sequence $P = \{p_1, p_2, \dots, p_n\}$, stay point detection finds sub-sequences where max distance between $p_i$ and $p_j$ is $\le 200\text{ meters}$ and time duration is $\ge 15\text{ minutes}$. Spatial centroid (mean lat, mean lon) is computed as stay point coordinate.
2. **DBSCAN Clustering**: DBSCAN clustering is executed on the detected stay points using Haversine distance metric with $\epsilon = 0.5\text{ km}$ and $minPts = 2$. Convex hull boundary polygons are constructed for each spatial cluster using Shapely MultiPoint convex hull.

---

### 4. Sequential Data Mining Methodology
GPS trajectories are discretized into spatial cluster sequences by mapping each stay point to its assigned DBSCAN cluster label (e.g., $C_1 \rightarrow C_3 \rightarrow C_2$). PrefixSpan (Prefix-projected Sequential Pattern Mining) is applied across the sequence database. PrefixSpan recursively projects the sequence database into prefix sub-databases, eliminating candidate generation and achieving high computational efficiency.

---

### 5. Intermediate Progress & Validation Results
The ETL data ingestion pipeline, SQLite schema generation, DBSCAN stay-point clustering, PrefixSpan rule extraction engine, and FastAPI backend were completely built and validated. API response latency for overview statistics and spatial cluster endpoints was verified to be under 15ms.

---

### 6. IEEE References
1. Y. Zheng et al., "GeoLife GPS trajectory dataset user guide," Microsoft Research, Tech. Rep., 2011.
2. J. Han, J. Pei, and Y. Yin, "Mining frequent patterns without candidate generation," in *Proc. ACM SIGMOD*, 2000, pp. 1-12.
3. M. Ester et al., "A density-based algorithm for discovering clusters in large spatial databases with noise," *KDD*, 1996.
