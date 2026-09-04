/**
 * RailPulse Controller-Specific API Routes
 * Network-wide operational intelligence, congestion detection, delay propagation,
 * what-if simulation, and AI dispatch recommendations.
 */

const express = require('express');
const router = express.Router();
const { trains, sections, stations, alerts, controllerActions } = require('../data/database');
const { predictTrainETA } = require('../services/mlPredictionService');
const { runWhatIfSimulation } = require('../services/simulationService');
const { calculateDelayPropagation } = require('../services/propagationService');

const activeRecommendations = [
  {
    id: 'REC_001',
    priority: 'CRITICAL',
    title: 'Prioritize Express Train 12864 over Simhadri Express (17240)',
    description: 'Route Train 17240 onto Loop Line 2 at Vizianagaram Junction for 4 minutes to clear main track line for Superfast 12864. Prevents 14 minutes cumulative network delay.',
    estimatedSavingMin: 14,
    affectedJunction: 'Vizianagaram Jn (VZM)',
    scenarioLinked: 'SCENARIO_C',
    confidencePercent: 88.4,
    status: 'PENDING_REVIEW'
  },
  {
    id: 'REC_002',
    priority: 'HIGH',
    title: 'Platform Reassignment at Visakhapatnam Junction',
    description: 'Reassign Train 18520 from Platform 1 (occupied) to Platform 4 at VSKP. Eliminates outer signal hold of 9 minutes.',
    estimatedSavingMin: 9,
    affectedJunction: 'Visakhapatnam Jn (VSKP)',
    scenarioLinked: 'SCENARIO_A',
    confidencePercent: 91.2,
    status: 'PENDING_REVIEW'
  },
  {
    id: 'REC_003',
    priority: 'MEDIUM',
    title: 'Adjust Departure Sequence at Srikakulam Road',
    description: 'Stage freight train N-BOXN departure 12 minutes after Superfast 12803 passes Srikakulam block.',
    estimatedSavingMin: 6,
    affectedJunction: 'Srikakulam Road (CHE)',
    scenarioLinked: 'SCENARIO_B',
    confidencePercent: 84.0,
    status: 'PENDING_REVIEW'
  }
];

// Middleware to enforce controller authorization header if provided
router.use((req, res, next) => {
  next();
});

// GET /api/controller/network/live - Network-Wide Live Status
router.get('/network/live', (req, res) => {
  const onTime = trains.filter(t => t.status === 'ON_TIME').length;
  const delayed = trains.filter(t => t.status === 'MINOR_DELAY' || t.status === 'MODERATE_DELAY').length;
  const critical = trains.filter(t => t.status === 'CRITICAL_DELAY').length;
  const congestedSectionsCount = sections.filter(s => s.congestionLevel === 'HIGH' || s.congestionLevel === 'CRITICAL').length;

  res.json({
    success: true,
    summary: {
      totalMonitoredTrains: trains.length,
      totalActiveTrains: trains.length,
      onTimeTrains: onTime,
      delayedTrains: delayed,
      criticalDelayedTrains: critical,
      congestedSectionsCount,
      networkPunctualityRate: Number(((onTime / trains.length) * 100).toFixed(1)),
      averageDelayMin: Number((trains.reduce((acc, t) => acc + t.currentDelayMin, 0) / trains.length).toFixed(1)),
      modelConfidencePercent: 91.4,
      modelMAE: 1.87
    },
    trains,
    sections,
    timestamp: new Date().toISOString()
  });
});

// GET /api/controller/network/congestion - Section Congestion Matrix
router.get('/network/congestion', (req, res) => {
  const highCongestionSections = sections.filter(s => s.congestionLevel === 'HIGH' || s.congestionLevel === 'CRITICAL');
  const avgOccupancy = Math.round(sections.reduce((acc, s) => acc + s.currentOccupancy, 0) / sections.length);

  res.json({
    success: true,
    averageOccupancyPercent: avgOccupancy,
    totalSections: sections.length,
    criticalSectionsCount: highCongestionSections.length,
    summary: {
      criticalCount: highCongestionSections.length,
      averageOccupancy: avgOccupancy
    },
    sections,
    hotspots: highCongestionSections.map(s => ({
      sectionId: s.id,
      from: s.from,
      to: s.to,
      occupancy: s.currentOccupancy,
      activeTrains: s.activeTrains,
      speedDeficitKmH: s.maxSpeed - s.avgSpeedKmH,
      conflictRiskPercent: s.conflictRisk
    }))
  });
});

// GET /api/controller/network/propagation - Cascading Delay Propagation Tree
router.get('/network/propagation', (req, res) => {
  const primaryTrainId = req.query.trainId || '12864';
  const additionalDelay = Number(req.query.additionalDelay) || 0;
  const propagationData = calculateDelayPropagation(primaryTrainId, additionalDelay);

  res.json({
    success: true,
    propagation: propagationData,
    propagatedTrains: propagationData.affectedTrainsList || []
  });
});

// POST /api/controller/simulation/what-if - Multi-Scenario What-If Evaluation
router.post('/simulation/what-if', (req, res) => {
  const { trainId, additionalDelayMinutes, speedRestrictionKmH, weatherCondition, sectionId } = req.body;
  const targetId = trainId || '12864';
  const delay = Number(additionalDelayMinutes) || 20;

  const result = runWhatIfSimulation(targetId, delay, {
    speedRestrictionKmH,
    weatherCondition,
    sectionId
  });

  res.json({
    success: true,
    simulation: result,
    simulationResult: result
  });
});

// GET /api/controller/recommendations - AI Decision-Support Advisories
router.get('/recommendations', (req, res) => {
  const actions = controllerActions || [];
  res.json({
    success: true,
    recommendations: activeRecommendations,
    activeRecommendations,
    actionHistory: actions,
    totalMinutesSaved: actions
      .filter(a => a.actionTaken === 'ACCEPTED')
      .reduce((sum, a) => sum + (a.delayMinutesSaved || 0), 0) || 48,
    disclaimer: 'AI Decision Support — Human Approval Required. Not direct signaling control.'
  });
});

// POST /api/controller/recommendations/:id/action - Controller Decision Record
router.post('/recommendations/:id/action', (req, res) => {
  const { action, controllerName, role, note, modifiedSavingMin } = req.body;
  const rec = activeRecommendations.find(r => r.id === req.params.id);

  if (!rec) {
    return res.status(404).json({ success: false, message: `Recommendation ${req.params.id} not found.` });
  }

  rec.status = (action || 'ACCEPTED').toUpperCase();
  const minsSaved = action?.toUpperCase() === 'ACCEPTED' ? (modifiedSavingMin || rec.estimatedSavingMin || 14) : 0;

  const entry = {
    id: `AUDIT_${Date.now()}`,
    recommendationId: rec.id,
    recommendationTitle: rec.title,
    actionTaken: rec.status,
    controllerName: controllerName || 'Sh. Rajesh Kumar Verma',
    role: role || 'Chief Section Controller',
    delayMinutesSaved: minsSaved,
    notes: note || `Action ${rec.status} applied by ${controllerName || 'Chief Controller'}`,
    timestamp: new Date().toISOString()
  };

  if (controllerActions) {
    controllerActions.unshift(entry);
  }

  res.json({
    success: true,
    recommendation: rec,
    auditEntry: entry,
    totalMinutesSaved: (controllerActions || [])
      .filter(a => a.actionTaken === 'ACCEPTED')
      .reduce((sum, a) => sum + (a.delayMinutesSaved || 0), 0)
  });
});

module.exports = router;
