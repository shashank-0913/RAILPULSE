/**
 * RailPulse Network Congestion, Conflicts, Anomalies & Propagation API Routes
 */

const express = require('express');
const router = express.Router();
const { sections, stations, trains, anomalies, conflicts, stationImpacts, dataQualityStatus } = require('../data/database');
const { calculateDelayPropagation } = require('../services/propagationService');

// GET /api/network/congestion - Section congestion matrix
router.get('/congestion', (req, res) => {
  const enrichedSections = sections.map(sec => {
    const sectionTrains = trains.filter(t => t.currentSection === sec.id);

    return {
      ...sec,
      trainsInBlock: sectionTrains.map(t => ({
        id: t.id,
        name: t.name,
        speedKmH: t.speedKmH,
        delayMin: t.currentDelayMin,
        status: t.status
      })),
      expectedDelayImpactRange: sec.congestionLevel === 'HIGH' ? '+8 to +15 minutes' : sec.congestionLevel === 'MEDIUM' ? '+3 to +7 minutes' : '0 to +2 minutes',
      headwayBufferStatus: sec.conflictRisk > 60 ? 'HEADWAY_COMPRESSED' : 'NORMAL'
    };
  });

  const summary = {
    totalSections: sections.length,
    highCongestionSections: sections.filter(s => s.congestionLevel === 'HIGH').length,
    mediumCongestionSections: sections.filter(s => s.congestionLevel === 'MEDIUM').length,
    lowCongestionSections: sections.filter(s => s.congestionLevel === 'LOW').length,
    highestConflictSection: sections.reduce((prev, cur) => (cur.conflictRisk > prev.conflictRisk ? cur : prev), sections[0])
  };

  res.json({
    success: true,
    summary,
    sections: enrichedSections
  });
});

// GET /api/network/conflicts - Active junction & section conflicts
router.get('/conflicts', (req, res) => {
  res.json({
    success: true,
    totalConflicts: conflicts.length,
    conflicts
  });
});

// GET /api/network/anomalies - Speed deviations, sudden stops, excessive dwell
router.get('/anomalies', (req, res) => {
  res.json({
    success: true,
    totalAnomalies: anomalies.length,
    anomalies
  });
});

// GET /api/network/data-quality - Telemetry health & uncertainty score
router.get('/data-quality', (req, res) => {
  res.json({
    success: true,
    dataQuality: dataQualityStatus
  });
});

// GET /api/network/station-impacts - Predicted platform pressure & arrival delays
router.get('/station-impacts', (req, res) => {
  res.json({
    success: true,
    stationImpacts
  });
});

// GET /api/network/propagation - Cascading delay propagation tree with Time-to-Impact
router.get('/propagation', (req, res) => {
  const originTrainId = req.query.trainId || '12864';
  const additionalDelay = Number(req.query.additionalDelay || 0);

  const result = calculateDelayPropagation(originTrainId, additionalDelay);

  res.json({
    success: true,
    ...result
  });
});

// GET /api/network/stations - List all railway station nodes
router.get('/stations', (req, res) => {
  res.json({
    success: true,
    stations
  });
});

module.exports = router;
