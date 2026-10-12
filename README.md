# LifeTrail: Human Mobility Intelligence Platform using Sequential and Spatial Data Mining

> **Tagline:** Understanding Human Mobility Through Spatiotemporal Pattern Mining  
> **Course Project:** Sequential and Spatial Data Mining  

---

## 📌 Executive Overview

**LifeTrail** is a university capstone web application that analyzes GPS trajectory logs from the **Microsoft GeoLife dataset** to discover human mobility patterns. Rather than simply predicting next locations, LifeTrail focuses on understanding movement behavior through interactive visualization, spatial hotspot clustering, sequential pattern mining, mobility fingerprints, and explainable anomaly detection.

### Key Capabilities & Mining Features
1. **Home Overview Dashboard**: Platform KPIs including total users, total GPS points, total trips, average travel distance, daily travel radius, and average stops.
2. **Trajectory Explorer & Replay**: Interactive map replay controls (play/pause/reset/speed 1x-5x), progress slider scrub, velocity graph, and start/end markers.
3. **Stay Point Detection & DBSCAN Hotspots**: Automatically detects stationary locations ($\Delta \text{dist} \le 200\text{m}$, $\Delta T \ge 15\text{min}$) and clusters stay points with DBSCAN ($\epsilon = 0.5\text{km}$, $minPts = 2$) into semantic spatial hotspots with convex hull boundaries.
4. **PrefixSpan Sequential Mining**: Discovers frequent movement sub-sequences ($C_1 \rightarrow C_3 \rightarrow C_2$) with support count, support ratio (%), confidence score (%), and explainable AI explanations.
5. **Mobility Fingerprints**: Computes Radius of Gyration ($R_g$) and Shannon Entropy Regularity Index for every user.
6. **Trajectory Anomaly Detection**: Scores trajectory deviations (distance Z-score, rare spatial hub visits, and low sequential pattern likelihood).
7. **Spatiotemporal Analytics Suite**: Interactive Plotly visual charts for trip distance histograms, stay duration distributions, cluster visit shares, and weekly travel volume.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.10, FastAPI, Uvicorn, SQLAlchemy ORM, SQLite (`lifetrail.db`).
- **Spatial Mining**: Scikit-Learn (DBSCAN with Haversine metric), GeoPandas, Shapely (Convex Hulls), NumPy, Pandas.
- **Sequential Mining**: Pure-Python **PrefixSpan** (Prefix-projected Sequential Pattern Mining) engine.
- **Frontend**: React 18, Vite, TailwindCSS, Lucide Icons.
- **GIS & Visualizations**: Leaflet, React-Leaflet, Plotly.js (`react-plotly.js`).
- **Documentation Engine**: `python-docx` for automated academic DOCX report compilation.

---

## 🚀 Quickstart & Installation Guide

### Prerequisites
- **Python 3.10+** (On macOS: `brew install python`)
- **Node.js v18+ & NPM** (On macOS: `brew install node`)

---

### 🍎 Option A: One-Command Startup on macOS

LifeTrail includes an automated runner script for macOS (Apple Silicon M1/M2/M3/M4 & Intel):

```bash
# Give execution permission (first time only)
chmod +x run_mac.sh

# Run both backend and frontend concurrently
./run_mac.sh
```

This script automatically:
1. Creates an isolated Python virtual environment (`backend/venv`) avoiding macOS PEP-668 restrictions.
2. Installs required Python and Node dependencies.
3. Initializes and seeds the SQLite database (`lifetrail.db`) if not present.
4. Starts FastAPI on `http://127.0.0.1:8000` and Vite on `http://localhost:3000`.
5. Handles clean process termination on `Ctrl+C`.

> **Note:** If you only want to set up dependencies without running the servers, run `./setup_mac.sh`.

---

### 💻 Option B: Manual Setup (macOS / Linux)

#### 1. Backend Setup & Data Mining Pipeline

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python requirements
pip install -r requirements.txt

# Run database ETL & mining pipeline
python3 seed_data.py

# Start FastAPI server
python3 -m uvicorn main:app --reload --port 8000
```
*FastAPI API documentation will be accessible at: `http://127.0.0.1:8000/docs`*

#### 2. Frontend Setup

```bash
# Open a new terminal in project root
cd frontend

# Install Node dependencies
npm install

# Launch Vite development server
npm run dev
```
*Access the Web Application in your browser at: `http://localhost:3000`*

---

### 🪟 Option C: Windows Setup

#### 1. Backend Setup

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python seed_data.py
uvicorn main:app --reload --port 8000
```

#### 2. Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

---

## 📄 Academic Project Reports Delivered

The project automatically includes three publication-grade Microsoft Word (`.docx`) documents inside the `/reports` directory:

1. **`reports/DA1_Project_Proposal.docx`**: Project proposal including problem statement, motivation, objectives, proposed architecture, and IEEE references.
2. **`reports/DA2_Design_and_Mid_Review_Report.docx`**: Design report covering database ER diagram, stay point methodology, DBSCAN spatial clustering, PrefixSpan algorithm, and intermediate results.
3. **`reports/DA3_Final_Review_Report.docx`**: Final report detailing comparative algorithm analysis (why PrefixSpan & DBSCAN), experimental evaluation metrics, screenshots, and conclusion.

To re-generate all reports at any time:
```bash
python scripts/generate_reports.py
```

---

## 📊 API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/overview` | Platform summary KPIs & metrics |
| `GET` | `/api/users` | List of monitored users & mobility fingerprints |
| `GET` | `/api/users/{id}/fingerprint` | Detailed mobility fingerprint & routines for a user |
| `GET` | `/api/trajectories` | Filterable list of trajectories |
| `GET` | `/api/trajectories/{id}` | High-density GPS point stream for map replay |
| `GET` | `/api/stay-points` | Detected stationary stay points |
| `GET` | `/api/clusters` | DBSCAN spatial clusters & convex hull polygons |
| `GET` | `/api/prefixspan` | Mined sequential rules with support & confidence |
| `GET` | `/api/anomalies` | Flagged abnormal trajectories & explainable reasons |
| `GET` | `/api/analytics` | Aggregated analytics distributions for Plotly charts |
| `POST` | `/api/reseed` | Re-run complete ETL and data mining pipeline |

---

## 🏆 Project Structure

```
seqproj/
├── backend/
│   ├── dataset_loader.py       # GeoLife parser & fallback synthesizer
│   ├── database.py             # SQLite SQLAlchemy engine setup
│   ├── models.py               # Database ORM models
│   ├── seed_data.py            # Complete ETL & data mining pipeline script
│   ├── main.py                 # FastAPI REST API endpoints
│   ├── requirements.txt        # Backend dependencies
│   └── mining/
│       ├── stay_points.py      # Stay Point Detection (Li et al., 2008)
│       ├── dbscan_clustering.py # Haversine DBSCAN & Convex Hulls
│       ├── prefixspan_mining.py # PrefixSpan Pattern Mining Engine
│       ├── mobility_fingerprint.py # Radius of Gyration & Shannon Entropy
│       └── anomaly_detection.py# Trajectory Anomaly Detector
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── components/         # Navbar, MetricCard
│       └── views/              # Home, Explorer, Spatial, Sequential, Fingerprint, Anomalies, Analytics
├── reports/
│   ├── DA1_Project_Proposal.docx
│   ├── DA2_Design_and_Mid_Review_Report.docx
│   └── DA3_Final_Review_Report.docx
└── scripts/
    └── generate_reports.py     # Academic DOCX compiler script
```
