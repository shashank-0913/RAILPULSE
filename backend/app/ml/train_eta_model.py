import os
import logging
from typing import Optional, Dict, Any, List
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

FEATURE_LABEL_MAP = {
    "section_congestion": "Congestion in the section ahead",
    "current_delay": "Current initial delay",
    "previous_station_delay": "Delay accumulated at previous station",
    "historical_station_delay": "Historical station bottleneck",
    "station_dwell_time": "Station passenger dwell buffer",
    "distance_to_next_station": "Track distance to next station",
    "distance_to_destination": "Remaining journey route distance",
    "current_speed": "Current locomotive speed",
    "historical_route_delay": "Historical route corridor delay trend",
    "time_of_day": "Time-of-day peak traffic window",
    "rainfall": "Heavy rainfall on track section",
    "visibility": "Atmospheric track visibility",
    "wind_speed": "Sectional crosswind speed",
    "temperature": "Ambient track temperature",
    "day_of_week": "Day-of-week schedule density"
}

def generate_synthetic_railway_dataset(n_samples: int = 6000, random_state: int = 42) -> pd.DataFrame:
    """
    Generates a realistic synthetic dataset benchmarked on Indian Railways operating characteristics.
    Labeled as: Synthetic benchmark based on Indian Railways operating patterns
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

def train_and_save_model(model_save_path: str = None, extra_records_df: Optional[pd.DataFrame] = None):
    import datetime
    if model_save_path is None:
        model_save_path = os.path.join(os.path.dirname(__file__), "eta_xgboost_model.joblib")

    logger.info("Generating synthetic railway dataset benchmark...")
    df = generate_synthetic_railway_dataset(n_samples=6000)

    if extra_records_df is not None and not extra_records_df.empty:
        logger.info("Appending %d live recorded arrival records for continual learning...", len(extra_records_df))
        df = pd.concat([df, extra_records_df], ignore_index=True)

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

    # Predictions & Evaluation Metrics on Test Set
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    abs_errors = np.abs(y_test - y_pred)
    signed_residuals = y_test - y_pred

    within_3_min = float(np.mean(abs_errors <= 3.0) * 100)
    within_5_min = float(np.mean(abs_errors <= 5.0) * 100)
    within_10_min = float(np.mean(abs_errors <= 10.0) * 100)

    # 10th and 90th percentile errors for 80% prediction interval
    residual_p10 = float(np.percentile(signed_residuals, 10))
    residual_p90 = float(np.percentile(signed_residuals, 90))
    residual_std = float(np.std(signed_residuals))

    # Error distribution histogram binned breakdown
    residual_distribution = [
        {"range": "0-1 min", "percentage": round(float(np.mean(abs_errors <= 1.0) * 100), 1), "count": int(np.sum(abs_errors <= 1.0)), "color": "#10b981"},
        {"range": "1-2 min", "percentage": round(float(np.mean((abs_errors > 1.0) & (abs_errors <= 2.0)) * 100), 1), "count": int(np.sum((abs_errors > 1.0) & (abs_errors <= 2.0))), "color": "#34d399"},
        {"range": "2-3 min", "percentage": round(float(np.mean((abs_errors > 2.0) & (abs_errors <= 3.0)) * 100), 1), "count": int(np.sum((abs_errors > 2.0) & (abs_errors <= 3.0))), "color": "#38bdf8"},
        {"range": "3-5 min", "percentage": round(float(np.mean((abs_errors > 3.0) & (abs_errors <= 5.0)) * 100), 1), "count": int(np.sum((abs_errors > 3.0) & (abs_errors <= 5.0))), "color": "#06b6d4"},
        {"range": "5-10 min", "percentage": round(float(np.mean((abs_errors > 5.0) & (abs_errors <= 10.0)) * 100), 1), "count": int(np.sum((abs_errors > 5.0) & (abs_errors <= 10.0))), "color": "#f59e0b"},
        {"range": ">10 min", "percentage": round(float(np.mean(abs_errors > 10.0) * 100), 1), "count": int(np.sum(abs_errors > 10.0)), "color": "#ef4444"}
    ]

    # Feature Importance (Gain) with human-friendly labels
    raw_importances = model.feature_importances_.tolist()
    feature_importances = []
    for feat, imp in zip(FEATURE_NAMES, raw_importances):
        feature_importances.append({
            "feature": feat,
            "label": FEATURE_LABEL_MAP.get(feat, feat.replace("_", " ").title()),
            "importance": round(float(imp), 4),
            "percentage": round(float(imp) * 100, 1)
        })
    feature_importances.sort(key=lambda x: x["importance"], reverse=True)

    metadata = {
        "model": model,
        "metrics": {
            "mae": round(float(mae), 3),
            "maeMinutes": round(float(mae), 2),
            "rmse": round(float(rmse), 3),
            "rmseMinutes": round(float(rmse), 2),
            "r2": round(float(r2), 4),
            "r2Score": round(float(r2), 3),
            "within_3_min_percent": round(within_3_min, 1),
            "within_5_min_percent": round(within_5_min, 1),
            "within_10_min_percent": round(within_10_min, 1),
            "within5MinutesPercent": round(within_5_min, 1),
            "within10MinutesPercent": round(within_10_min, 1),
            "residual_p10": round(residual_p10, 2),
            "residual_p90": round(residual_p90, 2),
            "residual_std": round(residual_std, 2),
            "prediction_interval_label": "80% prediction interval",
            "train_records": len(X_train),
            "test_records": len(X_test),
            "total_records": len(df),
            "dataset_label": "Synthetic benchmark based on Indian Railways operating patterns",
            "trained_at": datetime.datetime.utcnow().isoformat()
        },
        "residual_distribution": residual_distribution,
        "feature_importances": feature_importances,
        "feature_names": FEATURE_NAMES,
        "model_type": "XGBoost Regressor v2.1 (Python Native)"
    }

    joblib.dump(metadata, model_save_path)
    logger.info("Model saved to %s (MAE=%.3f min, RMSE=%.3f min, R2=%.4f, ±5m=%.1f%%)", model_save_path, mae, rmse, r2, within_5_min)
    return metadata

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    train_and_save_model()
