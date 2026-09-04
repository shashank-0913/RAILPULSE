import datetime
import logging
from typing import Dict, Any, List

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

    def evaluate_what_if(self, train_number: str, additional_delay_minutes: float, custom_speed_kmh: float = None, platform_reassignment: str = None) -> Dict[str, Any]:
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
                "id": "scenario_a",
                "title": "Scenario A: Hold Secondary Train on Main Line",
                "description": "Keep Train 17240 on main track and delay departure until Train 12864 clears block section.",
                "total_network_delay_minutes": round(effective_delay + 14.0, 1),
                "passenger_satisfaction_impact": "-12%",
                "is_ai_preferred": False,
                "confidence_score": 0.81
            },
            {
                "id": "scenario_b",
                "title": "Scenario B: Speed Advisory Acceleration (+15 km/h)",
                "description": "Issue dynamic green wave signal priority to Train 12864 to recover 6 minutes before Rajahmundry.",
                "total_network_delay_minutes": round(max(5.0, effective_delay - 6.0 + 8.0), 1),
                "passenger_satisfaction_impact": "-4%",
                "is_ai_preferred": False,
                "confidence_score": 0.86
            },
            {
                "id": "scenario_c",
                "title": "Scenario C: Platform Reassignment & Alternate Loop Divert",
                "description": "Divert Train 17240 to Loop Line Platform 2 at Tadepalligudem; run Train 12864 unobstructed on Through Line.",
                "total_network_delay_minutes": round(max(3.0, effective_delay * 0.25 + 2.0), 1),
                "passenger_satisfaction_impact": "+6%",
                "is_ai_preferred": True,
                "confidence_score": 0.94
            }
        ]

        return {
            "train_number": train_num,
            "additional_delay_minutes": add_delay,
            "estimated_additional_delay": round(effective_delay, 1),
            "risk_level": risk,
            "connection_risk": conn_risk,
            "affected_trains_count": affected_trains_count,
            "affected_trains": affected_trains,
            "affected_stations": ["RJY", "TDD", "BZA"],
            "section_congestion_spike": "+18%",
            "scenarios_comparison": scenarios,
            "data_label": "SIMULATION",
            "disclaimer": "This is a SIMULATION run. Not represented as live railway operational decisions.",
            "simulated_at": datetime.datetime.utcnow().isoformat()
        }

simulation_service = SimulationService()
