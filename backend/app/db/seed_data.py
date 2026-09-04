import json
import logging
from app.db.database import SessionLocal, Base, engine
from app.db.models import Station, Train, Route, Schedule, CongestionEvent, Alert

logger = logging.getLogger("railpulse.seed")

# Stations dataset across key Indian railway corridors
STATIONS_DATA = [
    {"id": "NDLS", "code": "NDLS", "name": "New Delhi", "zone": "NR", "division": "Delhi", "latitude": 28.6143, "longitude": 77.2188, "platforms": 16, "base_dwell_min": 15.0},
    {"id": "AGC", "code": "AGC", "name": "Agra Cantt", "zone": "NCR", "division": "Agra", "latitude": 27.1574, "longitude": 77.9902, "platforms": 6, "base_dwell_min": 5.0},
    {"id": "GWL", "code": "GWL", "name": "Gwalior Junction", "zone": "NCR", "division": "Jhansi", "latitude": 26.2183, "longitude": 78.1828, "platforms": 5, "base_dwell_min": 5.0},
    {"id": "VGLJ", "code": "VGLJ", "name": "VGL Jhansi", "zone": "NCR", "division": "Jhansi", "latitude": 25.4484, "longitude": 78.5685, "platforms": 7, "base_dwell_min": 8.0},
    {"id": "BPL", "code": "BPL", "name": "Bhopal Junction", "zone": "WCR", "division": "Bhopal", "latitude": 23.2599, "longitude": 77.4126, "platforms": 6, "base_dwell_min": 10.0},
    {"id": "NGP", "code": "NGP", "name": "Nagpur Junction", "zone": "CR", "division": "Nagpur", "latitude": 21.1458, "longitude": 79.0882, "platforms": 8, "base_dwell_min": 10.0},
    {"id": "BPQ", "code": "BPQ", "name": "Balharshah", "zone": "CR", "division": "Nagpur", "latitude": 19.8550, "longitude": 79.3520, "platforms": 5, "base_dwell_min": 5.0},
    {"id": "SKZR", "code": "SKZR", "name": "Sirpur Kaghaznagar", "zone": "SCR", "division": "Secunderabad", "latitude": 19.3400, "longitude": 79.4800, "platforms": 3, "base_dwell_min": 2.0},
    {"id": "RDM", "code": "RDM", "name": "Ramagundam", "zone": "SCR", "division": "Secunderabad", "latitude": 18.7600, "longitude": 79.4800, "platforms": 3, "base_dwell_min": 2.0},
    {"id": "KZJ", "code": "KZJ", "name": "Kazipet Junction", "zone": "SCR", "division": "Secunderabad", "latitude": 17.9700, "longitude": 79.5200, "platforms": 5, "base_dwell_min": 5.0},
    {"id": "SC", "code": "SC", "name": "Secunderabad Junction", "zone": "SCR", "division": "Secunderabad", "latitude": 17.4344, "longitude": 78.5011, "platforms": 10, "base_dwell_min": 15.0},
    {"id": "HYB", "code": "HYB", "name": "Hyderabad Deccan", "zone": "SCR", "division": "Hyderabad", "latitude": 17.3916, "longitude": 78.4735, "platforms": 6, "base_dwell_min": 20.0},
    {"id": "BZA", "code": "BZA", "name": "Vijayawada Junction", "zone": "SCR", "division": "Vijayawada", "latitude": 16.5193, "longitude": 80.6305, "platforms": 10, "base_dwell_min": 15.0},
    {"id": "GNT", "code": "GNT", "name": "Guntur Junction", "zone": "SCR", "division": "Guntur", "latitude": 16.3067, "longitude": 80.4365, "platforms": 7, "base_dwell_min": 5.0},
    {"id": "EE", "code": "EE", "name": "Eluru", "zone": "SCR", "division": "Vijayawada", "latitude": 16.7107, "longitude": 81.1035, "platforms": 3, "base_dwell_min": 2.0},
    {"id": "TDD", "code": "TDD", "name": "Tadepalligudem", "zone": "SCR", "division": "Vijayawada", "latitude": 16.8130, "longitude": 81.5266, "platforms": 3, "base_dwell_min": 2.0},
    {"id": "RJY", "code": "RJY", "name": "Rajahmundry", "zone": "SCR", "division": "Vijayawada", "latitude": 17.0005, "longitude": 81.8040, "platforms": 4, "base_dwell_min": 5.0},
    {"id": "SLO", "code": "SLO", "name": "Samalkot Junction", "zone": "SCR", "division": "Vijayawada", "latitude": 17.0500, "longitude": 82.1667, "platforms": 3, "base_dwell_min": 2.0},
    {"id": "AKP", "code": "AKP", "name": "Anakapalle", "zone": "SCR", "division": "Vijayawada", "latitude": 17.6913, "longitude": 83.0039, "platforms": 3, "base_dwell_min": 2.0},
    {"id": "DVD", "code": "DVD", "name": "Duvvada", "zone": "ECoR", "division": "Waltair", "latitude": 17.7088, "longitude": 83.1534, "platforms": 4, "base_dwell_min": 3.0},
    {"id": "VSKP", "code": "VSKP", "name": "Visakhapatnam Junction", "zone": "ECoR", "division": "Waltair", "latitude": 17.7215, "longitude": 83.2869, "platforms": 8, "base_dwell_min": 20.0},
    {"id": "VZM", "code": "VZM", "name": "Vizianagaram Junction", "zone": "ECoR", "division": "Waltair", "latitude": 18.1167, "longitude": 83.4167, "platforms": 5, "base_dwell_min": 5.0},
    {"id": "CHE", "code": "CHE", "name": "Srikakulam Road", "zone": "ECoR", "division": "Waltair", "latitude": 18.2970, "longitude": 83.8960, "platforms": 3, "base_dwell_min": 2.0},
    {"id": "PSA", "code": "PSA", "name": "Palasa", "zone": "ECoR", "division": "Khurda Road", "latitude": 18.7700, "longitude": 84.4100, "platforms": 4, "base_dwell_min": 2.0},
    {"id": "BAM", "code": "BAM", "name": "Brahmapur", "zone": "ECoR", "division": "Khurda Road", "latitude": 19.3150, "longitude": 84.7940, "platforms": 4, "base_dwell_min": 5.0},
    {"id": "KUR", "code": "KUR", "name": "Khurda Road Junction", "zone": "ECoR", "division": "Khurda Road", "latitude": 20.1800, "longitude": 85.7300, "platforms": 7, "base_dwell_min": 10.0},
    {"id": "BBS", "code": "BBS", "name": "Bhubaneswar", "zone": "ECoR", "division": "Khurda Road", "latitude": 20.2667, "longitude": 85.8333, "platforms": 6, "base_dwell_min": 10.0},
    {"id": "CTC", "code": "CTC", "name": "Cuttack Junction", "zone": "ECoR", "division": "Khurda Road", "latitude": 20.4625, "longitude": 85.8830, "platforms": 5, "base_dwell_min": 5.0},
    {"id": "KGP", "code": "KGP", "name": "Kharagpur Junction", "zone": "SER", "division": "Kharagpur", "latitude": 22.3361, "longitude": 87.3278, "platforms": 12, "base_dwell_min": 10.0},
    {"id": "HWH", "code": "HWH", "name": "Howrah Junction", "zone": "ER", "division": "Howrah", "latitude": 22.5850, "longitude": 88.3426, "platforms": 23, "base_dwell_min": 25.0},
    {"id": "MAS", "code": "MAS", "name": "Chennai Central", "zone": "SR", "division": "Chennai", "latitude": 13.0827, "longitude": 80.2707, "platforms": 15, "base_dwell_min": 20.0},
    {"id": "CSMT", "code": "CSMT", "name": "Mumbai CSMT", "zone": "CR", "division": "Mumbai CR", "latitude": 18.9400, "longitude": 72.8353, "platforms": 18, "base_dwell_min": 25.0},
]

TRAINS_DATA = [
    {
        "train_number": "12723",
        "train_name": "Telangana Superfast Express",
        "train_type": "SUPERFAST",
        "origin_station_id": "HYB",
        "destination_station_id": "NDLS",
        "total_distance_km": 1675.0,
        "max_speed_kmh": 130.0,
        "priority_tier": 1,
        "schedules": [
            {"station_id": "HYB", "seq": 1, "arr": None, "dep": "06:00", "dist": 0.0},
            {"station_id": "SC", "seq": 2, "arr": "06:20", "dep": "06:25", "dist": 9.0},
            {"station_id": "KZJ", "seq": 3, "arr": "08:03", "dep": "08:05", "dist": 141.0},
            {"station_id": "RDM", "seq": 4, "arr": "09:14", "dep": "09:15", "dist": 234.0},
            {"station_id": "SKZR", "seq": 5, "arr": "10:04", "dep": "10:05", "dist": 306.0},
            {"station_id": "BPQ", "seq": 6, "arr": "11:15", "dep": "11:20", "dist": 376.0},
            {"station_id": "NGP", "seq": 7, "arr": "15:20", "dep": "15:25", "dist": 584.0},
            {"station_id": "BPL", "seq": 8, "arr": "21:45", "dep": "21:55", "dist": 974.0},
            {"station_id": "VGLJ", "seq": 9, "arr": "01:15", "dep": "01:23", "dist": 1266.0},
            {"station_id": "GWL", "seq": 10, "arr": "02:45", "dep": "02:47", "dist": 1363.0},
            {"station_id": "AGC", "seq": 11, "arr": "04:30", "dep": "04:32", "dist": 1481.0},
            {"station_id": "NDLS", "seq": 12, "arr": "07:40", "dep": None, "dist": 1675.0},
        ]
    },
    {
        "train_number": "12864",
        "train_name": "Howrah - SMVT Bengaluru SF Express",
        "train_type": "SUPERFAST",
        "origin_station_id": "HWH",
        "destination_station_id": "MAS",
        "total_distance_km": 1650.0,
        "max_speed_kmh": 110.0,
        "priority_tier": 2,
        "schedules": [
            {"station_id": "HWH", "seq": 1, "arr": None, "dep": "19:55", "dist": 0.0},
            {"station_id": "KGP", "seq": 2, "arr": "21:30", "dep": "21:35", "dist": 115.0},
            {"station_id": "BBS", "seq": 3, "arr": "02:35", "dep": "02:40", "dist": 437.0},
            {"station_id": "KUR", "seq": 4, "arr": "03:00", "dep": "03:10", "dist": 456.0},
            {"station_id": "BAM", "seq": 5, "arr": "04:50", "dep": "04:55", "dist": 603.0},
            {"station_id": "PSA", "seq": 6, "arr": "06:10", "dep": "06:12", "dist": 677.0},
            {"station_id": "CHE", "seq": 7, "arr": "07:05", "dep": "07:07", "dist": 750.0},
            {"station_id": "VZM", "seq": 8, "arr": "08:05", "dep": "08:10", "dist": 820.0},
            {"station_id": "VSKP", "seq": 9, "arr": "09:20", "dep": "09:40", "dist": 881.0},
            {"station_id": "DVD", "seq": 10, "arr": "10:10", "dep": "10:12", "dist": 898.0},
            {"station_id": "AKP", "seq": 11, "arr": "10:28", "dep": "10:30", "dist": 914.0},
            {"station_id": "SLO", "seq": 12, "arr": "11:43", "dep": "11:45", "dist": 1032.0},
            {"station_id": "RJY", "seq": 13, "arr": "12:38", "dep": "12:40", "dist": 1082.0},
            {"station_id": "TDD", "seq": 14, "arr": "13:18", "dep": "13:20", "dist": 1123.0},
            {"station_id": "EE", "seq": 15, "arr": "14:03", "dep": "14:05", "dist": 1171.0},
            {"station_id": "BZA", "seq": 16, "arr": "15:30", "dep": "15:45", "dist": 1231.0},
        ]
    },
    {
        "train_number": "12728",
        "train_name": "Godavari Superfast Express",
        "train_type": "SUPERFAST",
        "origin_station_id": "HYB",
        "destination_station_id": "VSKP",
        "total_distance_km": 709.0,
        "max_speed_kmh": 110.0,
        "priority_tier": 2,
        "schedules": [
            {"station_id": "HYB", "seq": 1, "arr": None, "dep": "17:05", "dist": 0.0},
            {"station_id": "SC", "seq": 2, "arr": "17:25", "dep": "17:30", "dist": 9.0},
            {"station_id": "KZJ", "seq": 3, "arr": "19:33", "dep": "19:35", "dist": 141.0},
            {"station_id": "BZA", "seq": 4, "arr": "23:05", "dep": "23:20", "dist": 349.0},
            {"station_id": "EE", "seq": 5, "arr": "00:08", "dep": "00:10", "dist": 409.0},
            {"station_id": "TDD", "seq": 6, "arr": "00:48", "dep": "00:50", "dist": 457.0},
            {"station_id": "RJY", "seq": 7, "arr": "01:38", "dep": "01:40", "dist": 498.0},
            {"station_id": "SLO", "seq": 8, "arr": "02:28", "dep": "02:30", "dist": 548.0},
            {"station_id": "AKP", "seq": 9, "arr": "04:38", "dep": "04:40", "dist": 666.0},
            {"station_id": "DVD", "seq": 10, "arr": "05:13", "dep": "05:15", "dist": 682.0},
            {"station_id": "VSKP", "seq": 11, "arr": "05:45", "dep": None, "dist": 709.0},
        ]
    },
    {
        "train_number": "17240",
        "train_name": "Simhadri Daily Express",
        "train_type": "EXPRESS",
        "origin_station_id": "GNT",
        "destination_station_id": "VSKP",
        "total_distance_km": 382.0,
        "max_speed_kmh": 90.0,
        "priority_tier": 3,
        "schedules": [
            {"station_id": "GNT", "seq": 1, "arr": None, "dep": "05:00", "dist": 0.0},
            {"station_id": "BZA", "seq": 2, "arr": "05:55", "dep": "06:05", "dist": 32.0},
            {"station_id": "EE", "seq": 3, "arr": "06:58", "dep": "07:00", "dist": 92.0},
            {"station_id": "TDD", "seq": 4, "arr": "07:43", "dep": "07:45", "dist": 140.0},
            {"station_id": "RJY", "seq": 5, "arr": "08:43", "dep": "08:45", "dist": 181.0},
            {"station_id": "SLO", "seq": 6, "arr": "09:38", "dep": "09:40", "dist": 231.0},
            {"station_id": "AKP", "seq": 7, "arr": "12:08", "dep": "12:10", "dist": 349.0},
            {"station_id": "DVD", "seq": 8, "arr": "12:43", "dep": "12:45", "dist": 365.0},
            {"station_id": "VSKP", "seq": 9, "arr": "13:30", "dep": None, "dist": 382.0},
        ]
    }
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if stations exist
        if db.query(Station).count() == 0:
            logger.info("Seeding stations table...")
            for st in STATIONS_DATA:
                station = Station(
                    id=st["id"],
                    code=st["code"],
                    name=st["name"],
                    zone=st.get("zone"),
                    division=st.get("division"),
                    latitude=st["latitude"],
                    longitude=st["longitude"],
                    platforms=st["platforms"],
                    base_dwell_min=st["base_dwell_min"]
                )
                db.add(station)
            db.commit()

        # Check if trains exist
        if db.query(Train).count() == 0:
            logger.info("Seeding trains and schedules tables...")
            for tr_data in TRAINS_DATA:
                train = Train(
                    train_number=tr_data["train_number"],
                    train_name=tr_data["train_name"],
                    train_type=tr_data["train_type"],
                    origin_station_id=tr_data["origin_station_id"],
                    destination_station_id=tr_data["destination_station_id"],
                    total_distance_km=tr_data["total_distance_km"],
                    max_speed_kmh=tr_data["max_speed_kmh"],
                    priority_tier=tr_data["priority_tier"]
                )
                db.add(train)
                db.commit()

                for sched in tr_data["schedules"]:
                    schedule = Schedule(
                        train_number=tr_data["train_number"],
                        station_id=sched["station_id"],
                        stop_sequence=sched["seq"],
                        scheduled_arrival=sched["arr"],
                        scheduled_departure=sched["dep"],
                        distance_from_source_km=sched["dist"]
                    )
                    db.add(schedule)
                db.commit()

        # Seed congestion events
        if db.query(CongestionEvent).count() == 0:
            logger.info("Seeding sample congestion events...")
            ce = CongestionEvent(
                section_id="BZA-GNT-SEC",
                from_station="BZA",
                to_station="GNT",
                congestion_index=78.0,
                active_trains_count=5,
                average_speed_kmh=34.0,
                severity="HIGH",
                observed_vs_predicted="OBSERVED"
            )
            db.add(ce)
            db.commit()

        logger.info("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        logger.error("Error during database seed: %s", e)
    finally:
        db.close()
