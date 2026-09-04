const https = require('https');

const API_KEY = "rg_7bffb2b23dd2416aa77adef957464e70";
const BASE_HOST = "api.railradar.in";

async function fetchJSON(ep) {
  return new Promise((resolve) => {
    const options = {
      hostname: BASE_HOST,
      path: ep,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'RailPulse-AI-Engine/2.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });
    req.on('error', err => resolve({ error: err.message }));
    req.end();
  });
}

async function inspect() {
  console.log("=== INSPECTING LIVE ENDPOINTS ===");
  
  const search = await fetchJSON("/v1/lookup/search/trains?q=12864");
  console.log("\n--- /v1/lookup/search/trains?q=12864 ---");
  console.log(JSON.stringify(search, null, 2).slice(0, 1000));

  const train = await fetchJSON("/v1/trains/12864");
  console.log("\n--- /v1/trains/12864 ---");
  console.log(JSON.stringify(train, null, 2).slice(0, 1500));

  const live = await fetchJSON("/v1/trains/12864/live");
  console.log("\n--- /v1/trains/12864/live ---");
  console.log(JSON.stringify(live, null, 2).slice(0, 2500));

  const route = await fetchJSON("/v1/trains/12864/route");
  console.log("\n--- /v1/trains/12864/route ---");
  console.log("Keys:", Object.keys(route?.data || {}));
  console.log("GeoJSON coordinates sample:", (route?.data?.geojson?.geometry?.coordinates || []).slice(0, 5));
  console.log("Stops/Stations sample:", (route?.data?.stations || route?.data?.stops || []).slice(0, 3));
}

inspect();
