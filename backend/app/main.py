import os
import sys
import asyncio
import json
import logging
from contextlib import asynccontextmanager

from typing import Optional
from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add backend to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.config import settings
from app.db.seed_data import seed_database
from app.api.endpoints import router as api_router
from app.services.railradar_service import railradar_service
from app.services.eta_service import eta_service
from app.services.congestion_service import congestion_service
from app.services.propagation_service import propagation_service
from app.services.alert_service import alert_service
from app.services.station_board_service import station_board_service
from app.services.websocket_manager import ws_manager
from app.services.event_pipeline_service import event_pipeline_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("railpulse.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting RailPulse Backend Services...")
    # Initialize and seed database tables
    try:
        seed_database()
    except Exception as e:
        logger.error("Database initialization failed: %s", e)
    
    # Initialize / verify XGBoost ML Model
    try:
        if eta_service.model_metadata is None:
            logger.info("Loading or training initial XGBoost model on startup...")
            eta_service._load_or_train_model()
    except Exception as e:
        logger.error("Model startup initialization error: %s", e)

    # Start event-driven background polling pipeline
    try:
        await event_pipeline_service.start()
    except Exception as e:
        logger.error("Event pipeline startup error: %s", e)

    logger.info("RailPulse Engine Ready. Live Interval: %ds. Mode: %s", settings.LIVE_UPDATE_INTERVAL_SECONDS, settings.ENVIRONMENT)
    yield
    logger.info("Shutting down RailPulse Backend Services...")
    try:
        await event_pipeline_service.stop()
    except Exception as e:
        logger.error("Event pipeline stop error: %s", e)

app = FastAPI(
    title="RailPulse — Dynamic Railway ETA & Delay Intelligence Platform",
    description="SIH26028 | Ministry of Railways | AI-Powered Dynamic ETA, Congestion & Propagation Intelligence",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in settings.CORS_ORIGINS else settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST API
app.include_router(api_router)

# Include RailRadar v1 Compatibility Router
v1_router = APIRouter(prefix="/v1", tags=["RailRadar v1"])

@v1_router.get("/trains/{train_number}/live")
async def v1_live(train_number: str):
    return await railradar_service.get_live_train(train_number)

@v1_router.get("/trains/{train_number}/route")
async def v1_route(train_number: str):
    return await railradar_service.get_train_route(train_number)

@v1_router.get("/trains/{train_number}")
async def v1_details(train_number: str):
    return await railradar_service.get_train_details(train_number)

@v1_router.get("/lookup/search/trains")
async def v1_search(q: Optional[str] = None, query: Optional[str] = None):
    search_term = q or query or ""
    results = await railradar_service.search_trains(search_term)
    return {"success": True, "data": results, "total": len(results)}

app.include_router(v1_router)

@app.get("/")
async def root():
    return {
        "platform": "RailPulse Dynamic Train ETA & Delay Intelligence Platform",
        "problem_statement": "SIH26028 — Ministry of Railways",
        "status": "ONLINE",
        "api_docs": "/docs",
        "redoc": "/redoc",
        "environment": settings.ENVIRONMENT,
        "capabilities": {
            "railradar_api": "CONNECTED" if settings.has_railradar else "SIMULATION_FALLBACK",
            "openweather_api": "CONNECTED" if settings.has_openweather else "OMITTED_OFFLINE",
            "database": "POSTGRESQL" if settings.has_postgres else "SQLITE_FALLBACK",
            "ml_eta_model": "XGBoost v2.1 (Python Native)",
            "websockets": "ACTIVE"
        }
    }

# --- Real-Time WebSocket Streaming Engine ---
@app.websocket("/ws/trains/{train_number}")
async def train_websocket_endpoint(websocket: WebSocket, train_number: str):
    """
    Real-time push channel streaming live train coordinates, XGBoost dynamic ETA updates,
    section congestion changes, delay propagation ripples, and smart alerts directly to the frontend.
    """
    train_num = str(train_number).strip()
    await ws_manager.connect_train(websocket, train_num)

    try:
        # Send immediate initial intelligence state
        initial_payload = await event_pipeline_service.recompute_and_broadcast_train(train_num)
        await websocket.send_text(json.dumps(initial_payload))

        # Keep connection open and send heartbeats / receive messages
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=25.0)
                # Client may request on-demand tick
                if "tick" in data.lower():
                    await event_pipeline_service.recompute_and_broadcast_train(train_num)
            except asyncio.TimeoutError:
                # Periodic heartbeat refresh
                payload = await event_pipeline_service.recompute_and_broadcast_train(train_num)
                await websocket.send_text(json.dumps(payload))
    except WebSocketDisconnect:
        ws_manager.disconnect_train(websocket, train_num)
    except Exception as e:
        logger.error("WebSocket stream error for Train %s: %s", train_num, e)
        ws_manager.disconnect_train(websocket, train_num)

@app.websocket("/ws/stations/{station_code}")
async def station_websocket_endpoint(websocket: WebSocket, station_code: str):
    """
    Real-time station display board push channel streaming dynamic ETA rows,
    confidence interval bands [P10-P90], platform tracks, and status changes.
    """
    st_code = str(station_code).strip().upper()
    await ws_manager.connect_station(websocket, st_code)

    try:
        # Send immediate initial board state
        board_data = station_board_service.get_station_board(st_code)
        payload = {
            "event_type": "board_update",
            "eventType": "board_update",
            "station_code": st_code,
            "stationCode": st_code,
            "board": board_data.get("board", []),
            "total_trains": board_data.get("total_trains", 0),
            "timestamp": board_data.get("timestamp")
        }
        await websocket.send_text(json.dumps(payload))

        # Keep connection open and send heartbeats
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=25.0)
                if "refresh" in data.lower() or "tick" in data.lower():
                    await event_pipeline_service.recompute_and_broadcast_station(st_code)
            except asyncio.TimeoutError:
                b_data = station_board_service.get_station_board(st_code)
                p = {
                    "event_type": "board_update",
                    "eventType": "board_update",
                    "station_code": st_code,
                    "stationCode": st_code,
                    "board": b_data.get("board", []),
                    "total_trains": b_data.get("total_trains", 0),
                    "timestamp": b_data.get("timestamp")
                }
                await websocket.send_text(json.dumps(p))
    except WebSocketDisconnect:
        ws_manager.disconnect_station(websocket, st_code)
    except Exception as e:
        logger.error("WebSocket stream error for Station %s: %s", st_code, e)
        ws_manager.disconnect_station(websocket, st_code)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

