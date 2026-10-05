import asyncio
import json
import logging
import datetime
from typing import Dict, Set, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("railpulse.websocket")

class WebSocketManager:
    """
    Manages active WebSocket client connections for:
    1. /ws/trains/{train_number} - Real-time train telemetry, dynamic ETA, SHAP, and 80% confidence intervals.
    2. /ws/stations/{station_code} - Real-time station display board updates.
    """

    def __init__(self):
        self.train_connections: Dict[str, Set[WebSocket]] = {}
        self.station_connections: Dict[str, Set[WebSocket]] = {}
        self.all_connections: Set[WebSocket] = set()
        self._background_task: Optional[asyncio.Task] = None
        self._is_running: bool = False

    async def connect_train(self, websocket: WebSocket, train_number: str):
        await websocket.accept()
        train_num = str(train_number).strip()
        if train_num not in self.train_connections:
            self.train_connections[train_num] = set()
        self.train_connections[train_num].add(websocket)
        self.all_connections.add(websocket)
        logger.info("WebSocket client connected to Train %s (total: %d)", train_num, len(self.train_connections[train_num]))

    def disconnect_train(self, websocket: WebSocket, train_number: str):
        train_num = str(train_number).strip()
        if train_num in self.train_connections:
            self.train_connections[train_num].discard(websocket)
            if not self.train_connections[train_num]:
                del self.train_connections[train_num]
        self.all_connections.discard(websocket)
        logger.info("WebSocket client disconnected from Train %s", train_num)

    async def connect_station(self, websocket: WebSocket, station_code: str):
        await websocket.accept()
        st_code = str(station_code).strip().upper()
        if st_code not in self.station_connections:
            self.station_connections[st_code] = set()
        self.station_connections[st_code].add(websocket)
        self.all_connections.add(websocket)
        logger.info("WebSocket client connected to Station %s (total: %d)", st_code, len(self.station_connections[st_code]))

    def disconnect_station(self, websocket: WebSocket, station_code: str):
        st_code = str(station_code).strip().upper()
        if st_code in self.station_connections:
            self.station_connections[st_code].discard(websocket)
            if not self.station_connections[st_code]:
                del self.station_connections[st_code]
        self.all_connections.discard(websocket)
        logger.info("WebSocket client disconnected from Station %s", st_code)

    async def broadcast_train_update(self, train_number: str, data: Dict[str, Any]):
        train_num = str(train_number).strip()
        conns = list(self.train_connections.get(train_num, []))
        if not conns:
            return

        message = json.dumps(data)
        disconnected = []
        for ws in conns:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.append(ws)

        for ws in disconnected:
            self.disconnect_train(ws, train_num)

    async def broadcast_station_update(self, station_code: str, data: Dict[str, Any]):
        st_code = str(station_code).strip().upper()
        conns = list(self.station_connections.get(st_code, []))
        if not conns:
            return

        message = json.dumps(data)
        disconnected = []
        for ws in conns:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.append(ws)

        for ws in disconnected:
            self.disconnect_station(ws, st_code)

    async def broadcast_all(self, data: Dict[str, Any]):
        message = json.dumps(data)
        disconnected = []
        for ws in list(self.all_connections):
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.append(ws)

        for ws in disconnected:
            self.all_connections.discard(ws)

ws_manager = WebSocketManager()
