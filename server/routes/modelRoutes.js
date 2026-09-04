/**
 * RailPulse Model Metrics & Explainability Specification API
 */

const express = require('express');
const router = express.Router();
const { MODEL_METRICS } = require('../services/mlPredictionService');

// GET /api/model/metrics - Evaluation metrics, feature importance, and benchmark stats
router.get('/metrics', (req, res) => {
  res.json({
    success: true,
    model: MODEL_METRICS,
    pipelineArchitecture: [
      { step: 1, name: 'Telemetry Stream Ingestion', description: 'GPS polling, RTIS loco sensor feed, and block clearance signals every 4 seconds.' },
      { step: 2, name: 'Data Normalization & Imputation', description: 'Spike filtering, coordinate projection to track vectors, speed smoothing.' },
      { step: 3, name: 'Dynamic Feature Engineering', description: 'Computing speed deficit, section occupancy density, dwell variances, historical weights.' },
      { step: 4, name: 'XGBoost Multi-Horizon Regression', description: 'Predicting continuous delay delta at next 3 upcoming stations and final destination.' },
      { step: 5, name: 'Conflict & Propagation Graph Engine', description: 'Evaluating section occupancy constraints, headway compression, and cascading train interactions.' },
      { step: 6, name: 'Decision Support & Operational Alerts', description: 'Formulating dispatch recommendations (loop line holds, platform swaps) with SHAP explainability.' }
    ],
    productionTransitionPlan: {
      dataSources: [
        { name: 'NTES (National Train Enquiry System)', purpose: 'Official scheduled and actual departure/arrival milestones' },
        { name: 'COA (Control Office Application)', purpose: 'Dispatcher signal aspects, caution orders, platform allotment' },
        { name: 'RTIS (Real-time Train Information System - ISRO MSS)', purpose: 'High-frequency GPS locomotive transponder coordinates' },
        { name: 'IMD API (India Meteorological Department)', purpose: 'Trackside rainfall, fog visibility, storm advisories' }
      ],
      stepToDeploy: 'Replace simulated in-memory store in `server/data/database.js` with Kafka/WebSocket connector to CRIS/COA API endpoints.'
    }
  });
});

module.exports = router;
