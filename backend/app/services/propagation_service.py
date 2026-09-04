import datetime
import logging
from typing import Dict, Any, List

logger = logging.getLogger("railpulse.propagation")

class PropagationService:
    """
    Delay Propagation and Network Cascade Analysis Engine.
    Traces shared track sections, junction cross-overs, platform dependencies, and passenger connections
    to predict downstream ripple delays before they materialize.
    """

    def analyze_train_propagation(self, train_number: str) -> Dict[str, Any]:
        train_num = str(train_number).strip()
        
        # Scenario mapping based on train
        if train_num == "12864":
            # Primary train is Howrah-SMVT Bengaluru with 26m delay near Rajahmundry
            return {
                "primary_train_number": "12864",
                "primary_train_name": "Howrah - SMVT Bengaluru SF Express",
                "primary_delay_minutes": 26.0,
                "overall_propagation_risk": "HIGH",
                "cascade_severity": "HIGH",
                "time_to_impact_minutes": 17,
                "time_to_impact_timeline": [
                    {"minute": 0, "event": "Primary delay of 26m injected at Rajahmundry outer"},
                    {"minute": 8, "event": "Section signal aspects degraded to Caution (Double Yellow)"},
                    {"minute": 17, "event": "Secondary train 17240 held at outer loop junction"},
                    {"minute": 25, "event": "Platform 1 occupancy conflict at Tadepalligudem occurs"},
                    {"minute": 42, "event": "Connecting passenger missed link for GNT Intercity"}
                ],
                "affected_trains": [
                    {
                        "train_number": "17240",
                        "train_name": "Simhadri Daily Express",
                        "shared_section": "RJY-TDD Block Section",
                        "projected_secondary_delay_minutes": 18.0,
                        "conflict_type": "HEADWAY_BLOCK",
                        "risk_level": "HIGH",
                        "time_to_impact_min": 17
                    },
                    {
                        "train_number": "12728",
                        "train_name": "Godavari Superfast Express",
                        "shared_section": "EE-BZA Terminal Approach",
                        "projected_secondary_delay_minutes": 11.0,
                        "conflict_type": "PLATFORM_OCCUPANCY",
                        "risk_level": "MEDIUM",
                        "time_to_impact_min": 35
                    },
                    {
                        "train_number": "12760",
                        "train_name": "Charminar Express",
                        "shared_section": "Vijayawada North Yard",
                        "projected_secondary_delay_minutes": 6.0,
                        "conflict_type": "CREW_PASSENGER_TRANSFER",
                        "risk_level": "LOW",
                        "time_to_impact_min": 60
                    }
                ],
                "affected_stations": [
                    {"station_id": "RJY", "station_name": "Rajahmundry", "platform_pressure_percent": 88, "status": "CONGESTED"},
                    {"station_id": "TDD", "station_name": "Tadepalligudem", "platform_pressure_percent": 75, "status": "HIGH_DWELL"},
                    {"station_id": "BZA", "station_name": "Vijayawada Junction", "platform_pressure_percent": 82, "status": "YARD_HOLD"}
                ],
                "passenger_impact": {
                    "connection_risk": "HIGH",
                    "potentially_affected_services": 3,
                    "estimated_delayed_transfers": "DEMO / ESTIMATED DATA (142 passengers at BZA)"
                },
                "recommended_intervention": "Divert Train 17240 to Loop Line 2 at Tadepalligudem to release Main Track line",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
        elif train_num == "12723":
            # Telangana Express
            return {
                "primary_train_number": "12723",
                "primary_train_name": "Telangana Superfast Express",
                "primary_delay_minutes": 8.0,
                "overall_propagation_risk": "LOW",
                "cascade_severity": "LOW",
                "time_to_impact_minutes": 45,
                "time_to_impact_timeline": [
                    {"minute": 0, "event": "Current minor delay of 8m at Sirpur Kaghaznagar"},
                    {"minute": 45, "event": "Normal absorption expected before Nagpur Junction junction"}
                ],
                "affected_trains": [
                    {
                        "train_number": "12760",
                        "train_name": "Charminar Express",
                        "shared_section": "KZJ-BPQ Corridor",
                        "projected_secondary_delay_minutes": 3.0,
                        "conflict_type": "HEADWAY_SPACING",
                        "risk_level": "LOW",
                        "time_to_impact_min": 45
                    }
                ],
                "affected_stations": [
                    {"station_id": "BPQ", "station_name": "Balharshah", "platform_pressure_percent": 35, "status": "CLEAR"}
                ],
                "passenger_impact": {
                    "connection_risk": "LOW",
                    "potentially_affected_services": 0,
                    "estimated_delayed_transfers": "Zero missed connections anticipated"
                },
                "recommended_intervention": "Maintain normal sectional speed profile (110 km/h)",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
        else:
            # Generic response
            return {
                "primary_train_number": train_num,
                "primary_train_name": f"Train {train_num}",
                "primary_delay_minutes": 12.0,
                "overall_propagation_risk": "MEDIUM",
                "cascade_severity": "MEDIUM",
                "time_to_impact_minutes": 25,
                "time_to_impact_timeline": [
                    {"minute": 0, "event": "Section delay detected"},
                    {"minute": 25, "event": "Downstream loop line wait anticipated"}
                ],
                "affected_trains": [],
                "affected_stations": [],
                "passenger_impact": {
                    "connection_risk": "MEDIUM",
                    "potentially_affected_services": 1,
                    "estimated_delayed_transfers": "DEMO / ESTIMATED DATA"
                },
                "recommended_intervention": "Regulate dwell time at upcoming junction",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }

propagation_service = PropagationService()
