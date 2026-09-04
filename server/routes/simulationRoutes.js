/**
 * RailPulse What-If Simulation API Route
 */

const express = require('express');
const router = express.Router();
const { runWhatIfSimulation } = require('../services/simulationService');

// POST /api/simulation/what-if - Run dynamic scenario disturbance simulation
router.post('/what-if', (req, res) => {
  const { trainId, additionalDelayMinutes, sectionId, speedRestrictionKmH, weatherCondition } = req.body;

  const result = runWhatIfSimulation({
    trainId: trainId || '12864',
    additionalDelayMinutes: Number(additionalDelayMinutes !== undefined ? additionalDelayMinutes : 15),
    sectionId: sectionId || 'SEC_VSKP_VZM',
    speedRestrictionKmH: speedRestrictionKmH ? Number(speedRestrictionKmH) : null,
    weatherCondition: weatherCondition || 'Normal'
  });

  res.json({
    success: true,
    simulation: result
  });
});

module.exports = router;
