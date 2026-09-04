/**
 * RailPulse SIH Judge Interactive 14-Step Demo API Routes
 * Implements the full 14-step presentation sequence required by SIH26028 evaluators.
 */

const express = require('express');
const router = express.Router();
let { trains, sections, controllerActions } = require('../data/database');

const DEMO_STEPS = [
  {
    step: 1,
    title: 'Baseline State: Train 12864 Operating on Schedule',
    phase: 'TRACK',
    highlightTab: 'overview',
    description: 'Train 12864 (Howrah - SMVB Express) is cruising at 85 km/h on the East Coast trunk corridor. Current delay is nominal (+0 min).',
    actionTaken: 'Baseline RTIS GPS telemetry ingested.',
    stateChanges: { train12864Delay: 0, train12864Speed: 85, sectionOccupancy: 65, cascadeRisk: 'LOW' }
  },
  {
    step: 2,
    title: 'Disturbance Injected: Train 12864 Receives Unexpected 10-Min Delay',
    phase: 'DISTURBANCE',
    highlightTab: 'tracking',
    description: 'An unexpected level-crossing gate hold near Simhachalam North blocks Train 12864. Instantaneous delay rises to +10 minutes.',
    actionTaken: 'Telemetry anomaly detected at GPS Block KM 38.4.',
    stateChanges: { train12864Delay: 10, train12864Speed: 42, sectionOccupancy: 78, cascadeRisk: 'MEDIUM' }
  },
  {
    step: 3,
    title: 'Dynamic Prediction: RailPulse Recalculates Dynamic ETA',
    phase: 'PREDICT',
    highlightTab: 'eta',
    description: 'XGBoost engine updates ETA for Vizianagaram from 18:30 to 18:42 (+12m shift). Destination arrival shifted to 06:34 (+19m). Confidence: 91.4%.',
    actionTaken: 'Dynamic ETA stream updated across station display boards.',
    stateChanges: { train12864Eta: '18:42', confidence: 91.4, explainabilityActive: true }
  },
  {
    step: 4,
    title: 'Anomaly Detection: Abnormal Speed Drop Flagged (41 km/h vs 78 km/h)',
    phase: 'DETECT',
    highlightTab: 'congestion',
    description: 'System detects a 47% negative speed deficit on Train 12864 traversing the ghat curve, raising an operational anomaly flag.',
    actionTaken: 'Speed deficit penalty injected into multi-horizon feature vector.',
    stateChanges: { anomalyDetected: 'ANOM_001', observedSpeed: 41, deviation: '47%' }
  },
  {
    step: 5,
    title: 'Network Monitoring: Section VSKP→VZM Congestion Climbs to 88%',
    phase: 'DETECT',
    highlightTab: 'congestion',
    description: 'Section VSKP→VZM occupancy reaches 88% with 7 active trains in the 61 km corridor. Average section speed drops to 42 km/h.',
    actionTaken: 'Section VSKP→VZM flagged with HIGH CONGESTION alarm.',
    stateChanges: { sectionOccupancy: 88, conflictRisk: 73, activeTrainsInSection: 7 }
  },
  {
    step: 6,
    title: 'Convergence: Train 17240 (Simhadri Express) Approaches Section',
    phase: 'CONVERGENCE',
    highlightTab: 'tracking',
    description: 'Train 17240 enters the same block from Ponduru Outer. Running on time (+2m) but rapidly closing the headway gap behind Train 12864.',
    actionTaken: 'Proximity detection algorithm triggered.',
    stateChanges: { train17240DistanceToConflictKm: 18.2 }
  },
  {
    step: 7,
    title: 'Conflict Detection: 73% Junction Headway Conflict Detected',
    phase: 'DETECT',
    highlightTab: 'congestion',
    description: 'System forecasts Train 17240 will reach Vizianagaram Junction while Platform 3 is still occupied by the delayed Train 12864.',
    actionTaken: 'Headway safety compression alarm generated.',
    stateChanges: { conflictProbability: 73, bottleneckStation: 'VZM' }
  },
  {
    step: 8,
    title: 'Secondary Forecasting: Train 17240 Predicted Delay (+15 min)',
    phase: 'PREDICT',
    highlightTab: 'forecast',
    description: 'RailPulse forecasts Train 17240 will incur a 13-minute outer signal hold (+15 min total) unless dispatch intervention is applied.',
    actionTaken: 'Secondary train delay profile updated in dispatch forecast.',
    stateChanges: { train17240PredictedDelay: 15 }
  },
  {
    step: 9,
    title: 'Propagation & Time-to-Impact: Early Warning Issued (17 Min to Impact)',
    phase: 'PROPAGATE',
    highlightTab: 'propagation',
    description: 'Cascade Graph shows ripple across 3 trains and 4 stations. Time-to-impact timer highlights: 17 minutes until secondary hold occurs.',
    actionTaken: 'Cascade Risk Level upgraded to HIGH (78% Probability).',
    stateChanges: { cascadeRisk: 'HIGH', timeToImpactMin: 17, affectedTrainsCount: 3 }
  },
  {
    step: 10,
    title: 'What-If Simulation: Controller Opens Disturbance Sandbox',
    phase: 'SIMULATE',
    highlightTab: 'simulation',
    description: 'Controller initiates What-If Sandbox with Train 12864 (+15m delay injection) to evaluate downstream impact.',
    actionTaken: 'Scenario sandbox initialized.',
    stateChanges: { sandboxActive: true, simulatedDelayMin: 15 }
  },
  {
    step: 11,
    title: 'Scenario Comparison: System Evaluates Scenarios A, B, and C',
    phase: 'SIMULATE',
    highlightTab: 'simulation',
    description: 'System compares Scenario A (Hold Train 17240 at Outer), Scenario B (Speed regulation), and Scenario C (Reassign to Loop Line 2).',
    actionTaken: 'Multi-scenario comparative matrix generated.',
    stateChanges: { scenarioA_Delay: 12, scenarioB_Delay: 9, scenarioC_Delay: 5 }
  },
  {
    step: 12,
    title: 'AI Recommendation: System Formulates Preferred Option (Scenario C)',
    phase: 'RECOMMEND',
    highlightTab: 'recommendations',
    description: 'AI identifies Scenario C as preferred option: reassign Train 17240 to Loop Line 2 at VZM, saving 14 cumulative network minutes.',
    actionTaken: 'AI Recommendation REC_001 routed to Controller HUD.',
    stateChanges: { preferredScenario: 'SCENARIO_C', delaySaved: 14 }
  },
  {
    step: 13,
    title: 'Human-in-the-Loop: Controller Reviews & Accepts Recommendation',
    phase: 'HUMAN_IN_THE_LOOP',
    highlightTab: 'recommendations',
    description: 'Chief Section Controller accepts recommendation. Decision is logged into the official CRIS audit trail ledger.',
    actionTaken: 'Controller action ACT_001 recorded: ACCEPTED.',
    stateChanges: { actionLogged: true, totalSavedMinutes: 14 }
  },
  {
    step: 14,
    title: 'Network Recovery: Congestion Cleared & Cascade Averted',
    phase: 'LEARN',
    highlightTab: 'overview',
    description: 'Train 17240 smoothly bypasses via Loop Line 2. Cascade risk drops from HIGH to LOW. Total network delay reduced by 14 minutes.',
    actionTaken: 'Model evaluation telemetry logged for continuous learning.',
    stateChanges: { cascadeRisk: 'LOW', networkCongestionSaved: '23%', resolved: true }
  }
];

// GET /api/demo/steps
router.get('/steps', (req, res) => {
  res.json({
    success: true,
    totalSteps: DEMO_STEPS.length,
    steps: DEMO_STEPS
  });
});

// POST /api/demo/step/:stepNumber
router.post('/step/:stepNumber', (req, res) => {
  const stepNum = Number(req.params.stepNumber);
  const step = DEMO_STEPS.find(s => s.step === stepNum);

  if (!step) {
    return res.status(404).json({ success: false, message: `Demo step #${stepNum} not found (Valid range: 1 to 14).` });
  }

  const t12864 = trains.find(t => t.id === '12864');
  const t17240 = trains.find(t => t.id === '17240');

  if (stepNum === 1) {
    if (t12864) { t12864.currentDelayMin = 0; t12864.speedKmH = 85; t12864.status = 'ON_TIME'; t12864.statusText = 'On Time (0 min)'; t12864.statusColor = '#10b981'; }
    if (t17240) { t17240.currentDelayMin = 0; t17240.status = 'ON_TIME'; }
  } else if (stepNum >= 2 && stepNum <= 3) {
    if (t12864) { t12864.currentDelayMin = 10; t12864.speedKmH = 42; t12864.status = 'MODERATE_DELAY'; t12864.statusText = 'Delayed (+10 min)'; t12864.statusColor = '#f97316'; }
  } else if (stepNum >= 4 && stepNum <= 12) {
    if (t12864) { t12864.currentDelayMin = 12; t12864.speedKmH = 41; t12864.status = 'MODERATE_DELAY'; t12864.statusText = 'Delayed (+12 min)'; t12864.statusColor = '#f97316'; }
    if (t17240 && stepNum >= 8) { t17240.currentDelayMin = 15; t17240.status = 'MODERATE_DELAY'; t17240.statusText = 'Cascaded Delay (+15 min)'; }
  } else if (stepNum >= 13) {
    if (t12864) { t12864.currentDelayMin = 12; t12864.speedKmH = 75; t12864.status = 'MODERATE_DELAY'; t12864.statusText = 'Delayed (+12 min)'; }
    if (t17240) { t17240.currentDelayMin = 3; t17240.status = 'MINOR_DELAY'; t17240.statusText = 'Recovered (+3 min)'; t17240.statusColor = '#f59e0b'; }
  }

  res.json({
    success: true,
    step,
    currentStepIndex: stepNum,
    totalSteps: DEMO_STEPS.length
  });
});

// POST /api/demo/reset
router.post('/reset', (req, res) => {
  const t12864 = trains.find(t => t.id === '12864');
  const t17240 = trains.find(t => t.id === '17240');

  if (t12864) {
    t12864.currentDelayMin = 12;
    t12864.speedKmH = 72;
    t12864.status = 'MODERATE_DELAY';
    t12864.statusText = 'Delayed (+12 min)';
    t12864.statusColor = '#f97316';
  }
  if (t17240) {
    t17240.currentDelayMin = 2;
    t17240.speedKmH = 58;
    t17240.status = 'MINOR_DELAY';
    t17240.statusText = 'Minor Delay (+2 min)';
    t17240.statusColor = '#f59e0b';
  }

  res.json({
    success: true,
    message: 'Demo state reset to default live telemetry profile.'
  });
});

module.exports = router;
