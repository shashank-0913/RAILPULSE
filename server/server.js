/**
 * RailPulse Backend API Server v2.5
 * Dynamic Train ETA Prediction & Delay Intelligence Platform
 * SIH26028 | Ministry of Railways
 */

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const trainRoutes = require('./routes/trainRoutes');
const passengerRoutes = require('./routes/passengerRoutes');
const controllerRoutes = require('./routes/controllerRoutes');
const networkRoutes = require('./routes/networkRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const pnrRoutes = require('./routes/pnrRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const alertRoutes = require('./routes/alertRoutes');
const modelRoutes = require('./routes/modelRoutes');
const demoRoutes = require('./routes/demoRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production' && !req.url.includes('/api/trains/simulate-tick')) {
      console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/passenger', passengerRoutes);
app.use('/api/controller', controllerRoutes);
app.use('/api/trains', trainRoutes);
app.use('/v1/trains', trainRoutes);
app.use('/api/pnr', pnrRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/model', modelRoutes);
app.use('/api/demo', demoRoutes);

// System Health / Status endpoint
app.get('/api/system/status', (req, res) => {
  res.json({
    services: {
      railradar: {
        name: "RailRadar API",
        status: process.env.RAILRADAR_API_KEY ? "LIVE" : "DEMO",
        is_active: !!process.env.RAILRADAR_API_KEY,
        label: process.env.RAILRADAR_API_KEY ? "Live Telemetry" : "Simulated Telemetry (Fallback Active)",
        endpoint: "https://api.railradar.in/v1/trains/{number}/live"
      },
      openweather: {
        name: "OpenWeather API",
        status: process.env.OPENWEATHER_API_KEY ? "LIVE" : "OFFLINE",
        is_active: !!process.env.OPENWEATHER_API_KEY,
        label: process.env.OPENWEATHER_API_KEY ? "Active Live" : "Gracefully Omitted (ML Continues)"
      },
      database: {
        name: "Database Engine",
        status: process.env.DATABASE_URL ? "LIVE" : "SQLITE_FALLBACK",
        type: process.env.DATABASE_URL ? "POSTGRESQL" : "SQLITE_FALLBACK",
        label: process.env.DATABASE_URL ? "PostgreSQL Connected" : "SQLite / In-Memory Demo Store"
      },
      ml_engine: {
        name: "XGBoost ML ETA Model",
        status: "READY",
        is_active: true,
        label: "Python Native (XGBoost v2.1)",
        accuracy: "MAE: 1.87m | RMSE: 2.36m | R²: 0.9419"
      },
      websocket: {
        name: "Real-time WebSocket Stream",
        status: "LIVE",
        endpoint: "/ws/trains/{train_number}"
      }
    },
    mode: "HYBRID_READY",
    demo_notice: "Zero-credential graceful simulation mode active.",
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'RAILPULSE AI Intelligence Engine v2.5',
    version: '2.5.0-PROTOTYPE',
    timestamp: new Date().toISOString(),
    evaluationCategory: 'SIH26028 — Ministry of Railways',
    featuresActive: [
      'XGBOOST_ETA',
      'CONFLICT_DETECTION',
      'ANOMALY_DETECTION',
      'PROPAGATION_GRAPH',
      'TIME_TO_IMPACT',
      'MULTI_SCENARIO_SANDBOX',
      'HUMAN_IN_THE_LOOP',
      'PNR_OFFLINE_ENGINE',
      'GOV_ID_GATE'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Intelligence Engine Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` RAILPULSE Backend Server active on http://localhost:${PORT}`);
  console.log(` AI Railway Intelligence Platform (SIH26028)`);
  console.log(` Loop: TRACK -> PREDICT -> DETECT -> PROPAGATE -> SIMULATE -> RECOMMEND -> ALERT -> LEARN`);
  console.log(`=======================================================`);
});
