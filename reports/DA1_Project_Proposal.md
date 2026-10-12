# LifeTrail: Human Mobility Intelligence Platform using Sequential and Spatial Data Mining
## DA1 - Project Proposal

**Course:** Sequential and Spatial Data Mining | University Capstone Project  
**Date:** Academic Session 2026  

---

### 1. Abstract
Human mobility intelligence is critical for smart city urbanization, transportation planning, epidemic contact tracing, and location-based services. This project introduces **LifeTrail**, a unified spatiotemporal mobility intelligence application that mines high-density GPS trajectories from the **Microsoft GeoLife dataset**. Unlike conventional next-location predictors, LifeTrail combines **Spatial Data Mining** (Stay Point Detection and DBSCAN Clustering) with **Sequential Data Mining** (PrefixSpan Pattern Mining) to extract semantic spatial hotspots, recurring movement routines, user mobility fingerprints (Radius of Gyration, Shannon entropy regularity), and trajectory anomalies. The system features a web dashboard built with **FastAPI, React, Vite, TailwindCSS, SQLite, Leaflet, and Plotly**.

---

### 2. Problem Statement & Motivation
Raw GPS trajectory logs recorded by mobile devices contain vast amounts of unorganized coordinate streams. Extracting actionable human mobility patterns presents major technical challenges:
1. High GPS noise and sampling irregularity.
2. Difficulty in discovering semantic stationary hubs (stay points) without ground-truth labels.
3. Severe computational explosion when searching for multi-step movement routines across continuous spatial coordinates.
4. Identifying subtle trajectory anomalies that deviate from a user's historical baseline.

LifeTrail addresses these challenges through a non-candidate-generation PrefixSpan sequential miner and Haversine-based DBSCAN spatial clustering.

---

### 3. Project Objectives
- Build an end-to-end web platform for Microsoft GeoLife trajectory parsing and analytics.
- Implement Stay Point Detection (Li et al., 2008) with spatial distance ($200\text{m}$) and temporal thresholds ($15\text{ mins}$).
- Perform Spatial DBSCAN Clustering to extract spatial hotspots and convex hull polygons.
- Execute PrefixSpan Sequential Pattern Mining to discover frequent mobility sub-sequences with support and confidence metrics.
- Compute per-user Mobility Fingerprints including Radius of Gyration ($R_g$) and Shannon Entropy Regularity Index.
- Develop a Spatiotemporal Anomaly Detector evaluating distance deviations, spatial hub mismatches, and sequence probabilities.

---

### 4. Proposed System Architecture & Tech Stack

| Layer | Technology / Library | Role & Description |
| :--- | :--- | :--- |
| **Backend Service** | Python 3.10, FastAPI, Uvicorn | High-performance async REST API framework handling data requests |
| **Spatial Data Mining** | Scikit-Learn, GeoPandas, Shapely | DBSCAN Haversine spatial clustering, convex hull polygon generation |
| **Sequential Mining** | Custom Pure-Python PrefixSpan | Prefix-projected sequential pattern mining engine |
| **Database** | SQLite, SQLAlchemy ORM | Relational persistence for users, trajectories, stay points, clusters, rules |
| **Frontend UI** | React 18, Vite, TailwindCSS | Modern dark-themed responsive dashboard interface |
| **GIS & Charts** | Leaflet, React-Leaflet, Plotly.js | Interactive trajectory playback, heatmap layer, Plotly analytics charts |

---

### 5. Expected Outcomes & Novelty
The project delivers a fully working human mobility intelligence platform. Novelty lies in combining spatial stay-point clustering with PrefixSpan sequential rule discovery to provide fully explainable mobility insights (e.g., explaining why a route was mined or why a trajectory was flagged as an anomaly).

---

### 6. IEEE References
1. Y. Zheng, Q. Li, Y. Chen, X. Xie, and W. Y. Ma, "Understanding mobility based on GPS data," in *Proc. ACM Ubicomp*, 2008, pp. 312-321.
2. J. Pei, J. Han, B. Mortazavi-Asl, J. Wang, H. Pinto, Q. Chen, U. Dayal, and M. C. Hsu, "Mining sequential patterns by pattern-growth: The PrefixSpan approach," *IEEE Trans. Knowl. Data Eng.*, vol. 16, no. 11, pp. 1424-1440, Nov. 2004.
3. M. Ester, H. P. Kriegel, J. Sander, and X. Xu, "A density-based algorithm for discovering clusters in large spatial databases with noise," in *Proc. KDD*, 1996, pp. 226-231.
4. C. Song, Z. Qu, N. Blumm, and A. L. Barabási, "Limits of predictability in human mobility," *Science*, vol. 327, no. 5968, pp. 1018-1021, 2010.
