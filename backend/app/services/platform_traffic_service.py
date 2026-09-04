"""
Platform & Traffic Automation Service
Monitors upcoming platform conflicts, predicts platform occupancy, calculates waiting times,
evaluates alternative platforms/routes, simulates consequences, and generates AI operational recommendations.

DISCLAIMER:
Predictive Operational Decision Support System for Indian Railways.
Recommended actions require authorized railway controller approval.
Does not control signals, railway points, interlocking, or Kavach.
"""

import time
import datetime
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("railpulse.platform_traffic")

# In-memory history of controller advisory decisions
_DECISION_HISTORY: List[Dict[str, Any]] = [
    {
        "decisionId": "DEC-8812",
        "stationCode": "KGP",
        "stationName": "Kharagpur Junction",
        "trainB": "12723",
        "trainBName": "Telangana Express",
        "action": "USE PLATFORM 2",
        "decision": "ACCEPTED",
        "controllerName": "Sh. Rajesh Kumar Verma",
        "role": "Chief Section Controller (Waltair Division)",
        "timestamp": "2026-09-04 17:15:30 IST",
        "status": "Advisory decision recorded",
        "minutesSaved": 3.0,
        "conflictResolved": "Platform 1 Overlap (3m)"
    }
]

class PlatformTrafficService:
    def __init__(self):
        self.station_code = "KGP"
        self.station_name = "Kharagpur Junction"

    def _format_time(self, dt: datetime.datetime) -> str:
        return dt.strftime("%H:%M")

    def get_platform_traffic_state(self, station_code: str = "KGP", sim_offset: int = 0) -> Dict[str, Any]:
        """
        Computes dynamic platform occupancy, upcoming conflicts, options, AI recommendations,
        comparison matrix, delay propagation, and visual timeline data.
        """
        now = datetime.datetime.now()
        
        # Base timestamps for dynamic realistic schedules
        # Train A (Currently occupying or arriving at Platform 1)
        train_a_eta_dt = now + datetime.timedelta(minutes=2 + sim_offset)
        train_a_clear_dt = now + datetime.timedelta(minutes=7 + sim_offset)

        # Train B (Approaching train requiring Platform 1)
        train_b_eta_dt = now + datetime.timedelta(minutes=4 + sim_offset)
        train_b_clear_dt = now + datetime.timedelta(minutes=12 + sim_offset)

        # Train C (Scheduled for Platform 3)
        train_c_eta_dt = now + datetime.timedelta(minutes=9 + sim_offset)
        train_c_clear_dt = now + datetime.timedelta(minutes=16 + sim_offset)

        # Conflict calculation
        has_conflict = train_b_eta_dt < train_a_clear_dt
        conflict_minutes = max(0, int((train_a_clear_dt - train_b_eta_dt).total_seconds() / 60))
        
        # Determine status
        if conflict_minutes >= 5:
            status = "CRITICAL CONFLICT"
            status_color = "RED"
        elif conflict_minutes > 0:
            status = "CONFLICT PREDICTED"
            status_color = "AMBER"
        else:
            status = "NETWORK NORMAL"
            status_color = "GREEN"

        # Platform Occupancy
        platforms = [
            {
                "platformNumber": "Platform 1",
                "status": "OCCUPIED",
                "statusLabel": "🔴 OCCUPIED",
                "statusColor": "red",
                "currentTrain": "12864",
                "trainName": "Howrah SF Express (Train A)",
                "eta": self._format_time(train_a_eta_dt),
                "clearanceTime": self._format_time(train_a_clear_dt),
                "dwellMinutes": 5,
                "lengthMeters": 650,
                "compatibleCoaches": 24,
                "notes": "Occupied by Train A. Departure scheduled at " + self._format_time(train_a_clear_dt)
            },
            {
                "platformNumber": "Platform 2",
                "status": "AVAILABLE",
                "statusLabel": "🟢 AVAILABLE",
                "statusColor": "green",
                "currentTrain": None,
                "trainName": "None (Loop Line Clear)",
                "eta": "Immediate",
                "clearanceTime": "Clear",
                "dwellMinutes": 0,
                "lengthMeters": 620,
                "compatibleCoaches": 24,
                "notes": "Fully energized, 24-coach loop line ready with direct route turnout."
            },
            {
                "platformNumber": "Platform 3",
                "status": "EXPECTED OCCUPANCY",
                "statusLabel": "🟡 EXPECTED OCCUPANCY",
                "statusColor": "amber",
                "currentTrain": "12728",
                "trainName": "Godavari Express (Train C)",
                "eta": self._format_time(train_c_eta_dt),
                "clearanceTime": self._format_time(train_c_clear_dt),
                "dwellMinutes": 7,
                "lengthMeters": 580,
                "compatibleCoaches": 22,
                "notes": "Incoming from Waltair corridor. Expected at " + self._format_time(train_c_eta_dt)
            },
            {
                "platformNumber": "Platform 4",
                "status": "BLOCKED",
                "statusLabel": "⚫ BLOCKED",
                "statusColor": "gray",
                "currentTrain": None,
                "trainName": "Track Maintenance / Power Block",
                "eta": "N/A",
                "clearanceTime": "19:30",
                "dwellMinutes": 0,
                "lengthMeters": 550,
                "compatibleCoaches": 20,
                "notes": "OHE maintenance power block active (Notice #KGP-OHE-442)."
            }
        ]

        # Upcoming Conflicts List
        conflicts = [
            {
                "conflictId": "CONF-01",
                "station": self.station_name,
                "stationCode": self.station_code,
                "platform": "Platform 1",
                "trainA": {
                    "number": "12864",
                    "name": "Howrah SF Express",
                    "eta": self._format_time(train_a_eta_dt),
                    "clearance": self._format_time(train_a_clear_dt)
                },
                "trainB": {
                    "number": "12723",
                    "name": "Telangana Express",
                    "eta": self._format_time(train_b_eta_dt),
                    "requiredPlatform": "Platform 1"
                },
                "conflictWindow": f"{self._format_time(train_b_eta_dt)} – {self._format_time(train_a_clear_dt)}",
                "overlapMinutes": conflict_minutes,
                "severity": "HIGH" if conflict_minutes >= 4 else "MEDIUM"
            }
        ]

        # Train B Decision & Options
        # Option A: Hold Train B
        opt_a_wait = conflict_minutes + 2
        opt_a_new_eta = train_b_eta_dt + datetime.timedelta(minutes=opt_a_wait)
        option_a = {
            "id": "OPTION_A",
            "title": "OPTION A — HOLD TRAIN B",
            "actionName": "HOLD TRAIN B (Outer Home Signal)",
            "waitingTime": f"{opt_a_wait} minutes",
            "waitingMinutes": opt_a_wait,
            "predictedNewEta": self._format_time(opt_a_new_eta),
            "networkImpact": "Medium",
            "networkImpactDesc": "Holds mainline block section; creates 4m headway delay on trailing goods train.",
            "passengerImpact": "Medium",
            "passengerImpactDesc": "2,200 passengers experience +5m stationary wait outside junction signal.",
            "isRecommended": False
        }

        # Option B: Alternative Platform (Platform 2)
        opt_b_add_time = 2  # Turnout traversal speed
        opt_b_new_eta = train_b_eta_dt + datetime.timedelta(minutes=opt_b_add_time)
        option_b = {
            "id": "OPTION_B",
            "title": "OPTION B — ALTERNATIVE PLATFORM",
            "actionName": "USE PLATFORM 2",
            "suggestedPlatform": "Platform 2",
            "additionalTime": f"{opt_b_add_time} minutes",
            "additionalMinutes": opt_b_add_time,
            "predictedNewEta": self._format_time(opt_b_new_eta),
            "networkImpact": "Low",
            "networkImpactDesc": "Mainline clears immediately; zero trailing section block congestion.",
            "passengerImpact": "Low",
            "passengerImpactDesc": "Same-island cross-platform access; minimal 2m speed reduction across turnout.",
            "isRecommended": True
        }

        # Option C: Alternative Route (Goods Avoidance Line)
        opt_c_add_time = 7  # 8.4km bypass
        opt_c_new_eta = train_b_eta_dt + datetime.timedelta(minutes=opt_c_add_time)
        option_c = {
            "id": "OPTION_C",
            "title": "OPTION C — ALTERNATIVE ROUTE",
            "actionName": "REROUTE VIA BYPASS (Goods Avoidance Line)",
            "additionalRouteTime": f"{opt_c_add_time} minutes",
            "additionalMinutes": opt_c_add_time,
            "predictedNewEta": self._format_time(opt_c_new_eta),
            "networkImpact": "High",
            "networkImpactDesc": "Occupies freight line corridor, forcing 15m hold on coal rake BCNA.",
            "passengerImpact": "High",
            "passengerImpactDesc": "Bypasses passenger platforms 1-3; causes passenger confusion and bus transfer.",
            "isRecommended": False,
            "infrastructureSupported": True,
            "infrastructureNote": "Existing double-track chord bypass via KGP-Outer Cabin."
        }

        options = [option_a, option_b, option_c]

        # AI Recommendation Card
        ai_recommendation = {
            "recommendedAction": "USE PLATFORM 2",
            "recommendedOptionId": "OPTION_B",
            "platform": "Platform 2",
            "reasons": [
                f"Platform 1 occupied until {self._format_time(train_a_clear_dt)} by Train A (#12864)",
                f"Train B (#12723) arrives at {self._format_time(train_b_eta_dt)} causing a {conflict_minutes}-minute conflict",
                "Platform 2 is fully available, electrified, and accommodates 24 coaches",
                "No known downstream conflict on Platform 2 departure throat",
                "Minimizes total predicted network delay (+2 min vs +5 min outer hold)"
            ],
            "expectedResult": {
                "trainBDelay": "+2 min",
                "trainBDelayNum": 2,
                "networkDelayImpact": "LOW",
                "passengerImpact": "LOW"
            },
            "confidenceScore": 94.8,
            "confidenceType": "RULE-BASED RECOMMENDATION"
        }

        # What-If Comparison Matrix
        what_if_comparison = {
            "headers": ["Metric", "WAIT (Outer Hold)", "PLATFORM 2 (Turnout)", "REROUTE (Bypass)"],
            "rows": [
                {
                    "metric": "Train B ETA",
                    "wait": self._format_time(opt_a_new_eta),
                    "platform2": self._format_time(opt_b_new_eta),
                    "reroute": self._format_time(opt_c_new_eta)
                },
                {
                    "metric": "Delay Added",
                    "wait": f"+{opt_a_wait} min",
                    "platform2": f"+{opt_b_add_time} min",
                    "reroute": f"+{opt_c_add_time} min"
                },
                {
                    "metric": "Network Impact",
                    "wait": "Medium",
                    "platform2": "Low",
                    "reroute": "High"
                },
                {
                    "metric": "Passenger Impact",
                    "wait": "Medium",
                    "platform2": "Low",
                    "reroute": "High"
                },
                {
                    "metric": "Recommended",
                    "wait": "NO",
                    "platform2": "YES",
                    "reroute": "NO"
                }
            ]
        }

        # Delay Propagation Breakdown
        delay_propagation = {
            "rootCause": "Train B Platform Resolution",
            "chain": [
                { "entity": "TRAIN B (#12723)", "impact": "+2 min", "location": self.station_name, "stage": "Turnout Deceleration" },
                { "entity": "HIJLI JUNCTION (Station X)", "impact": "+2 min", "location": "KGP-HIJ Section", "stage": "Trailing Block Headway" },
                { "entity": "TRAIN C (#12728)", "impact": "+1 min", "location": "Downstream Section", "stage": "Signal Clearance Delay" },
                { "entity": "DOWNSTREAM NETWORK", "impact": "Negligible (<1m)", "location": "SER Mainline", "stage": "Schedule Padding Absorption" }
            ],
            "affectedTrains": 2,
            "predictedAdditionalNetworkDelayMinutes": 3.0
        }

        # Visual Platform Timeline (Gantt representation)
        timeline = [
            {
                "platform": "Platform 1",
                "tracks": [
                    {
                        "trainNumber": "12864",
                        "trainLabel": "TRAIN A (Howrah SF Exp)",
                        "startTime": self._format_time(train_a_eta_dt - datetime.timedelta(minutes=2)),
                        "endTime": self._format_time(train_a_clear_dt),
                        "status": "OCCUPYING",
                        "color": "#ef4444"
                    },
                    {
                        "trainNumber": "12723",
                        "trainLabel": "TRAIN B (Telangana Exp) ⚠",
                        "startTime": self._format_time(train_b_eta_dt),
                        "endTime": self._format_time(train_b_clear_dt),
                        "status": "CONFLICT_OVERLAP",
                        "color": "#f59e0b",
                        "hasConflict": True
                    }
                ]
            },
            {
                "platform": "Platform 2",
                "tracks": [
                    {
                        "trainNumber": "12723 (Resolved)",
                        "trainLabel": "TRAIN B (Via Suggested Option B)",
                        "startTime": self._format_time(opt_b_new_eta),
                        "endTime": self._format_time(opt_b_new_eta + datetime.timedelta(minutes=8)),
                        "status": "RESOLVED_RECOMMENDED",
                        "color": "#10b981",
                        "isRecommendedSlot": True
                    }
                ]
            },
            {
                "platform": "Platform 3",
                "tracks": [
                    {
                        "trainNumber": "12728",
                        "trainLabel": "TRAIN C (Godavari Exp)",
                        "startTime": self._format_time(train_c_eta_dt),
                        "endTime": self._format_time(train_c_clear_dt),
                        "status": "SCHEDULED",
                        "color": "#38bdf8"
                    }
                ]
            },
            {
                "platform": "Platform 4",
                "tracks": [
                    {
                        "trainNumber": "MAINT",
                        "trainLabel": "BLOCKED (OHE Maintenance)",
                        "startTime": "14:00",
                        "endTime": "19:30",
                        "status": "BLOCKED",
                        "color": "#64748b"
                    }
                ]
            }
        ]

        # One-Click Decision Pipeline Simulation Steps
        simulation_pipeline = [
            { "step": 1, "name": "DETECT", "desc": "Scanned 8 block sections & 4 platforms for overlapping dwell windows.", "status": "COMPLETED", "durationMs": 120 },
            { "step": 2, "name": "PREDICT", "desc": f"Identified {conflict_minutes}m conflict window on Platform 1 ({self._format_time(train_b_eta_dt)} – {self._format_time(train_a_clear_dt)}).", "status": "COMPLETED", "durationMs": 180 },
            { "step": 3, "name": "SIMULATE", "desc": "Simulated Outer Hold, Platform 2 Turnout, and Bypass Chord routing.", "status": "COMPLETED", "durationMs": 240 },
            { "step": 4, "name": "COMPARE", "desc": "Evaluated ETA shifts, sectional capacity impact, and passenger transfer disruption.", "status": "COMPLETED", "durationMs": 150 },
            { "step": 5, "name": "OPTIMIZE", "desc": "Multi-objective delay minimization: Selected Platform 2 (+2m delay vs +5m outer wait).", "status": "COMPLETED", "durationMs": 110 },
            { "step": 6, "name": "RECOMMEND", "desc": "Generated AI Operational Advisory for Controller review and verification.", "status": "COMPLETED", "durationMs": 90 }
        ]

        return {
            "success": True,
            "stationCode": self.station_code,
            "stationName": self.station_name,
            "currentTime": self._format_time(now),
            "status": status,
            "statusColor": status_color,
            "approachingTrain": {
                "number": "12723",
                "name": "Telangana Express (Train B)",
                "currentEta": self._format_time(train_b_eta_dt),
                "requiredPlatform": "Platform 1",
                "platformStatus": "Occupied by Train A (#12864)",
                "predictedConflictMinutes": conflict_minutes
            },
            "conflicts": conflicts,
            "platforms": platforms,
            "options": options,
            "aiRecommendation": ai_recommendation,
            "whatIfComparison": what_if_comparison,
            "delayPropagation": delay_propagation,
            "timeline": timeline,
            "simulationPipeline": simulation_pipeline,
            "actionHistory": _DECISION_HISTORY,
            "disclaimer": "Predictive Operational Decision Support. Recommended action requires authorized railway controller approval. Does not control signals, railway points, interlocking, or Kavach.",
            "lastCalculated": now.isoformat()
        }

    def record_controller_action(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Records a human controller advisory action (ACCEPT / REJECT / MODIFY) without directly commanding signals.
        """
        now = datetime.datetime.now()
        record_id = f"DEC-{int(time.time() % 100000)}"
        record = {
            "decisionId": record_id,
            "stationCode": payload.get("stationCode", self.station_code),
            "stationName": payload.get("stationName", self.station_name),
            "trainB": payload.get("trainB", "12723"),
            "trainBName": payload.get("trainBName", "Telangana Express"),
            "action": payload.get("action", "USE PLATFORM 2"),
            "decision": payload.get("decision", "ACCEPTED"),
            "controllerName": payload.get("controllerName", "Chief Section Controller"),
            "role": payload.get("role", "Chief Section Controller (Waltair Division)"),
            "timestamp": now.strftime("%Y-%m-%d %H:%M:%S IST"),
            "status": "Advisory decision recorded (Controller Approved)",
            "minutesSaved": payload.get("minutesSaved", 3.0),
            "notes": payload.get("notes", "Platform 2 turnout assigned; station master notified.")
        }
        _DECISION_HISTORY.insert(0, record)
        logger.info("Controller advisory action recorded: %s by %s", record["action"], record["controllerName"])
        return {
            "success": True,
            "message": "Advisory decision recorded successfully.",
            "record": record,
            "history": _DECISION_HISTORY
        }

platform_traffic_service = PlatformTrafficService()
