import datetime
import logging
from typing import Dict, Any, List
from app.services.notification_service import notification_service

logger = logging.getLogger("railpulse.alerts")

class AlertService:
    """
    Internal Smart Alerting and Anomaly Detection Engine.
    Generates structured alerts for significant delay spikes, dynamic ETA shifts, section congestion,
    downstream cascade risks, platform occupancy conflicts, and route cancellations/diversions.
    """

    def __init__(self):
        self.active_alerts: List[Dict[str, Any]] = [
            {
                "id": 1,
                "train_number": "12864",
                "station_id": "RJY",
                "alert_type": "PROPAGATION_RISK",
                "severity": "CRITICAL",
                "title": "High Cascade Risk: Train 12864 at Rajahmundry Outer",
                "message": "Train 12864 running +26m delay. Secondary train 17240 will suffer +18m delay within 17 mins if priority is not re-sequenced.",
                "is_resolved": False,
                "timestamp": datetime.datetime.utcnow().isoformat()
            },
            {
                "id": 2,
                "train_number": "17240",
                "station_id": "TDD",
                "alert_type": "CONFLICT_DETECTED",
                "severity": "WARNING",
                "title": "Platform 1 Occupancy Overlap at Tadepalligudem",
                "message": "Predicted arrival collision on Platform 1 with Train 12864. Platform reassignment recommended.",
                "is_resolved": False,
                "timestamp": datetime.datetime.utcnow().isoformat()
            },
            {
                "id": 3,
                "train_number": None,
                "station_id": "BZA",
                "alert_type": "HIGH_CONGESTION",
                "severity": "WARNING",
                "title": "Section Congestion: BZA → GNT Index 78/100",
                "message": "High traffic density: 5 active trains with average speed reduced to 34 km/h (MPS 100 km/h).",
                "is_resolved": False,
                "timestamp": datetime.datetime.utcnow().isoformat()
            },
            {
                "id": 4,
                "train_number": "12723",
                "station_id": "SKZR",
                "alert_type": "ETA_UPDATE",
                "severity": "INFO",
                "title": "ETA Optimized for Train 12723",
                "message": "Delay reduced from 12m to 8m due to clear green wave sectional clearance on KZJ-BPQ section.",
                "is_resolved": False,
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
        ]

    def get_all_alerts(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.active_alerts[:limit]

    async def create_alert(self, alert_type: str, severity: str, title: str, message: str, train_number: str = None, station_id: str = None) -> Dict[str, Any]:
        alert_obj = {
            "id": len(self.active_alerts) + 1,
            "train_number": train_number,
            "station_id": station_id,
            "alert_type": alert_type,
            "severity": severity,
            "title": title,
            "message": message,
            "is_resolved": False,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        self.active_alerts.insert(0, alert_obj)
        await notification_service.dispatch_alert(title, message)
        return alert_obj

    def resolve_alert(self, alert_id: int) -> bool:
        for alert in self.active_alerts:
            if alert["id"] == alert_id:
                alert["is_resolved"] = True
                return True
        return False

alert_service = AlertService()
