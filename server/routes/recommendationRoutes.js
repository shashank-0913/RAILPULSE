/**
 * RailPulse AI Recommendations & Human-in-the-Loop Action Ledger API Routes
 */

const express = require('express');
const router = express.Router();
let { controllerActions } = require('../data/database');

// GET /api/recommendations - List active recommendations and controller audit history
router.get('/', (req, res) => {
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

  res.json({
    success: true,
    activeRecommendations,
    actionHistory: controllerActions,
    totalMinutesSaved: controllerActions
      .filter(a => a.actionTaken === 'ACCEPTED')
      .reduce((sum, a) => sum + (a.delayMinutesSaved || 0), 0)
  });
});

// POST /api/recommendations/:id/action - Controller records Accept / Reject / Modify action
router.post('/:id/action', (req, res) => {
  const { action, controllerName, role, note, modifiedSavingMin } = req.body;
  const recId = req.params.id;

  const actionEntry = {
    id: `ACT_${Date.now()}`,
    timestamp: new Date().toISOString(),
    recommendationId: recId,
    recommendationTitle: recId === 'REC_001' ? 'Hold Train 17240 on Loop Line 2 at Vizianagaram' :
                         recId === 'REC_002' ? 'Platform Reassignment at Visakhapatnam Junction' : 'Adjust Departure Sequence at Srikakulam Road',
    controllerName: controllerName || 'Chief Section Controller',
    role: role || 'Chief Section Controller (Waltair)',
    actionTaken: (action || 'ACCEPTED').toUpperCase(), // ACCEPTED | REJECTED | MODIFIED
    delayMinutesSaved: action === 'REJECTED' ? 0 : (modifiedSavingMin || (recId === 'REC_001' ? 14 : recId === 'REC_002' ? 9 : 6)),
    note: note || (action === 'ACCEPTED' ? 'Approved by Section Controller. Caution order updated.' : 'Action decision recorded.'),
    status: 'EXECUTED_SUCCESSFULLY'
  };

  controllerActions.unshift(actionEntry);

  res.json({
    success: true,
    message: `Recommendation ${recId} ${actionEntry.actionTaken} by Controller. Decision recorded in CRIS audit trail.`,
    actionEntry,
    totalMinutesSaved: controllerActions
      .filter(a => a.actionTaken === 'ACCEPTED')
      .reduce((sum, a) => sum + (a.delayMinutesSaved || 0), 0)
  });
});

module.exports = router;
