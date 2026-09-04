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
    logger.info("RailPulse Engine Ready. Live Interval: %ds. Mode: %s", settings.LIVE_UPDATE_INTERVAL_SECONDS, settings.ENVIRONMENT)
    yield
    logger.info("Shutting down RailPulse Backend Services...")

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
    await websocket.accept()
    train_num = str(train_number).strip()
    logger.info("WebSocket client connected for Train %s", train_num)

    try:
        while True:
            # Gather intelligence payload
            live_telemetry = await railradar_service.get_live_train(train_num)
            eta_data = await eta_service.predict_train_eta(train_num)
            congestion_data = congestion_service.get_network_congestion()
            propagation_data = propagation_service.analyze_train_propagation(train_num)
            recent_alerts = alert_service.get_all_alerts(limit=5)

            payload = {
                "event_type": "TRAIN_INTELLIGENCE_UPDATE",
                "train_number": train_num,
                "telemetry": live_telemetry,
                "eta": eta_data,
                "network_congestion": congestion_data,
                "propagation": propagation_data,
                "alerts": recent_alerts,
                "is_simulated": live_telemetry.get("is_simulated", True),
                "data_source_badge": live_telemetry.get("data_source", "SIMULATED"),
                "timestamp": eta_data.get("evaluated_at")
            }

            await websocket.send_text(json.dumps(payload))
            
            # Wait for configured interval (or 5s in demo development mode for smooth animation)
            interval = min(settings.LIVE_UPDATE_INTERVAL_SECONDS, 5)
            await asyncio.sleep(interval)

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected for Train %s", train_num)
    except Exception as e:
        logger.error("WebSocket stream error for Train %s: %s", train_num, e)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
