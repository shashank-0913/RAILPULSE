import httpx
import json
import asyncio

API_KEY = "rg_7bffb2b23dd2416aa77adef957464e70"
BASE_URL = "https://api.railradar.in/v1"

async def test_railradar():
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json",
        "User-Agent": "RailPulse-AI-Engine/2.0"
    }
    
    endpoints = [
        "/lookup/search/trains?query=12864",
        "/trains/12864",
        "/trains/12864/live",
        "/trains/12864/route",
        "/trains/12864/route?format=geojson&stops=true",
        "/lookup/search/trains?query=12723",
        "/trains/12723/live",
        "/trains/12723/route"
    ]
    
    print(f"Testing RailRadar API with Key: {API_KEY[:8]}... (Base: {BASE_URL})")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        for ep in endpoints:
            url = f"{BASE_URL}{ep}"
            try:
                res = await client.get(url, headers=headers)
                print(f"\n[HTTP {res.status_code}] {ep}")
                if res.status_code == 200:
                    try:
                        data = res.json()
                        keys = list(data.keys()) if isinstance(data, dict) else f"list({len(data)})"
                        sample = json.dumps(data, indent=2)[:300]
                        print(f"  Keys: {keys}\n  Sample: {sample}...")
                    except Exception:
                        print(f"  Raw text: {res.text[:200]}")
                else:
                    print(f"  Response: {res.text[:200]}")
            except Exception as e:
                print(f"  Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_railradar())
