import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Index, Text
from sqlalchemy.orm import relationship
from app.db.database import Base

class Station(Base):
    __tablename__ = "stations"

    id = Column(String(20), primary_key=True, index=True)  # Station Code e.g. "BZA", "SC"
    code = Column(String(20), unique=True, index=True)
    name = Column(String(100), nullable=False)
    zone = Column(String(20), nullable=True)
    division = Column(String(50), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    platforms = Column(Integer, default=4)
    base_dwell_min = Column(Float, default=3.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    schedules = relationship("Schedule", back_populates="station")

class Train(Base):
    __tablename__ = "trains"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_number = Column(String(20), unique=True, index=True, nullable=False)
    train_name = Column(String(150), nullable=False)
    train_type = Column(String(50), default="SUPERFAST")
    origin_station_id = Column(String(20), ForeignKey("stations.id"), nullable=False)
    destination_station_id = Column(String(20), ForeignKey("stations.id"), nullable=False)
    total_distance_km = Column(Float, default=0.0)
    max_speed_kmh = Column(Float, default=110.0)
    priority_tier = Column(Integer, default=2)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    schedules = relationship("Schedule", back_populates="train")

class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    route_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    origin_code = Column(String(20), nullable=False)
    destination_code = Column(String(20), nullable=False)
    total_km = Column(Float, default=0.0)
    sections_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_number = Column(String(20), ForeignKey("trains.train_number"), index=True, nullable=False)
    station_id = Column(String(20), ForeignKey("stations.id"), index=True, nullable=False)
    route_id = Column(String(50), index=True, nullable=True)
    stop_sequence = Column(Integer, nullable=False)
    scheduled_arrival = Column(String(10), nullable=True)
    scheduled_departure = Column(String(10), nullable=True)
    distance_from_source_km = Column(Float, default=0.0)
    day_number = Column(Integer, default=1)

    # Relationships
    train = relationship("Train", back_populates="schedules")
    station = relationship("Station", back_populates="schedules")

    __table_args__ = (
        Index("idx_schedule_train_station", "train_number", "station_id"),
    )

class HistoricalDelay(Base):
    __tablename__ = "historical_delays"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_number = Column(String(20), index=True, nullable=False)
    station_id = Column(String(20), index=True, nullable=False)
    route_id = Column(String(50), index=True, nullable=True)
    arrival_delay_minutes = Column(Float, default=0.0)
    departure_delay_minutes = Column(Float, default=0.0)
    dwell_delay_minutes = Column(Float, default=0.0)
    speed_kmh = Column(Float, default=70.0)
    section_congestion_index = Column(Float, default=30.0)
    weather_condition = Column(String(50), default="Clear")
    temperature_c = Column(Float, nullable=True)
    rainfall_mm = Column(Float, nullable=True)
    day_of_week = Column(Integer, default=0) # 0=Monday
    time_of_day_hour = Column(Integer, default=12)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    __table_args__ = (
        Index("idx_hist_train_station_time", "train_number", "station_id", "timestamp"),
    )

class LiveTrainPosition(Base):
    __tablename__ = "live_train_positions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_number = Column(String(20), index=True, nullable=False)
    train_name = Column(String(150), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed_kmh = Column(Float, default=0.0)
    delay_minutes = Column(Float, default=0.0)
    current_status = Column(String(100), default="RUNNING")
    previous_station_id = Column(String(20), nullable=True)
    next_station_id = Column(String(20), nullable=True)
    next_halt_id = Column(String(20), nullable=True)
    data_source = Column(String(50), default="SIMULATED")  # "RAILRADAR_API" or "SIMULATED"
    is_live = Column(Boolean, default=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    __table_args__ = (
        Index("idx_live_train_time", "train_number", "timestamp"),
    )

class ETAPrediction(Base):
    __tablename__ = "eta_predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_number = Column(String(20), index=True, nullable=False)
    station_id = Column(String(20), index=True, nullable=False)
    predicted_arrival_time = Column(String(30), nullable=False)
    predicted_delay_minutes = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.85)
    lower_bound_delay = Column(Float, default=0.0)
    upper_bound_delay = Column(Float, default=0.0)
    model_version = Column(String(50), default="XGBoost-v2.1")
    is_baseline = Column(Boolean, default=False)
    feature_contributions_json = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    __table_args__ = (
        Index("idx_eta_train_station_time", "train_number", "station_id", "timestamp"),
    )

class WeatherObservation(Base):
    __tablename__ = "weather_observations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(String(20), index=True, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    temperature_c = Column(Float, nullable=True)
    precipitation_mm = Column(Float, nullable=True)
    wind_speed_kmh = Column(Float, nullable=True)
    visibility_km = Column(Float, nullable=True)
    weather_condition = Column(String(50), default="Clear")
    data_source = Column(String(50), default="OPENWEATHER")  # "OPENWEATHER" or "OMITTED_OFFLINE"
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class CongestionEvent(Base):
    __tablename__ = "congestion_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    section_id = Column(String(50), index=True, nullable=False)
    from_station = Column(String(20), nullable=False)
    to_station = Column(String(20), nullable=False)
    congestion_index = Column(Float, default=0.0) # 0 to 100
    active_trains_count = Column(Integer, default=1)
    average_speed_kmh = Column(Float, default=60.0)
    severity = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    observed_vs_predicted = Column(String(20), default="OBSERVED")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class DelayPropagation(Base):
    __tablename__ = "delay_propagations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    primary_train_number = Column(String(20), index=True, nullable=False)
    impacted_train_number = Column(String(20), index=True, nullable=False)
    shared_section_id = Column(String(50), nullable=True)
    estimated_delay_minutes = Column(Float, default=0.0)
    severity = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH
    time_to_impact_minutes = Column(Integer, default=0)
    cascade_depth = Column(Integer, default=1)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_number = Column(String(20), index=True, nullable=True)
    station_id = Column(String(20), nullable=True)
    alert_type = Column(String(50), nullable=False) # SIGNIFICANT_DELAY, ETA_CHANGE, CONGESTION, PROPAGATION_RISK, CONNECTION_RISK, CANCELLATION, DIVERSION
    severity = Column(String(20), default="INFO") # INFO, WARNING, CRITICAL
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class TrackedTrain(Base):
    __tablename__ = "tracked_trains"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_number = Column(String(20), index=True, nullable=False)
    user_id = Column(String(100), default="controller_1")
    notification_channels = Column(String(100), default="IN_APP") # "IN_APP,SMS,EMAIL,WHATSAPP"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(50), unique=True, index=True, nullable=False)
    status = Column(String(20), default="RUNNING") # RUNNING, STOPPED, COMPLETED, RESET
    scenario_name = Column(String(100), default="Default Disruption Sandbox")
    total_steps = Column(Integer, default=14)
    current_step = Column(Integer, default=1)
    simulated_data_json = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
