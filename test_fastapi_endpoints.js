const http = require('http');

function get(path) {
  return new Promise((resolve) => {
    http.get(`http://127.0.0.1:8000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', err => resolve({ error: err.message }));
  });
}

async function testFastAPI() {
  console.log("=== TESTING FASTAPI RAILRADAR BACKEND ON PORT 8000 ===\n");

  const root = await get("/");
  console.log("[1] Root:", root.status, root.data?.capabilities);

  const search = await get("/v1/lookup/search/trains?q=12864");
  console.log("\n[2] Search (12864):", search.status, "Found:", search.data?.data?.length, "Train:", search.data?.data?.[0]?.name);

  const live12864 = await get("/v1/trains/12864/live");
  console.log("\n[3] Live (12864):", live12864.status, "Location:", live12864.data?.previousStation, "->", live12864.data?.currentStation, "->", live12864.data?.nextStation, "Speed:", live12864.data?.speed, "Delay:", live12864.data?.currentDelay, "Source:", live12864.data?.dataSource);

  const route12864 = await get("/v1/trains/12864/route");
  console.log("\n[4] Route (12864):", route12864.status, "GeoJSON Type:", route12864.data?.geojson?.geometry?.type, "Coords Count:", route12864.data?.geojson?.geometry?.coordinates?.length);

  const details12864 = await get("/v1/trains/12864");
  console.log("\n[5] Details (12864):", details12864.status, "Train:", details12864.data?.train?.name, "Stops:", details12864.data?.route?.length);

  const normalized12864 = await get("/api/passenger/trains/12864/journey");
  console.log("\n[6] Normalized Passenger Journey (12864):", normalized12864.status);
  console.log("  - Train:", normalized12864.data?.trainNumber, normalized12864.data?.trainName);
  console.log("  - Source -> Dest:", normalized12864.data?.trainSource, "->", normalized12864.data?.trainDestination);
  console.log("  - GPS:", normalized12864.data?.latitude, normalized12864.data?.longitude, "Speed:", normalized12864.data?.speed, "km/h");
  console.log("  - Route Stations:", normalized12864.data?.routeStations?.length);
  console.log("  - Data Source:", normalized12864.data?.dataSource);

  // Train B: 12723 (Telangana Express)
  console.log("\n--- TESTING TRAIN B (12723 Telangana Express) ---");
  const live12723 = await get("/v1/trains/12723/live");
  console.log("[7] Live (12723):", live12723.status, "Name:", live12723.data?.trainName, "Location:", live12723.data?.currentStation, "Speed:", live12723.data?.speed, "Delay:", live12723.data?.currentDelay);

  const normalized12723 = await get("/api/passenger/trains/12723/journey");
  console.log("[8] Normalized Journey (12723):", normalized12723.status, "Route:", normalized12723.data?.trainSource, "->", normalized12723.data?.trainDestination, "Stations:", normalized12723.data?.routeStations?.length);
}

testFastAPI();
