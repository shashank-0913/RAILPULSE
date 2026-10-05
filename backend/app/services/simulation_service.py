import datetime
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("railpulse.simulation")

class SimulationService:
    """
    Railway Simulation & What-If Disruption Sandbox Engine.
    Powers interactive demonstration runs and evaluates controller intervention scenarios
    without affecting real railway operations.
    """

    def __init__(self):
        self.is_running: bool = False
        self.current_step: int = 1
        self.total_steps: int = 14
        self.scenario_name: str = "SIH 2026 Live Demonstration Workflow"
        self.active_injected_delays: Dict[str, float] = {}

    def get_status(self) -> Dict[str, Any]:
        return {
            "is_running": self.is_running,
            "current_step": self.current_step,
            "total_steps": self.total_steps,
            "scenario_name": self.scenario_name,
            "data_source": "DEMO / SIMULATED DATA",
            "is_simulation_mode": True,
            "injected_delays": self.active_injected_delays,
            "active_trains_simulated": ["12723", "12864", "12728", "17240"],
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

    def start_simulation(self, scenario: str = None) -> Dict[str, Any]:
        self.is_running = True
        if scenario:
            self.scenario_name = scenario
        logger.info("Simulation started: %s", self.scenario_name)
        return self.get_status()

    def stop_simulation(self) -> Dict[str, Any]:
        self.is_running = False
        logger.info("Simulation paused/stopped.")
        return self.get_status()

    def reset_simulation(self) -> Dict[str, Any]:
        self.is_running = False
        self.current_step = 1
        self.active_injected_delays.clear()
        logger.info("Simulation state reset to step 1.")
        return self.get_status()

    def set_step(self, step: int) -> Dict[str, Any]:
        self.current_step = max(1, min(self.total_steps, step))
        return self.get_status()

    def evaluate_what_if(
        self,
        train_number: str,
        additional_delay_minutes: float,
        custom_speed_kmh: Optional[float] = None,
        platform_reassignment: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculates network-wide ripple impacts for a hypothetical delay injection or intervention.
        """
        train_num = str(train_number).strip()
        add_delay = float(additional_delay_minutes)

        # Baseline delay impact calculation
        speed_modifier = (custom_speed_kmh / 80.0) if custom_speed_kmh else 1.0
        effective_delay = max(0.0, add_delay / speed_modifier)

        # What-If impact prediction
        if effective_delay < 10:
            risk = "LOW"
            conn_risk = "LOW"
            affected_trains_count = 0
            affected_trains = []
        elif effective_delay < 25:
            risk = "MEDIUM"
            conn_risk = "MEDIUM"
            affected_trains_count = 2
            affected_trains = [
                {
                    "train_number": "17240",
                    "train_name": "Simhadri Daily Express",
                    "secondary_delay_minutes": round(effective_delay * 0.65, 1),
                    "shared_section": "RJY-TDD",
                    "risk_level": "MEDIUM"
                }
            ]
        else:
            risk = "HIGH"
            conn_risk = "HIGH"
            affected_trains_count = 3
            affected_trains = [
                {
                    "train_number": "17240",
                    "train_name": "Simhadri Daily Express",
                    "secondary_delay_minutes": round(effective_delay * 0.75, 1),
                    "shared_section": "RJY-TDD",
                    "risk_level": "HIGH"
                },
                {
                    "train_number": "12728",
                    "train_name": "Godavari Superfast Express",
                    "secondary_delay_minutes": round(effective_delay * 0.40, 1),
                    "shared_section": "EE-BZA",
                    "risk_level": "MEDIUM"
                }
            ]

        # Multi-Scenario Options generated for Controller Decision Support
        scenarios = [
            {
                "id": "Scenario A",
                "scenarioId": "Scenario A",
                "title": "Scenario A: Hold Secondary Train on Main Line",
                "name": "Hold Secondary Train on Main Line",
                "strategy": "Keep Train 17240 on main track and delay departure until Train 12864 clears block section.",
                "description": "Keep Train 17240 on main track and delay departure until Train 12864 clears block section.",
                "total_system_delay_minutes": round(effective_delay + 14.0, 1),
                "total_network_delay_minutes": round(effective_delay + 14.0, 1),
                "totalNetworkDelayMin": round(effective_delay + 14.0, 1),
                "delay_saved_minutes": 0,
                "delaySavedMin": 0,
                "affected_trains": affected_trains,
                "affectedTrains": affected_trains,
                "impact_rating": "HIGH",
                "passenger_satisfaction_impact": "-12%",
                "is_ai_preferred": False,
                "isPreferred": False,
                "confidence_score": 0.81,
                "confidencePercent": 81
            },
            {
                "id": "Scenario B",
                "scenarioId": "Scenario B",
                "title": "Scenario B: Speed Advisory Acceleration (+15 km/h)",
                "name": "Speed Advisory Acceleration (+15 km/h)",
                "strategy": "Issue dynamic green wave signal priority to Train 12864 to recover 6 minutes before Rajahmundry.",
                "description": "Issue dynamic green wave signal priority to Train 12864 to recover 6 minutes before Rajahmundry.",
                "total_system_delay_minutes": round(max(5.0, effective_delay - 6.0 + 8.0), 1),
                "total_network_delay_minutes": round(max(5.0, effective_delay - 6.0 + 8.0), 1),
                "totalNetworkDelayMin": round(max(5.0, effective_delay - 6.0 + 8.0), 1),
                "delay_saved_minutes": 6,
                "delaySavedMin": 6,
                "affected_trains": affected_trains[:2],
                "affectedTrains": affected_trains[:2],
                "impact_rating": "MODERATE",
                "passenger_satisfaction_impact": "-4%",
                "is_ai_preferred": False,
                "isPreferred": False,
                "confidence_score": 0.86,
                "confidencePercent": 86
            },
            {
                "id": "Scenario C",
                "scenarioId": "Scenario C",
                "title": "Scenario C: Platform Reassignment & Alternate Loop Divert",
                "name": "Platform Reassignment & Alternate Loop Divert",
                "strategy": "Divert Train 17240 to Loop Line Platform 2 at Tadepalligudem; run Train 12864 unobstructed on Through Line.",
                "description": "Divert Train 17240 to Loop Line Platform 2 at Tadepalligudem; run Train 12864 unobstructed on Through Line.",
                "total_system_delay_minutes": round(max(3.0, effective_delay * 0.25 + 2.0), 1),
                "total_network_delay_minutes": round(max(3.0, effective_delay * 0.25 + 2.0), 1),
                "totalNetworkDelayMin": round(max(3.0, effective_delay * 0.25 + 2.0), 1),
                "delay_saved_minutes": round(max(5.0, effective_delay * 0.75), 1),
                "delaySavedMin": round(max(5.0, effective_delay * 0.75), 1),
                "affected_trains": [t for t in affected_trains if t["train_number"] != "17240"] or affected_trains[:1],
                "affectedTrains": [t for t in affected_trains if t["train_number"] != "17240"] or affected_trains[:1],
                "impact_rating": "LOW",
                "passenger_satisfaction_impact": "+6%",
                "is_ai_preferred": True,
                "isPreferred": True,
                "confidence_score": 0.94,
                "confidencePercent": 94
            }
        ]

        preferred_option = {
            "scenarioId": "Scenario C",
            "name": "Platform Reassignment & Alternate Loop Divert",
            "expectedNetworkDelayReductionMin": round(max(5.0, effective_delay * 0.75), 1),
            "confidencePercent": 94,
            "summary": f"Diverting to loop line eliminates {round(max(5.0, effective_delay * 0.75), 1)} min cascade delay."
        }

        comparison = {
            "before": [
                {"id": train_num, "delayMin": 12},
                {"id": "17240", "delayMin": 2},
                {"id": "18520", "delayMin": 5},
                {"id": "12803", "delayMin": 8}
            ],
            "after": [
                {"id": train_num, "delayMin": round(12 + add_delay, 1)},
                {"id": "17240", "delayMin": round(2 + (effective_delay * 0.65), 1)},
                {"id": "18520", "delayMin": round(5 + max(0, effective_delay * 0.3), 1)},
                {"id": "12803", "delayMin": round(8 + (effective_delay * 0.4), 1)}
            ]
        }

        recommendations = [
            {
                "priority": "CRITICAL",
                "title": f"Dynamic Precedence: Train {train_num} at Outer Junction",
                "description": "Divert secondary Simhadri Express #17240 to Loop Platform 2 to release Through Line.",
                "estimatedSavingMin": round(max(4.0, effective_delay * 0.6), 1)
            },
            {
                "priority": "HIGH",
                "title": "Corridor Speed Normalization (+10 km/h Green Wave)",
                "description": "Issue priority signal clearance between Rajahmundry and Tadepalligudem.",
                "estimatedSavingMin": 4
            }
        ]

        result_payload = {
            "success": True,
            "primary_train": train_num,
            "primaryTrain": train_num,
            "train_number": train_num,
            "trainNumber": train_num,
            "injected_delay_minutes": add_delay,
            "injectedDelayMinutes": add_delay,
            "additional_delay_minutes": add_delay,
            "additionalDelayMinutes": add_delay,
            "estimated_additional_delay": round(effective_delay, 1),
            "risk_level": risk,
            "riskLevel": risk,
            "connection_risk": conn_risk,
            "connectionRisk": conn_risk,
            "affected_trains_count": affected_trains_count,
            "affectedTrainsCount": affected_trains_count,
            "affected_trains": affected_trains,
            "affectedTrains": affected_trains,
            "affected_stations": ["RJY", "TDD", "BZA"],
            "section_congestion_spike": "+18%",
            "scenarios": scenarios,
            "scenarios_comparison": scenarios,
            "scenariosComparison": scenarios,
            "preferred_option": preferred_option,
            "preferredOption": preferred_option,
            "recommended_scenario": "Scenario C",
            "recommendedScenario": "Scenario C",
            "comparison": comparison,
            "recommendations": recommendations,
            "data_label": "SIMULATION",
            "disclaimer": "This is a SIMULATION run. Not represented as live railway operational decisions.",
            "simulated_at": datetime.datetime.utcnow().isoformat()
        }

        return {
            **result_payload,
            "simulation": result_payload
        }

simulation_service = SimulationService()
