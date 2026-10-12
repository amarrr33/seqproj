from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_code = Column(String(50), unique=True, index=True)  # e.g., "User_001"
    total_trips = Column(Integer, default=0)
    total_points = Column(Integer, default=0)
    total_distance_km = Column(Float, default=0.0)
    avg_daily_travel_km = Column(Float, default=0.0)
    radius_gyration_km = Column(Float, default=0.0)
    regularity_score = Column(Float, default=0.0)
    unique_locations_visited = Column(Integer, default=0)
    most_visited_cluster = Column(String(100), default="None")
    longest_trip_km = Column(Float, default=0.0)

    trajectories = relationship("Trajectory", back_populates="user", cascade="all, delete-orphan")
    stay_points = relationship("StayPoint", back_populates="user", cascade="all, delete-orphan")
    routines = relationship("Routine", back_populates="user", cascade="all, delete-orphan")

class Trajectory(Base):
    __tablename__ = "trajectories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    trip_code = Column(String(100), index=True)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    point_count = Column(Integer, default=0)
    total_distance_km = Column(Float, default=0.0)
    avg_speed_kmh = Column(Float, default=0.0)
    max_speed_kmh = Column(Float, default=0.0)
    duration_minutes = Column(Float, default=0.0)
    cluster_sequence_str = Column(String(500), default="")  # e.g., "C1 -> C3 -> C2"
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, default=0.0)
    anomaly_reason = Column(Text, default="")

    user = relationship("User", back_populates="trajectories")
    points = relationship("GPSPoint", back_populates="trajectory", cascade="all, delete-orphan")

class GPSPoint(Base):
    __tablename__ = "gps_points"

    id = Column(Integer, primary_key=True, index=True)
    trajectory_id = Column(Integer, ForeignKey("trajectories.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float, default=0.0)
    timestamp = Column(DateTime, nullable=False)
    sequence_index = Column(Integer, nullable=False)
    speed_kmh = Column(Float, default=0.0)

    trajectory = relationship("Trajectory", back_populates="points")

class StayPoint(Base):
    __tablename__ = "stay_points"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    arrival_time = Column(DateTime)
    departure_time = Column(DateTime)
    duration_minutes = Column(Float, default=0.0)
    visit_count = Column(Integer, default=1)
    cluster_id = Column(Integer, ForeignKey("spatial_clusters.id"), nullable=True)

    user = relationship("User", back_populates="stay_points")
    cluster = relationship("SpatialCluster", back_populates="stay_points")

class SpatialCluster(Base):
    __tablename__ = "spatial_clusters"

    id = Column(Integer, primary_key=True, index=True)
    cluster_label = Column(Integer, index=True)  # DBSCAN cluster id (0, 1, 2...)
    name = Column(String(150))                    # e.g. "Cluster 1: Tech Park"
    latitude = Column(Float, nullable=False)     # Centroid latitude
    longitude = Column(Float, nullable=False)    # Centroid longitude
    stay_point_count = Column(Integer, default=0)
    total_visits = Column(Integer, default=0)
    avg_stay_duration_min = Column(Float, default=0.0)
    radius_meters = Column(Float, default=200.0)
    convex_hull_json = Column(Text, default="[]")  # GeoJSON / list of [[lat, lon], ...]

    stay_points = relationship("StayPoint", back_populates="cluster")

class SequentialPattern(Base):
    __tablename__ = "sequential_patterns"

    id = Column(Integer, primary_key=True, index=True)
    pattern_sequence = Column(String(255), nullable=False) # e.g. "C1 -> C3 -> C2"
    pattern_length = Column(Integer, nullable=False)
    support_count = Column(Integer, nullable=False)
    support_ratio = Column(Float, nullable=False)         # e.g., 0.65 (65%)
    confidence_score = Column(Float, nullable=False)      # e.g., 0.82 (82%)
    explanation = Column(Text)

class Routine(Base):
    __tablename__ = "routines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    sequence_str = Column(String(255), nullable=False)  # e.g. "C1 (Home) -> C2 (Work) -> C3 (Gym)"
    frequency = Column(Integer, default=1)
    confidence = Column(Float, default=0.0)
    occurrences = Column(Integer, default=1)
    description = Column(Text)

    user = relationship("User", back_populates="routines")
