import datetime
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("railpulse.recommendations")

class RecommendationService:
    """
    AI Decision-Support & Operational Recovery Engine.
    Generates actionable dispatch recommendations for section controllers
    (e.g., dynamic loop diversion, green-wave signal priority, platform reassignment).
    
    IMPORTANT:
    These are decision-support recommendations only.
    Clearly labeled: 'AI Decision Support — Human Approval Required'
    """

    def __init__(self):
        self.active_recommendations: List[Dict[str, Any]] = [
            {
                "id": "REC-BZA-01",
                "train_number": "12864",
                "train_name": "Howrah - SMVT Bengaluru SF Express",
                "station_id": "TDD",
                "station_name": "Tadepalligudem",
                "title": "Platform Reassignment & Loop Line Divert for Train 17240",
                "description": "Divert secondary Train 17240 (Simhadri Express) to Loop Line Platform 2 at Tadepalligudem. Allow primary delayed Train 12864 to pass on the Main Through Track without stopping.",
                "reasoning": "Train 12864 is running +26m behind schedule. Diverting Train 17240 saves 18 minutes of network cascade delay and prevents platform headway lock.",
                "action_type": "PLATFORM_REASSIGNMENT",
                "suggested_action": "REASSIGN_PF2_LOOP",
                "estimated_delay_saving_minutes": 18.0,
                "confidence_score": 0.94,
                "status": "PENDING_APPROVAL",
                "disclaimer": "AI Decision Support — Human Controller Approval Required",
                "created_at": datetime.datetime.utcnow().isoformat()
            },
            {
                "id": "REC-BZA-02",
                "train_number": "12723",
                "train_name": "Telangana Superfast Express",
                "station_id": "BPQ",
                "station_name": "Balharshah",
                "title": "Dynamic Green Wave Speed Advisory (+12 km/h)",
                "description": "Issue green wave signal clearance advisory on the KZJ-BPQ automatic block section. Authorize speed recovery up to 118 km/h (MPS 130 km/h).",
                "reasoning": "Sectional track occupancy ahead is completely clear for 48 km. Speed advisory recovers 6 minutes of prior dwell delay before Nagpur Junction.",
                "action_type": "SPEED_ADVISORY",
                "suggested_action": "AUTHORIZE_SPEED_RECOVERY",
                "estimated_delay_saving_minutes": 6.0,
                "confidence_score": 0.89,
                "status": "PENDING_APPROVAL",
                "disclaimer": "AI Decision Support — Human Controller Approval Required",
                "created_at": datetime.datetime.utcnow().isoformat()
            },
            {
                "id": "REC-VSKP-03",
                "train_number": "12728",
                "train_name": "Godavari Superfast Express",
                "station_id": "EE",
                "station_name": "Eluru",
                "title": "Regulate Station Dwell Time to Base 2.0 Minutes",
                "description": "Enforce strict 2-minute passenger boarding window at Eluru with automated platform dispatch countdown.",
                "reasoning": "Prevents dwell overrun during peak morning passenger interchange.",
                "action_type": "DWELL_REGULATION",
                "suggested_action": "ENFORCE_STRICT_DWELL",
                "estimated_delay_saving_minutes": 3.5,
                "confidence_score": 0.91,
                "status": "PENDING_APPROVAL",
                "disclaimer": "AI Decision Support — Human Controller Approval Required",
                "created_at": datetime.datetime.utcnow().isoformat()
            }
        ]
        self.action_history: List[Dict[str, Any]] = []

    def get_recommendations(self) -> Dict[str, Any]:
        return {
            "active_recommendations": self.active_recommendations,
            "action_history": self.action_history,
            "total_minutes_saved": sum(h.get("minutes_saved", 0) for h in self.action_history),
            "disclaimer": "AI Decision Support — Human Approval Required. Not represented as direct railway signalling control.",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

    def handle_controller_action(self, recommendation_id: str, action: str, controller_name: str = "Chief Controller", notes: str = None) -> Dict[str, Any]:
        rec = next((r for r in self.active_recommendations if r["id"] == recommendation_id), None)
        if not rec:
            return {"success": False, "message": f"Recommendation {recommendation_id} not found."}

        rec["status"] = action.upper()
        mins_saved = rec["estimated_delay_saving_minutes"] if action.upper() == "ACCEPTED" else 0.0

        audit_entry = {
            "recommendation_id": recommendation_id,
            "title": rec["title"],
            "train_number": rec["train_number"],
            "action": action.upper(),
            "controller_name": controller_name,
            "minutes_saved": mins_saved,
            "notes": notes or f"Action {action.upper()} by {controller_name}",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

        self.action_history.insert(0, audit_entry)
        return {
            "success": True,
            "action": action.upper(),
            "recommendation": rec,
            "audit_entry": audit_entry
        }

recommendation_service = RecommendationService()
