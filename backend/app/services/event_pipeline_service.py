import asyncio
import json
import logging
import datetime
import time
from typing import Dict, Any, List, Optional

from app.config import settings
from app.services.railradar_service import railradar_service
from app.services.eta_service import eta_service
from app.services.congestion_service import congestion_service
from app.services.propagation_service import propagation_service
from app.services.alert_service import alert_service
from app.services.weather_service import weather_service
from app.services.station_board_service import station_board_service
from app.services.websocket_manager import ws_manager

logger = logging.getLogger("railpulse.event_pipeline")

class EventPipelineService:
    """
    Real-Time Event-Driven ETA Recompute & WebSocket Push Pipeline.
    1. Polling: Background loop checks RailRadar / simulated telemetry every 60s (configurable).
    2. Event trigger: When position, speed, congestion, or delay changes, recomputes XGBoost ETAs,
       computes SHAP TreeExplainer, logs prediction, and pushes 'eta_update' over WebSockets.
    3. Weather: Refreshes from Open-Meteo every 15 min and feeds model inputs.
    4. Simulate Tick: Injects operational disturbances (e.g. +6m on VSKP–VZM) and triggers full push loop.
    """

    def __init__(self):
        self.tracked_trains: List[str] = ["12864", "12723", "12728", "17240", "20833", "12841"]
        self.tracked_stations: List[str] = ["VSKP", "DVD", "SCM", "VZM", "CHE", "RJY", "TDD", "EE", "BZA", "KGP", "HWH", "NDLS", "HYB", "SC"]
        self.last_weather_refresh: float = 0.0
        self.weather_refresh_interval_sec: float = 900.0  # 15 minutes
        self.is_running: bool = False
        self._background_task: Optional[asyncio.Task] = None
        self.injected_disturbances: Dict[str, Any] = {}
        self.tick_counter: int = 0

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        logger.info("Starting Event-Driven Pipeline Background Poller (Interval: %ds)...", settings.LIVE_UPDATE_INTERVAL_SECONDS)
        self._background_task = asyncio.create_task(self._run_loop())

    async def stop(self):
        self.is_running = False
        if self._background_task:
            self._background_task.cancel()
            try:
                await self._background_task
            except asyncio.CancelledError:
                pass
        logger.info("Event-Driven Pipeline stopped.")

    async def _run_loop(self):
        while self.is_running:
            try:
                await self.recompute_and_broadcast_all()
            except Exception as e:
                logger.error("Error in event pipeline loop: %s", e)

            # Sleep for configured interval
            interval = max(5, settings.LIVE_UPDATE_INTERVAL_SECONDS)
            await asyncio.sleep(interval)

    async def refresh_corridor_weather_if_needed(self):
        now = time.time()
        if now - self.last_weather_refresh > self.weather_refresh_interval_sec:
            logger.info("Refreshing Open-Meteo corridor weather for tracked stations...")
            try:
                for stn in ["VSKP", "VZM", "RJY", "BZA"]:
                    await weather_service.get_weather_for_station(stn)
                self.last_weather_refresh = now
            except Exception as e:
                logger.warning("Weather refresh failed: %s", e)

    async def recompute_and_broadcast_train(self, train_number: str) -> Dict[str, Any]:
        train_num = str(train_number).strip()
        live_telemetry = await railradar_service.get_live_train(train_num)
        eta_data = await eta_service.predict_train_eta(train_num)
        congestion_data = congestion_service.get_network_congestion()
        propagation_data = propagation_service.analyze_train_propagation(train_num)
        recent_alerts = alert_service.get_all_alerts(limit=5)

        now_iso = datetime.datetime.utcnow().isoformat()

        payload = {
            "event_type": "eta_update",
            "eventType": "eta_update",
            "train_number": train_num,
            "trainNumber": train_num,
            "telemetry": live_telemetry,
            "eta": eta_data,
            "network_congestion": congestion_data,
            "propagation": propagation_data,
            "alerts": recent_alerts,
            "is_simulated": live_telemetry.get("is_simulated", True),
            "data_source_badge": live_telemetry.get("data_source", "SIMULATED"),
            "timestamp": now_iso
        }

        # Broadcast to train WebSocket subscribers
        await ws_manager.broadcast_train_update(train_num, payload)
        return payload

    async def recompute_and_broadcast_station(self, station_code: str) -> Dict[str, Any]:
        st_code = str(station_code).strip().upper()
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

        # Broadcast to station WebSocket subscribers
        await ws_manager.broadcast_station_update(st_code, payload)
        return payload

    async def recompute_and_broadcast_all(self):
        await self.refresh_corridor_weather_if_needed()

        # Recompute each tracked train
        for t_num in self.tracked_trains:
            try:
                await self.recompute_and_broadcast_train(t_num)
            except Exception as e:
                logger.error("Error recomputing train %s: %s", t_num, e)

        # Broadcast station boards
        for st_code in self.tracked_stations:
            try:
                await self.recompute_and_broadcast_station(st_code)
            except Exception as e:
                logger.error("Error broadcasting station %s: %s", st_code, e)

    async def inject_disturbance_and_tick(
        self,
        section: str = "SEC_VSKP_VZM",
        disturbance_name: str = "Congestion & Signal Holding (+6m on VSKP–VZM)",
        additional_delay_minutes: float = 6.0,
        primary_train: str = "12864"
    ) -> Dict[str, Any]:
        """
        Injects a realistic operational disturbance (e.g. +6 min congestion on VSKP–VZM)
        and immediately executes the full event -> re-forecast -> push loop over all WebSockets.
        """
        self.tick_counter += 1
        logger.info("Simulate Tick Triggered: %s for Train %s (+%.1fm)", disturbance_name, primary_train, additional_delay_minutes)

        # Apply disturbance to train delay state & station board state
        current_injected = station_board_service.injected_delays.get(primary_train, 0.0)
        new_injected = current_injected + additional_delay_minutes
        station_board_service.set_injected_delay(primary_train, new_injected)

        # Also inject secondary cascade onto Train 17240 if delayed > 5 min
        if new_injected >= 5.0:
            station_board_service.set_injected_delay("17240", round(new_injected * 0.65, 1))

        self.injected_disturbances[primary_train] = {
            "section": section,
            "description": disturbance_name,
            "additional_delay": new_injected,
            "tick_number": self.tick_counter,
            "injected_at": datetime.datetime.utcnow().isoformat()
        }

        # Create alert for controller awareness
        try:
            await alert_service.create_alert(
                alert_type="DISTURBANCE_SIMULATION",
                severity="HIGH" if new_injected > 10 else "MODERATE",
                title=f"Disturbance Injected: {disturbance_name}",
                message=f"Operational tick #{self.tick_counter} injected +{additional_delay_minutes}m disturbance on section {section}. XGBoost re-forecast running.",
                train_number=primary_train
            )
        except Exception as e:
            logger.warning(f"Failed to post alert for disturbance: {e}")

        # Execute full recompute & broadcast across all channels
        await self.recompute_and_broadcast_all()

        return {
            "success": True,
            "tick_number": self.tick_counter,
            "injected_event": disturbance_name,
            "section": section,
            "primary_train": primary_train,
            "total_injected_delay_minutes": new_injected,
            "recomputed_trains": self.tracked_trains,
            "broadcast_channels": [
                f"/ws/trains/{primary_train}",
                *[f"/ws/stations/{st}" for st in ["VSKP", "DVD", "SCM", "VZM", "BZA"]]
            ],
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

event_pipeline_service = EventPipelineService()
