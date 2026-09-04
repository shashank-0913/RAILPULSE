/**
 * RailPulse Intelligent Alerts API Routes
 */

const express = require('express');
const router = express.Router();
let { alerts } = require('../data/database');

// GET /api/alerts - List all live system alerts
router.get('/', (req, res) => {
  const { severity, unacknowledgedOnly } = req.query;
  let result = [...alerts];

  if (severity) {
    result = result.filter(a => a.severity.toLowerCase() === severity.toLowerCase());
  }

  if (unacknowledgedOnly === 'true') {
    result = result.filter(a => !a.acknowledged);
  }

  const summary = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'RED').length,
    warning: alerts.filter(a => a.severity === 'ORANGE').length,
    advisory: alerts.filter(a => a.severity === 'YELLOW').length,
    info: alerts.filter(a => a.severity === 'BLUE').length,
    unacknowledged: alerts.filter(a => !a.acknowledged).length
  };

  res.json({
    success: true,
    summary,
    alerts: result
  });
});

// POST /api/alerts/:id/ack - Acknowledge alert
router.post('/:id/ack', (req, res) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) {
    return res.status(404).json({ success: false, message: 'Alert not found.' });
  }

  alert.acknowledged = true;
  alert.acknowledgedAt = new Date().toISOString();

  res.json({
    success: true,
    message: `Alert ${alert.id} acknowledged.`,
    alert
  });
});

module.exports = router;
