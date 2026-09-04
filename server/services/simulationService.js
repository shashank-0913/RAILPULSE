/**
 * RailPulse What-If Simulation & Multiple Scenario Comparison Engine v2.5
 */

const { trains, sections, stations } = require('../data/database');
const { calculateDelayPropagation } = require('./propagationService');

function runWhatIfSimulation(scenarioParams) {
  const {
    trainId = '12864',
    additionalDelayMinutes = 15,
    sectionId = 'SEC_VSKP_VZM',
    speedRestrictionKmH = null,
    weatherCondition = 'Heavy Rain / Fog'
  } = scenarioParams;

  const targetTrain = trains.find(t => t.id === trainId) || trains[0];
  const originalDelay = targetTrain.currentDelayMin;
  const simulatedTotalDelay = originalDelay + Number(additionalDelayMinutes);

  const beforePropagation = calculateDelayPropagation(trainId, 0);
  const afterPropagation = calculateDelayPropagation(trainId, Number(additionalDelayMinutes));

  const baseSection = sections.find(s => s.id === sectionId) || sections[6];
  const beforeOccupancy = baseSection.currentOccupancy;
  const afterOccupancy = Math.min(100, Math.round(beforeOccupancy + (additionalDelayMinutes * 1.2)));
  const occupancyDeltaPercent = afterOccupancy - beforeOccupancy;

  const beforeTrains = [
    { id: targetTrain.id, name: targetTrain.name, delayMin: originalDelay, eta: targetTrain.predictedNextArrival, status: targetTrain.statusText },
    { id: '17240', name: 'Simhadri Express', delayMin: 2, eta: '18:44', status: 'Minor Delay (+2 min)' },
    { id: '18520', name: 'LTT VSKP Express', delayMin: 5, eta: '18:58', status: 'Minor Delay (+5 min)' },
    { id: '12803', name: 'Swarna Jayanti Express', delayMin: 32, eta: '18:49', status: 'Critical Delay (+32 min)' }
  ];

  const afterTrains = [
    {
      id: targetTrain.id,
      name: targetTrain.name,
      delayMin: simulatedTotalDelay,
      deltaMin: Number(additionalDelayMinutes),
      eta: '18:57',
      status: `Severe Delay (+${simulatedTotalDelay} min)`
    }
  ];

  if (simulatedTotalDelay >= 25) {
    afterTrains.push({ id: '17240', name: 'Simhadri Express', delayMin: 18, deltaMin: 16, eta: '19:00', status: 'Moderate Delay (+18 min)' });
    afterTrains.push({ id: '18520', name: 'LTT VSKP Express', delayMin: 14, deltaMin: 9, eta: '19:07', status: 'Moderate Delay (+14 min)' });
    afterTrains.push({ id: '12803', name: 'Swarna Jayanti Express', delayMin: 44, deltaMin: 12, eta: '19:01', status: 'Critical Delay (+44 min)' });
  } else if (simulatedTotalDelay >= 15) {
    afterTrains.push({ id: '17240', name: 'Simhadri Express', delayMin: 11, deltaMin: 9, eta: '18:53', status: 'Delayed (+11 min)' });
    afterTrains.push({ id: '18520', name: 'LTT VSKP Express', delayMin: 8, deltaMin: 3, eta: '19:01', status: 'Delayed (+8 min)' });
    afterTrains.push({ id: '12803', name: 'Swarna Jayanti Express', delayMin: 36, deltaMin: 4, eta: '18:53', status: 'Critical (+36 min)' });
  } else {
    afterTrains.push({ id: '17240', name: 'Simhadri Express', delayMin: 5, deltaMin: 3, eta: '18:47', status: 'Minor (+5 min)' });
    afterTrains.push({ id: '18520', name: 'LTT VSKP Express', delayMin: 6, deltaMin: 1, eta: '18:59', status: 'Minor (+6 min)' });
    afterTrains.push({ id: '12803', name: 'Swarna Jayanti Express', delayMin: 32, deltaMin: 0, eta: '18:49', status: 'Critical (+32 min)' });
  }

  // Multiple Scenario Comparison (Prompt Section 15)
  const scenariosComparison = [
    {
      id: 'SCENARIO_A',
      name: 'Scenario A: Hold Train 17240 at Outer Signal',
      strategy: 'Hold secondary train for 4 minutes at Ponduru outer signal until mainline clears.',
      totalNetworkDelayMin: 12,
      delaySavedMin: 5,
      cascadeRisk: 'MEDIUM',
      platformCongestionPercent: 72,
      controllerFeasibility: 'HIGH',
      isPreferred: false
    },
    {
      id: 'SCENARIO_B',
      name: 'Scenario B: Dynamic Speed Regulation & Prioritization',
      strategy: 'Speed up Train 12864 to 90 km/h with green wave aspect; maintain standard spacing.',
      totalNetworkDelayMin: 9,
      delaySavedMin: 8,
      cascadeRisk: 'MEDIUM',
      platformCongestionPercent: 64,
      controllerFeasibility: 'MEDIUM',
      isPreferred: false
    },
    {
      id: 'SCENARIO_C',
      name: 'Scenario C: Reassign to Alternate Loop Line 2 at VZM',
      strategy: 'Route Train 17240 to Loop Line 2; bypass Platform 3 conflict completely.',
      totalNetworkDelayMin: 5,
      delaySavedMin: 14,
      cascadeRisk: 'LOW',
      platformCongestionPercent: 48,
      controllerFeasibility: 'VERY_HIGH',
      isPreferred: true
    }
  ];

  const preferredOption = {
    scenarioId: 'SCENARIO_C',
    title: 'Scenario C — Alternate Loop Line 2 Reassignment',
    expectedNetworkDelayReductionMin: 14,
    confidencePercent: 88.4,
    rationale: 'Eliminates direct platform conflict at Vizianagaram Junction and prevents cascade onto Simhadri and Godavari Express services.'
  };

  const recommendations = [
    {
      id: 'REC_001',
      priority: 'CRITICAL',
      title: `Prioritize Express Train ${targetTrain.id} over Simhadri (17240)`,
      description: `Route Train 17240 onto Loop Line 2 at Vizianagaram Junction for 4 minutes to clear main track line for Superfast ${targetTrain.id}. Prevents 14 minutes cumulative network delay.`,
      estimatedSavingMin: 14,
      affectedJunction: 'Vizianagaram Jn (VZM)',
      scenarioLinked: 'SCENARIO_C',
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
      status: 'PENDING_REVIEW'
    }
  ];

  return {
    scenarioId: `SIM_${Date.now()}`,
    timestamp: new Date().toISOString(),
    inputScenario: {
      trainId,
      trainName: targetTrain.name,
      additionalDelayMinutes: Number(additionalDelayMinutes),
      sectionId,
      sectionName: `${baseSection.from} → ${baseSection.to}`,
      simulatedTotalDelayMin: simulatedTotalDelay,
      weatherCondition,
      speedRestrictionKmH
    },
    impactSummary: {
      beforeCascadeRisk: beforePropagation.cascadeRisk,
      afterCascadeRisk: afterPropagation.cascadeRisk,
      beforeOccupancyPercent: beforeOccupancy,
      afterOccupancyPercent: afterOccupancy,
      occupancyDeltaPercent: `+${occupancyDeltaPercent}%`,
      affectedTrainsCount: afterTrains.length - 1,
      totalDownstreamMinutesLost: afterPropagation.totalCascadeMinutes,
      affectedStationsCount: afterPropagation.affectedStationsCount,
      probabilityPercent: afterPropagation.probabilityPercent
    },
    comparison: {
      before: beforeTrains,
      after: afterTrains
    },
    scenariosComparison,
    preferredOption,
    recommendations,
    disclaimer: 'AI Decision Support recommendations are generated for prototype evaluation and operational assistance. System does not directly control physical railway interlocking.'
  };
}

module.exports = {
  runWhatIfSimulation
};
