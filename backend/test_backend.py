import os
import sys
import asyncio
import json

# Force UTF-8 on stdout if available
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from app.config import settings
from app.db.database import Base, engine, DB_ENGINE_TYPE
from app.db.seed_data import seed_database
from app.services.railradar_service import railradar_service
from app.services.weather_service import weather_service
from app.services.eta_service import eta_service
from app.services.congestion_service import congestion_service
from app.services.propagation_service import propagation_service
from app.services.alert_service import alert_service
from app.services.simulation_service import simulation_service
from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    print("=" * 60)
    print("RAILPULSE BACKEND SERVICES & ML ENGINE VERIFICATION")
    print("=" * 60)

    # 1. Test Database Seeding & Models
    print("\n[1] Testing Database Models & Seeding...")
    seed_database()
    print(f"  [OK] Database Engine: {DB_ENGINE_TYPE}")

    # 2. Test RailRadar Service Normalization & Fallback
    print("\n[2] Testing RailRadar Service (Live / Simulation Fallback)...")
    loop = asyncio.get_event_loop()
    telemetry = loop.run_until_complete(railradar_service.get_live_train("12864"))
    print(f"  [OK] Train: {telemetry['train_number']} - {telemetry['train_name']}")
    print(f"  [OK] Position: {telemetry['latitude']}, {telemetry['longitude']} | Speed: {telemetry['speed_kmh']} km/h | Delay: {telemetry['delay_minutes']}m")
    print(f"  [OK] Data Source: {telemetry['data_source']} (is_simulated: {telemetry['is_simulated']})")
    assert "train_number" in telemetry
    assert "latitude" in telemetry

    # 3. Test OpenWeather Service (Graceful Omission)
    print("\n[3] Testing OpenWeather Service Graceful Omission...")
    weather = loop.run_until_complete(weather_service.get_weather_for_coordinates(17.0005, 81.8040))
    if weather:
        print(f"  [OK] Weather (Live): {weather['temperature_c']} C, {weather['weather_condition']}")
    else:
        print("  [OK] Weather unconfigured/offline: Gracefully omitted without crashing.")

    # 4. Test XGBoost ML ETA Engine
    print("\n[4] Testing XGBoost Dynamic ETA Prediction Engine...")
    eta_res = loop.run_until_complete(eta_service.predict_train_eta("12864"))
    print(f"  [OK] Predicted Delay: {eta_res['predicted_delay_minutes']} min (Confidence: {eta_res['confidence_score'] * 100:.1f}%)")
    print(f"  [OK] Dynamic Arrival: {eta_res['predicted_arrival_time']} | Is ML: {eta_res['is_ml_prediction']}")
    print(f"  [OK] Model: {eta_res['model_type']} | Metrics: {eta_res['model_metrics']}")
    print(f"  [OK] Weather Feature Status: {eta_res['weather_integration']}")
    print(f"  [OK] SHAP Contributions: {len(eta_res['shap_contributions'])} factors evaluated")
    assert "predicted_delay_minutes" in eta_res
    assert len(eta_res["upcoming_stops"]) > 0

    # 5. Test Congestion Engine
    print("\n[5] Testing Congestion Engine (0-100 Index)...")
    congestion = congestion_service.get_network_congestion()
    print(f"  [OK] Network Avg Congestion Index: {congestion['network_average_congestion_index']}/100")
    print(f"  [OK] High-Risk Bottlenecks: {congestion['high_risk_bottlenecks']}")
    for sec in congestion["sections"][:2]:
        print(f"    * {sec['section_name']}: Index {sec['congestion_index']} ({sec['severity']}) - {sec['primary_bottleneck']}")
    assert "sections" in congestion

    # 6. Test Propagation Engine
    print("\n[6] Testing Delay Propagation & Time-to-Impact...")
    propagation = propagation_service.analyze_train_propagation("12864")
    print(f"  [OK] Cascade Severity: {propagation['cascade_severity']} | Time-to-Impact: {propagation['time_to_impact_minutes']} minutes")
    print(f"  [OK] Affected Trains Count: {len(propagation['affected_trains'])}")
    for aff in propagation["affected_trains"][:2]:
        print(f"    * Train {aff['train_number']} ({aff['train_name']}): Projected Delay +{aff['projected_secondary_delay_minutes']}m ({aff['conflict_type']})")
    assert "time_to_impact_minutes" in propagation

    # 7. Test Simulation & What-If
    print("\n[7] Testing What-If Disruption Simulator...")
    what_if = simulation_service.evaluate_what_if("12864", 25.0)
    print(f"  [OK] Additional Delay: +{what_if['estimated_additional_delay']}m | Risk: {what_if['risk_level']}")
    print(f"  [OK] Generated Scenarios: {len(what_if['scenarios_comparison'])}")
    for sc in what_if["scenarios_comparison"]:
        pref = " [AI PREFERRED]" if sc["is_ai_preferred"] else ""
        print(f"    * {sc['title']}: Total Delay {sc['total_network_delay_minutes']}m{pref}")
    assert len(what_if["scenarios_comparison"]) == 3

    # 8. Test FastAPI REST Endpoints via TestClient
    print("\n[8] Testing FastAPI REST Endpoints...")
    client = TestClient(app)

    # /
    res = client.get("/")
    assert res.status_code == 200
    print("  [OK] GET / -> 200 OK")

    # /api/system/status
    res = client.get("/api/system/status")
    assert res.status_code == 200
    st_data = res.json()
    print(f"  [OK] GET /api/system/status -> 200 OK (RailRadar: {st_data['services']['railradar']['status']}, DB: {st_data['services']['database']['status']}, ML: {st_data['services']['ml_engine']['status']})")

    # /api/trains/12864/live
    res = client.get("/api/trains/12864/live")
    assert res.status_code == 200
    print("  [OK] GET /api/trains/12864/live -> 200 OK")

    # /api/trains/12864/eta
    res = client.get("/api/trains/12864/eta")
    assert res.status_code == 200
    print("  [OK] GET /api/trains/12864/eta -> 200 OK")

    # /api/trains/12864/route
    res = client.get("/api/trains/12864/route")
    assert res.status_code == 200
    print("  [OK] GET /api/trains/12864/route -> 200 OK")

    # /api/trains/12864/propagation
    res = client.get("/api/trains/12864/propagation")
    assert res.status_code == 200
    print("  [OK] GET /api/trains/12864/propagation -> 200 OK")

    # /api/analytics/congestion
    res = client.get("/api/analytics/congestion")
    assert res.status_code == 200
    print("  [OK] GET /api/analytics/congestion -> 200 OK")

    # /api/alerts
    res = client.get("/api/alerts")
    assert res.status_code == 200
    print("  [OK] GET /api/alerts -> 200 OK")

    # /api/simulation/status
    res = client.get("/api/simulation/status")
    assert res.status_code == 200
    print("  [OK] GET /api/simulation/status -> 200 OK")

    # /api/what-if
    res = client.post("/api/what-if", json={"train_number": "12864", "additional_delay_minutes": 20})
    assert res.status_code == 200
    print("  [OK] POST /api/what-if -> 200 OK")

    print("\n" + "=" * 60)
    print("ALL 8 BACKEND TEST SUITES PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
