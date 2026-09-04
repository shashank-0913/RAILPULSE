import os
import logging
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import joblib

logger = logging.getLogger("railpulse.ml.train")

FEATURE_NAMES = [
    "current_delay",
    "current_speed",
    "distance_to_next_station",
    "distance_to_destination",
    "historical_station_delay",
    "historical_route_delay",
    "previous_station_delay",
    "station_dwell_time",
    "section_congestion",
    "time_of_day",
    "day_of_week",
    "temperature",
    "rainfall",
    "wind_speed",
    "visibility"
]

def generate_synthetic_railway_dataset(n_samples: int = 5000, random_state: int = 42) -> pd.DataFrame:
    """
    Generates a realistic synthetic dataset benchmarked on Indian Railways operating characteristics.
    Labeled as: DEMO / SYNTHETIC DATASET
    """
    np.random.seed(random_state)

    current_delay = np.clip(np.random.exponential(scale=12.0, size=n_samples), 0, 180)
    current_speed = np.clip(np.random.normal(loc=75.0, scale=20.0, size=n_samples), 10, 130)
    distance_to_next_station = np.random.uniform(5.0, 120.0, size=n_samples)
    distance_to_destination = distance_to_next_station + np.random.uniform(50.0, 1200.0, size=n_samples)
    
    historical_station_delay = np.clip(np.random.normal(loc=8.0, scale=6.0, size=n_samples), 0, 60)
    historical_route_delay = np.clip(np.random.normal(loc=15.0, scale=10.0, size=n_samples), 0, 120)
    previous_station_delay = np.clip(current_delay * 0.85 + np.random.normal(0, 3, size=n_samples), 0, 150)
    station_dwell_time = np.clip(np.random.normal(loc=4.0, scale=2.5, size=n_samples), 1, 25)
    section_congestion = np.random.uniform(10.0, 95.0, size=n_samples)
    
    time_of_day = np.random.uniform(0.0, 24.0, size=n_samples)
    day_of_week = np.random.randint(0, 7, size=n_samples)
    
    temperature = np.random.uniform(15.0, 42.0, size=n_samples)
    rainfall = np.random.choice([0.0, 2.0, 12.0, 45.0], size=n_samples, p=[0.75, 0.15, 0.08, 0.02])
    wind_speed = np.random.uniform(5.0, 45.0, size=n_samples)
    visibility = np.clip(10.0 - rainfall * 0.15 + np.random.normal(0, 0.5, size=n_samples), 0.5, 10.0)

    # Physical Ground Truth Delay Propagation Equation with Stochastic Noise
    congestion_penalty = (section_congestion / 100.0) ** 1.8 * 22.0
    speed_deficit_penalty = np.maximum(0, (80.0 - current_speed) / 80.0) * (distance_to_next_station / 15.0)
    weather_penalty = (rainfall * 0.35) + np.maximum(0, (3.0 - visibility) * 2.0)
    peak_hour_penalty = np.where(((time_of_day >= 8) & (time_of_day <= 11)) | ((time_of_day >= 17) & (time_of_day <= 21)), 4.5, 0.0)
    
    # Target: additional delay in minutes on arrival at next station
    target_additional_delay = (
        0.55 * current_delay +
        0.20 * historical_station_delay +
        congestion_penalty +
        speed_deficit_penalty +
        weather_penalty +
        peak_hour_penalty +
        (station_dwell_time - 3.0) * 0.8 +
        np.random.normal(0, 2.0, size=n_samples)
    )
    target_additional_delay = np.clip(target_additional_delay, 0, 240)

    df = pd.DataFrame({
        "current_delay": current_delay,
        "current_speed": current_speed,
        "distance_to_next_station": distance_to_next_station,
        "distance_to_destination": distance_to_destination,
        "historical_station_delay": historical_station_delay,
        "historical_route_delay": historical_route_delay,
        "previous_station_delay": previous_station_delay,
        "station_dwell_time": station_dwell_time,
        "section_congestion": section_congestion,
        "time_of_day": time_of_day,
        "day_of_week": day_of_week,
        "temperature": temperature,
        "rainfall": rainfall,
        "wind_speed": wind_speed,
        "visibility": visibility,
        "target_delay_minutes": target_additional_delay
    })
    
    return df

def train_and_save_model(model_save_path: str = None):
    if model_save_path is None:
        model_save_path = os.path.join(os.path.dirname(__file__), "eta_xgboost_model.joblib")

    logger.info("Generating synthetic railway dataset (DEMO / SYNTHETIC DATASET)...")
    df = generate_synthetic_railway_dataset(n_samples=6000)

    X = df[FEATURE_NAMES]
    y = df["target_delay_minutes"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    logger.info("Training XGBoost Regressor for ETA & delay forecasting...")
    model = xgb.XGBRegressor(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        objective="reg:squarederror"
    )
    model.fit(X_train, y_train)

    # Predictions & Evaluation Metrics
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    # Feature Importance (Gain)
    importance_dict = dict(zip(FEATURE_NAMES, model.feature_importances_.tolist()))
    sorted_importances = sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)

    metadata = {
        "model": model,
        "metrics": {
            "mae": round(float(mae), 3),
            "rmse": round(float(rmse), 3),
            "r2": round(float(r2), 4),
            "test_samples": len(y_test),
            "dataset_label": "DEMO / SYNTHETIC DATASET (Indian Railways Operational Benchmarks)"
        },
        "feature_importances": sorted_importances,
        "feature_names": FEATURE_NAMES,
        "model_type": "XGBoost Regressor (Python Native)"
    }

    joblib.dump(metadata, model_save_path)
    logger.info("Model saved to %s with MAE=%.3f, RMSE=%.3f, R2=%.4f", model_save_path, mae, rmse, r2)
    return metadata

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    train_and_save_model()
