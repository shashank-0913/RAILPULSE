import asyncio
import json
import sys
import os

# Set python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app

def test_phase4_all():
    client = TestClient(app)

    print("--- 1. Testing Health Endpoint ---")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health failed: {res.text}"
    data = res.json()
    print(f"Health OK: status={data.get('status')}, model_loaded={data.get('model_loaded')}")

    print("\n--- 2. Testing Station Display Board Endpoint (VSKP) ---")
    res = client.get("/api/stations/VSKP/board")
    assert res.status_code == 200, f"Station board failed: {res.text}"
    board = res.json()
    assert board["station_code"] == "VSKP"
    assert len(board["trains"]) > 0, "No trains returned on VSKP board"
    first_train = board["trains"][0]
    print(f"Station Board OK: station={board['station_name']} ({board['station_code']}), {len(board['trains'])} trains listed")
    print(f"  First train: #{first_train['train_number']} {first_train['train_name']} -> Sch: {first_train['scheduled_time']}, Exp: {first_train['predicted_time']} (80% band: [{first_train['confidence_band']['lower']} - {first_train['confidence_band']['upper']}]), Status: {first_train['status']}, Delay: +{first_train['delay_minutes']}m")

    print("\n--- 3. Testing Station Display Board Endpoint (DVD) ---")
    res = client.get("/api/stations/DVD/board")
    assert res.status_code == 200, f"DVD board failed: {res.text}"
    board_dvd = res.json()
    print(f"DVD Board OK: {len(board_dvd['trains'])} trains listed")

    print("\n--- 4. Testing What-If Simulation Endpoint ---")
    payload = {
        "train_number": "12864",
        "station_code": "RJY",
        "additional_delay": 20,
        "disturbance_type": "SIGNAL_FAILURE",
        "action_taken": "HOLD_PRIMARY"
    }
    res = client.post("/api/what-if", json=payload)
    assert res.status_code == 200, f"What-If failed: {res.text}"
    what_if = res.json()
    assert "scenarios" in what_if, "Scenarios missing from What-If"
    assert len(what_if["scenarios"]) == 3, f"Expected 3 scenarios, got {len(what_if['scenarios'])}"
    print(f"What-If OK: primary={what_if['primary_train']}, injection=+{what_if['injected_delay_minutes']}m")
    print(f"  AI Recommended Scenario: {what_if.get('recommended_scenario')}")
    for sc in what_if["scenarios"]:
        print(f"    Scenario {sc['id']} ({sc['title']}): total delay={sc['total_system_delay_minutes']}m, affected trains={len(sc['affected_trains'])}, impact={sc['impact_rating']}")

    print("\n--- 5. Testing Simulate Tick / Disturbance Injection ---")
    tick_payload = {
        "disturbance_name": "Congestion on VSKP-VZM outer section (+6 min)",
        "additional_delay_minutes": 6.0,
        "section": "VSKP-VZM",
        "primary_train": "12864"
    }
    res = client.post("/api/trains/simulate-tick", json=tick_payload)
    assert res.status_code == 200, f"Simulate tick failed: {res.text}"
    tick_res = res.json()
    print(f"Simulate Tick OK: tick #{tick_res.get('tick_number')}, event='{tick_res.get('injected_event')}', delay=+{tick_res.get('total_injected_delay_minutes')}m")

    print("\n--- 6. Testing Station Board after Disturbance (ETA updated) ---")
    res = client.get("/api/stations/VSKP/board")
    board_updated = res.json()
    t12864 = next((t for t in board_updated["trains"] if t["train_number"] == "12864"), None)
    assert t12864 is not None
    print(f"Train 12864 on VSKP Board after tick: Delay=+{t12864['delay_minutes']}m, Status={t12864['status']}, Exp={t12864['predicted_time']}")

    print("\n--- 7. Testing WebSocket endpoints ---")
    with client.websocket_connect("/ws/trains/12864") as ws_train:
        # Should receive initial connection message or eta_update
        data = ws_train.receive_json()
        print(f"Train WS connected: event={data.get('event')}, train={data.get('train_number')}")

    with client.websocket_connect("/ws/stations/VSKP") as ws_station:
        data = ws_station.receive_json()
        print(f"Station WS connected: event={data.get('event')}, station={data.get('station_code')}")

    print("\n=== ALL PHASE 4 INTEGRATION TESTS PASSED ===")

if __name__ == "__main__":
    test_phase4_all()
