const https = require('https');

const API_KEY = "rg_7bffb2b23dd2416aa77adef957464e70";
const BASE_HOST = "api.railradar.in";

const endpoints = [
  "/v1/lookup/search/trains?query=12864",
  "/v1/trains/12864",
  "/v1/trains/12864/live",
  "/v1/trains/12864/route",
  "/v1/lookup/search/trains?query=12723",
  "/v1/trains/12723/live",
  "/v1/trains/12723/route"
];

async function checkEndpoint(ep) {
  return new Promise((resolve) => {
    const options = {
      hostname: BASE_HOST,
      path: ep,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'RailPulse-AI-Engine/2.0'
      },
      timeout: 6000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n[HTTP ${res.statusCode}] ${ep}`);
        try {
          const parsed = JSON.parse(data);
          const sample = JSON.stringify(parsed, null, 2).slice(0, 300);
          console.log(`  Parsed JSON sample:\n${sample}...`);
        } catch (e) {
          console.log(`  Raw Text: ${data.slice(0, 200)}`);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`\n[ERROR] ${ep}: ${err.message}`);
      resolve();
    });

    req.on('timeout', () => {
      console.log(`\n[TIMEOUT] ${ep}`);
      req.destroy();
      resolve();
    });

    req.end();
  });
}

async function run() {
  console.log(`Testing RailRadar API with Key: ${API_KEY.slice(0, 8)}...`);
  for (const ep of endpoints) {
    await checkEndpoint(ep);
  }
}

run();
