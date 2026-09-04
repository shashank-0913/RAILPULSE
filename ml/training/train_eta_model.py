import os
import sys

# Ensure backend is on sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backend"))

from app.ml.train_eta_model import train_and_save_model

if __name__ == "__main__":
    print("==================================================")
    print("RAILPULSE — XGBoost ETA Model Training Pipeline")
    print("Dataset: DEMO / SYNTHETIC DATASET (Indian Railways Operational Benchmarks)")
    print("==================================================")
    metadata = train_and_save_model()
    print("\n--- Training Results ---")
    print(f"Model Type: {metadata['model_type']}")
    print(f"MAE (Mean Absolute Error): {metadata['metrics']['mae']} minutes")
    print(f"RMSE (Root Mean Square Error): {metadata['metrics']['rmse']} minutes")
    print(f"R² Score: {metadata['metrics']['r2']}")
    print("\nTop 5 Feature Importances:")
    for feat, imp in metadata["feature_importances"][:5]:
        print(f"  • {feat:30s}: {imp * 100:.2f}%")
