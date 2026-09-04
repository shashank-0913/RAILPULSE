import time
import math
import logging
from typing import Dict, Any, Optional, List
import httpx
from app.config import settings

logger = logging.getLogger("railpulse.railradar")

# In-memory rate-limiting and response cache
_CACHE: Dict[str, Dict[str, Any]] = {}
_LAST_REQUEST_TIME: Dict[str, float] = {}
CACHE_TTL_SECONDS = 20  # 20s cache TTL to respect API limits

# Fallback station coordinates for major Indian railway stations if missing from API
FALLBACK_STATION_COORDS = {
    "SMVB": (12.999655, 77.6411538),
    "HWH": (22.5828709, 88.3428112),
    "BBS": (20.2666, 85.8436),
    "KUR": (20.1772, 85.7412),
    "BAM": (19.3150, 84.7941),
    "PSA": (18.7725, 84.4172),
    "CHE": (18.2949, 83.8938),
    "VZM": (18.1124, 83.4168),
    "VSKP": (17.7215, 83.2869),
    "DVD": (17.7058, 83.1554),
    "AKP": (17.6913, 83.0039),
    "SLO": (17.0494, 82.1704),
    "RJY": (17.0005, 81.7800),
    "EE": (16.7107, 81.0952),
    "BZA": (16.5193, 80.6305),
    "MAS": (13.0827, 80.2707),
    "HYB": (17.3916, 78.4735),
    "SC": (17.4344, 78.5011),
    "NDLS": (28.6143, 77.2195),
    "KGP": (22.3361, 87.3278),
    "BLS": (21.5030, 86.9150),
    "HIJ": (22.3160, 87.3060),
    "GNT": (16.3067, 80.4365),
    "BPQ": (19.8650, 79.3550),
    "SKZR": (19.3400, 79.4800)
}

class RailRadarService:
    """
    Client for the RailRadar API (https://api.railradar.in/v1).
    Provides real train tracking, GeoJSON route retrieval, station stops,
    and automatic fallback to high-fidelity simulation on failures.
    """

    def __init__(self):
        self.api_key = settings.RAILRADAR_API_KEY
        self.base_url = "https://api.railradar.in/v1"
        self.timeout = httpx.Timeout(connect=5.0, read=8.0, write=5.0, pool=10.0)

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
            "User-Agent": "RailPulse-AI-Engine/2.0"
        }

    async def get_live_train(self, train_number: str) -> Dict[str, Any]:
        """
        GET /v1/trains/{number}/live
        """
        train_num = str(train_number).strip()
        cache_key = f"live_{train_num}"
        now = time.time()

        # Check in-memory cache
        if cache_key in _CACHE:
            entry = _CACHE[cache_key]
            if now - entry["cached_at"] < CACHE_TTL_SECONDS:
                return entry["data"]

        # Attempt Real RailRadar Call
        if self.api_key and len(self.api_key) > 5:
            try:
                # Rate limit prevention (at least 1s between calls)
                last_time = _LAST_REQUEST_TIME.get(train_num, 0)
                if now - last_time < 1.0:
                    time.sleep(1.0 - (now - last_time))
                _LAST_REQUEST_TIME[train_num] = time.time()

                url = f"{self.base_url}/trains/{train_num}/live"
                logger.info("Querying RailRadar live API: %s", url)
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.get(url, headers=self._get_headers())

                if res.status_code == 200:
                    raw = res.json()
                    normalized = self._normalize_live_data(train_num, raw)
                    _CACHE[cache_key] = {"data": normalized, "cached_at": time.time()}
                    return normalized
                else:
                    logger.warning("RailRadar live status %d for train %s: %s", res.status_code, train_num, res.text[:150])
            except httpx.TimeoutException:
                logger.warning("RailRadar live request timed out for train %s", train_num)
            except Exception as e:
                logger.error("RailRadar live error for train %s: %s", train_num, e)

        # Simulation Fallback
        fallback = self._generate_simulated_live(train_num)
        _CACHE[cache_key] = {"data": fallback, "cached_at": time.time()}
        return fallback

    async def get_train_route(self, train_number: str) -> Dict[str, Any]:
        """
        GET /v1/trains/{number}/route
        """
        train_num = str(train_number).strip()
        cache_key = f"route_{train_num}"
        now = time.time()

        if cache_key in _CACHE:
            entry = _CACHE[cache_key]
            if now - entry["cached_at"] < 300:  # 5 min route cache
                return entry["data"]

        if self.api_key and len(self.api_key) > 5:
            try:
                url = f"{self.base_url}/trains/{train_num}/route"
                logger.info("Querying RailRadar route API: %s", url)
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.get(url, headers=self._get_headers())

                if res.status_code == 200:
                    raw = res.json()
                    route_data = raw.get("data", raw)
                    _CACHE[cache_key] = {"data": route_data, "cached_at": time.time()}
                    return route_data
                else:
                    logger.warning("RailRadar route status %d for train %s", res.status_code, train_num)
            except Exception as e:
                logger.error("RailRadar route error for train %s: %s", train_num, e)

        fallback = self._generate_simulated_route(train_num)
        _CACHE[cache_key] = {"data": fallback, "cached_at": time.time()}
        return fallback

    async def get_train_details(self, train_number: str) -> Dict[str, Any]:
        """
        GET /v1/trains/{number}
        """
        train_num = str(train_number).strip()
        cache_key = f"details_{train_num}"
        now = time.time()

        if cache_key in _CACHE:
            entry = _CACHE[cache_key]
            if now - entry["cached_at"] < 300:
                return entry["data"]

        if self.api_key and len(self.api_key) > 5:
            try:
                url = f"{self.base_url}/trains/{train_num}"
                logger.info("Querying RailRadar train details API: %s", url)
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.get(url, headers=self._get_headers())

                if res.status_code == 200:
                    raw = res.json()
                    data = raw.get("data", raw)
                    _CACHE[cache_key] = {"data": data, "cached_at": time.time()}
                    return data
            except Exception as e:
                logger.error("RailRadar details error for train %s: %s", train_num, e)

        return {"train": {"number": train_num, "name": f"Express #{train_num}"}, "route": []}

    async def search_trains(self, query: str) -> List[Dict[str, Any]]:
        """
        GET /v1/lookup/search/trains?q={query}
        """
        q = str(query).strip()
        if not q:
            return []

        api_results = []
        if self.api_key and len(self.api_key) > 5:
            try:
                url = f"{self.base_url}/lookup/search/trains?q={q}"
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.get(url, headers=self._get_headers())
                if res.status_code == 200:
                    raw = res.json()
                    api_results = raw.get("data", [])
            except Exception as e:
                logger.error("RailRadar search error: %s", e)

        # Comprehensive Indian Railways Trains Database Catalog
        ir_trains_catalog = [
            # Superfast & Mail/Express
            {"number": "12864", "name": "Howrah SF Express", "source": "SMVB", "sourceName": "SMVT Bengaluru", "dest": "HWH", "destName": "Howrah", "type": "SUPERFAST", "runningDays": "Daily"},
            {"number": "12723", "name": "Telangana Express", "source": "HYB", "sourceName": "Hyderabad Deccan", "dest": "NDLS", "destName": "New Delhi", "type": "SUPERFAST", "runningDays": "Daily"},
            {"number": "12728", "name": "Godavari Express", "source": "HYB", "sourceName": "Hyderabad Deccan", "dest": "VSKP", "destName": "Visakhapatnam", "type": "SUPERFAST", "runningDays": "Daily"},
            {"number": "17240", "name": "Simhadri Express", "source": "GNT", "sourceName": "Guntur", "dest": "VSKP", "destName": "Visakhapatnam", "type": "EXPRESS", "runningDays": "Daily"},
            {"number": "12841", "name": "Coromandel Express", "source": "HWH", "sourceName": "Howrah", "dest": "MAS", "destName": "MGR Chennai Central", "type": "SUPERFAST", "runningDays": "Daily"},
            {"number": "22807", "name": "Santragachi - Chennai AC SF", "source": "SRC", "sourceName": "Santragachi", "dest": "MAS", "destName": "MGR Chennai Central", "type": "AC_SUPERFAST", "runningDays": "Tue, Fri"},
            
            # Vande Bharat Express
            {"number": "20833", "name": "Visakhapatnam - Secunderabad Vande Bharat", "source": "VSKP", "sourceName": "Visakhapatnam", "dest": "SC", "destName": "Secunderabad", "type": "VANDE_BHARAT", "runningDays": "Mon, Tue, Wed, Thu, Fri, Sat"},
            {"number": "22436", "name": "Varanasi - New Delhi Vande Bharat", "source": "BSB", "sourceName": "Varanasi Junction", "dest": "NDLS", "destName": "New Delhi", "type": "VANDE_BHARAT", "runningDays": "Except Thu"},
            {"number": "20607", "name": "MGR Chennai - Mysuru Vande Bharat", "source": "MAS", "sourceName": "MGR Chennai Central", "dest": "MYS", "destName": "Mysuru", "type": "VANDE_BHARAT", "runningDays": "Except Wed"},
            {"number": "22225", "name": "CSMT Mumbai - Solapur Vande Bharat", "source": "CSMT", "sourceName": "Mumbai CSMT", "dest": "SUR", "destName": "Solapur", "type": "VANDE_BHARAT", "runningDays": "Except Wed"},
            {"number": "20901", "name": "Mumbai Central - Gandhinagar Vande Bharat", "source": "MMCT", "sourceName": "Mumbai Central", "dest": "GNC", "destName": "Gandhinagar Capital", "type": "VANDE_BHARAT", "runningDays": "Except Sun"},
            {"number": "22348", "name": "Howrah - Patna Vande Bharat", "source": "HWH", "sourceName": "Howrah", "dest": "PNBE", "destName": "Patna Junction", "type": "VANDE_BHARAT", "runningDays": "Except Wed"},

            # Rajdhani Express
            {"number": "12301", "name": "Howrah Rajdhani Express (via Gaya)", "source": "HWH", "sourceName": "Howrah", "dest": "NDLS", "destName": "New Delhi", "type": "RAJDHANI", "runningDays": "Except Sun"},
            {"number": "12951", "name": "Mumbai Central Tejas Rajdhani", "source": "MMCT", "sourceName": "Mumbai Central", "dest": "NDLS", "destName": "New Delhi", "type": "RAJDHANI", "runningDays": "Daily"},
            {"number": "12431", "name": "Thiruvananthapuram Rajdhani Express", "source": "TVC", "sourceName": "Thiruvananthapuram", "dest": "NZM", "destName": "Hazrat Nizamuddin", "type": "RAJDHANI", "runningDays": "Tue, Thu, Fri"},
            {"number": "12433", "name": "Chennai Rajdhani Express", "source": "MAS", "sourceName": "MGR Chennai Central", "dest": "NZM", "destName": "Hazrat Nizamuddin", "type": "RAJDHANI", "runningDays": "Fri, Sun"},
            {"number": "22691", "name": "KSR Bengaluru Rajdhani Express", "source": "SBC", "sourceName": "KSR Bengaluru", "dest": "NZM", "destName": "Hazrat Nizamuddin", "type": "RAJDHANI", "runningDays": "Daily"},
            {"number": "20501", "name": "Agartala Tejas Rajdhani Express", "source": "AGTL", "sourceName": "Agartala", "dest": "ANVT", "destName": "Anand Vihar Terminal", "type": "RAJDHANI", "runningDays": "Mon"},

            # Shatabdi Express
            {"number": "12002", "name": "New Delhi - Rani Kamlapati (Bhopal) Shatabdi", "source": "NDLS", "sourceName": "New Delhi", "dest": "RKMP", "destName": "Rani Kamlapati", "type": "SHATABDI", "runningDays": "Daily"},
            {"number": "12004", "name": "New Delhi - Lucknow Swarna Shatabdi", "source": "NDLS", "sourceName": "New Delhi", "dest": "LKO", "destName": "Lucknow Charbagh", "type": "SHATABDI", "runningDays": "Daily"},
            {"number": "12007", "name": "Chennai - Mysuru Shatabdi Express", "source": "MAS", "sourceName": "MGR Chennai Central", "dest": "MYS", "destName": "Mysuru", "type": "SHATABDI", "runningDays": "Except Thu"},
            {"number": "12019", "name": "Howrah - Ranchi Shatabdi Express", "source": "HWH", "sourceName": "Howrah", "dest": "RNC", "destName": "Ranchi Junction", "type": "SHATABDI", "runningDays": "Except Sun"},

            # Duronto Express
            {"number": "12245", "name": "Howrah - SMVT Bengaluru Duronto", "source": "HWH", "sourceName": "Howrah", "dest": "SMVB", "destName": "SMVT Bengaluru", "type": "DURONTO", "runningDays": "Tue, Wed, Fri, Sun, Mon"},
            {"number": "12259", "name": "Sealdah - Bikaner AC Duronto", "source": "SDAH", "sourceName": "Sealdah", "dest": "BKN", "destName": "Bikaner", "type": "DURONTO", "runningDays": "Mon, Wed, Thu, Sun"},
            {"number": "12213", "name": "Yesvantpur - Delhi Sarai Rohilla AC Duronto", "source": "YPR", "sourceName": "Yesvantpur", "dest": "DEE", "destName": "Delhi Sarai Rohilla", "type": "DURONTO", "runningDays": "Sat"},
            {"number": "12269", "name": "Chennai - Hazrat Nizamuddin AC Duronto", "source": "MAS", "sourceName": "MGR Chennai Central", "dest": "NZM", "destName": "Hazrat Nizamuddin", "type": "DURONTO", "runningDays": "Mon, Fri"},

            # Iconic Long Distance Express
            {"number": "12626", "name": "Kerala Express", "source": "NDLS", "sourceName": "New Delhi", "dest": "TVC", "destName": "Thiruvananthapuram", "type": "SUPERFAST", "runningDays": "Daily"},
            {"number": "12137", "name": "Punjab Mail", "source": "CSMT", "sourceName": "Mumbai CSMT", "dest": "FZR", "destName": "Firozpur Cantonment", "type": "SUPERFAST", "runningDays": "Daily"},
            {"number": "12321", "name": "Howrah - Mumbai CSMT Mail", "source": "HWH", "sourceName": "Howrah", "dest": "CSMT", "destName": "Mumbai CSMT", "type": "SUPERFAST", "runningDays": "Daily"},
            {"number": "12759", "name": "Charminar Express", "source": "TAM", "sourceName": "Tambaram", "dest": "HYB", "destName": "Hyderabad Deccan", "type": "SUPERFAST", "runningDays": "Daily"},
            {"number": "12801", "name": "Purushottam Express", "source": "PURI", "sourceName": "Puri", "dest": "NDLS", "destName": "New Delhi", "type": "SUPERFAST", "runningDays": "Daily"},
            {"number": "15959", "name": "Kamrup Express", "source": "HWH", "sourceName": "Howrah", "dest": "DBRG", "destName": "Dibrugarh", "type": "EXPRESS", "runningDays": "Daily"}
        ]
        
        q_clean = q.lower()
        catalog_results = [
            t for t in ir_trains_catalog
            if q_clean in t["number"].lower()
            or q_clean in t["name"].lower()
            or q_clean in t["source"].lower()
            or q_clean in t["sourceName"].lower()
            or q_clean in t["dest"].lower()
            or q_clean in t["destName"].lower()
            or q_clean in t["type"].lower()
        ]

        seen_numbers = set()
        merged = []
        for t in api_results + catalog_results:
            num = str(t.get("number") or t.get("id") or "").strip()
            if num and num not in seen_numbers:
                seen_numbers.add(num)
                merged.append(t)
        return merged

    async def get_normalized_train_journey(self, train_number: str) -> Dict[str, Any]:
        """
        Combines live telemetry, route geometry, and stations into the unified normalized schema.
        """
        train_num = str(train_number).strip()
        
        # Concurrently or sequentially fetch live and route details
        live_res = await self.get_live_train(train_num)
        route_res = await self.get_train_route(train_num)
        train_details = await self.get_train_details(train_num)

        train_info = train_details.get("train", {}) or live_res.get("raw_train", {})
        
        # 1. Train metadata
        train_name = live_res.get("trainName") or train_info.get("name") or f"Express Train {train_num}"
        source_code = train_info.get("source", {}).get("code") or "ORIGIN"
        source_name = train_info.get("source", {}).get("name") or source_code
        dest_code = train_info.get("destination", {}).get("code") or "DEST"
        dest_name = train_info.get("destination", {}).get("name") or dest_code

        # 2. Live telemetry
        lat = live_res.get("latitude", 17.8420)
        lng = live_res.get("longitude", 83.3320)
        speed = live_res.get("speed", 72.0)
        bearing = live_res.get("bearing", 215.0)
        delay = live_res.get("currentDelay", 0.0)
        prev_st = live_res.get("previousStation", source_name)
        curr_st = live_res.get("currentStation", "En Route")
        next_st = live_res.get("nextStation", dest_name)
        progress = live_res.get("segmentProgress", 50.0)
        data_source = live_res.get("dataSource", "RAILRADAR")

        # 3. GeoJSON route geometry
        route_geom = route_res.get("geojson", {}).get("geometry")
        if not route_geom:
            route_geom = {
                "type": "LineString",
                "coordinates": [
                    [lng - 0.5, lat - 0.5],
                    [lng, lat],
                    [lng + 0.5, lat + 0.5]
                ]
            }

        # 4. Route stations list
        raw_stations = train_details.get("route", []) or []
        route_stations = []

        if raw_stations:
            for s in raw_stations:
                st = s.get("station", {})
                code = st.get("code") or s.get("stationCode", "STN")
                s_lat = st.get("lat") or FALLBACK_STATION_COORDS.get(code, (lat, lng))[0]
                s_lng = st.get("lng") or FALLBACK_STATION_COORDS.get(code, (lat, lng))[1]
                
                route_stations.append({
                    "code": code,
                    "name": st.get("name") or s.get("stationName") or code,
                    "lat": float(s_lat),
                    "lng": float(s_lng),
                    "sequence": s.get("sequence", len(route_stations) + 1),
                    "distanceKm": float(s.get("distance", 0)),
                    "scheduledArr": s.get("arrival"),
                    "scheduledDep": s.get("departure"),
                    "predictedArr": s.get("arrival"),
                    "isHalt": bool(s.get("isHalt", True)),
                    "platform": str(s.get("platform") or "1").replace("PF", "").strip(),
                    "status": "PASSED" if s.get("status") == "departed" else ("UPCOMING_NEXT" if code == next_st else "UPCOMING")
                })
        else:
            # Fallback stop stations
            route_stations = [
                {"code": source_code, "name": source_name, "lat": lat - 0.5, "lng": lng - 0.5, "sequence": 1, "distanceKm": 0, "scheduledArr": None, "scheduledDep": "10:00", "predictedArr": None, "isHalt": True, "platform": "1", "status": "PASSED"},
                {"code": "INTER", "name": prev_st, "lat": lat - 0.1, "lng": lng - 0.1, "sequence": 2, "distanceKm": 250, "scheduledArr": "13:30", "scheduledDep": "13:35", "predictedArr": "13:30", "isHalt": True, "platform": "2", "status": "PASSED"},
                {"code": "NEXT", "name": next_st, "lat": lat + 0.2, "lng": lng + 0.2, "sequence": 3, "distanceKm": 520, "scheduledArr": "16:45", "scheduledDep": "16:50", "predictedArr": "17:15", "isHalt": True, "platform": "3", "status": "UPCOMING_NEXT"},
                {"code": dest_code, "name": dest_name, "lat": lat + 0.6, "lng": lng + 0.6, "sequence": 4, "distanceKm": 890, "scheduledArr": "21:00", "scheduledDep": None, "predictedArr": "21:30", "isHalt": True, "platform": "1", "status": "UPCOMING"}
            ]

        return {
            "trainNumber": train_num,
            "trainName": train_name,
            "trainSource": source_name,
            "trainSourceCode": source_code,
            "trainDestination": dest_name,
            "trainDestinationCode": dest_code,
            "latitude": lat,
            "longitude": lng,
            "speed": speed,
            "bearing": bearing,
            "currentDelay": delay,
            "previousStation": prev_st,
            "currentStation": curr_st,
            "nextStation": next_st,
            "segmentProgress": progress,
            "routeGeometry": route_geom,
            "routeStations": route_stations,
            "dataSource": data_source,
            "lastUpdated": live_res.get("lastUpdated") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

    def _normalize_live_data(self, train_number: str, raw: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalizes actual RailRadar /v1/trains/{number}/live response.
        """
        data = raw.get("data", raw)
        train_info = data.get("train", {})

        cur_loc = data.get("currentLocation", {})
        prev_halt = data.get("previousHalt", {})
        next_halt = data.get("nextHalt", {})

        # Coordinates from current location or station fallback
        st_code = cur_loc.get("stationCode", "")
        fallback_coords = FALLBACK_STATION_COORDS.get(st_code, (17.8420, 83.3320))
        
        lat = float(cur_loc.get("latitude") or cur_loc.get("lat") or fallback_coords[0])
        lng = float(cur_loc.get("longitude") or cur_loc.get("lng") or fallback_coords[1])
        speed = float(data.get("speed") or data.get("currentSpeedKmph") or (68.0 if cur_loc.get("status") != "at-station" else 0.0))
        bearing = float(data.get("bearing") or data.get("heading") or 215.0)
        delay = float(data.get("delayMinutes") or cur_loc.get("delayMinutes") or 0.0)

        prev_st = prev_halt.get("stationName") or prev_halt.get("stationCode") or "Origin"
        curr_st = cur_loc.get("stationName") or cur_loc.get("stationCode") or "En Route"
        next_st = next_halt.get("stationName") or next_halt.get("stationCode") or "Upcoming Destination"

        total_dist = float(train_info.get("distance") or 1662.0)
        cov_dist = float(cur_loc.get("distanceFromOriginKm") or 875.0)
        progress = round((cov_dist / total_dist) * 100, 1) if total_dist > 0 else 52.6

        return {
            "trainNumber": str(data.get("trainNumber") or train_number),
            "trainName": str(data.get("trainName") or train_info.get("name") or f"Express {train_number}"),
            "latitude": round(lat, 6),
            "longitude": round(lng, 6),
            "speed": round(speed, 1),
            "bearing": round(bearing, 1),
            "currentDelay": round(delay, 1),
            "previousStation": prev_st,
            "currentStation": curr_st,
            "nextStation": next_st,
            "segmentProgress": min(100.0, max(0.0, progress)),
            "dataSource": "RAILRADAR",
            "isSimulated": False,
            "lastUpdated": data.get("lastUpdatedAt") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "raw_train": train_info
        }

    def _generate_simulated_live(self, train_number: str) -> Dict[str, Any]:
        """
        High-fidelity fallback telemetry when offline or missing credentials.
        """
        is_12864 = train_number == "12864"
        lat = 17.8420 if is_12864 else 19.3400
        lng = 83.3320 if is_12864 else 79.4800
        speed = 72.0 if is_12864 else 88.0
        delay = 42.0 if is_12864 else 8.0

        return {
            "trainNumber": train_number,
            "trainName": "Howrah - SMVT Bengaluru SF Express" if is_12864 else f"Express Train {train_number}",
            "latitude": lat,
            "longitude": lng,
            "speed": speed,
            "bearing": 215.0,
            "currentDelay": delay,
            "previousStation": "Baleshwar (BLS)" if is_12864 else "Ramagundam (RDM)",
            "currentStation": "Near Rajahmundry (RJY)" if is_12864 else "Sirpur Kaghaznagar (SKZR)",
            "nextStation": "Eluru (EE)" if is_12864 else "Balharshah (BPQ)",
            "segmentProgress": 68.0 if is_12864 else 35.0,
            "dataSource": "SIMULATED",
            "isSimulated": True,
            "lastUpdated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

    def _generate_simulated_route(self, train_number: str) -> Dict[str, Any]:
        """
        Fallback GeoJSON route for offline simulation.
        """
        return {
            "trainNumber": train_number,
            "format": "geojson",
            "geojson": {
                "type": "Feature",
                "properties": {"trainNumber": train_number},
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [88.3426, 22.5838],
                        [87.3278, 22.3361],
                        [85.8436, 20.2666],
                        [83.4168, 18.1124],
                        [83.3320, 17.8420],
                        [81.7800, 17.0005],
                        [80.6200, 16.5186],
                        [80.2707, 13.0827],
                        [77.6411, 12.9996]
                    ]
                }
            }
        }

railradar_service = RailRadarService()
