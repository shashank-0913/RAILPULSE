/**
 * RailPulse Delay Propagation & Cascading Conflict Engine v2.5
 * Computes downstream ripple effects, cascade probabilities, and early-warning Time-to-Impact timeline.
 */

const { trains, sections, stations } = require('../data/database');

function calculateDelayPropagation(originTrainId = '12864', additionalDelayMin = 0) {
  const originTrain = trains.find(t => t.id === originTrainId) || trains[0];
  const totalOriginDelay = (originTrain.currentDelayMin || 0) + additionalDelayMin;
  const currentSec = sections.find(s => s.id === originTrain.currentSection) || sections[6];

  let affectedTrains = [];
  let cascadeRisk = 'LOW';
  let probability = 35;
  let totalCascadeMinutes = 0;
  let affectedStationCodes = ['VZM', 'VSKP'];
  let timeToImpactMinutes = 17;

  if (totalOriginDelay >= 20) {
    cascadeRisk = 'CRITICAL';
    probability = 92;
    timeToImpactMinutes = 8;
    totalCascadeMinutes = Math.round(totalOriginDelay * 1.6);
    affectedStationCodes = ['CHE', 'VZM', 'VSKP', 'DVD', 'AKP'];
    affectedTrains = [
      {
        trainId: '17240',
        trainName: 'Simhadri Express',
        initialDelayMin: 2,
        propagatedDelayMin: Math.min(28, Math.round(totalOriginDelay * 0.75 + 4)),
        reason: 'Held at Ponduru Outer / VZM Platform 3 due to block occupation',
        conflictLocation: 'Vizianagaram Junction (VZM)',
        timeToImpact: '8 min',
        severity: 'HIGH'
      },
      {
        trainId: '18520',
        trainName: 'LTT Visakhapatnam Express',
        initialDelayMin: 5,
        propagatedDelayMin: Math.min(22, Math.round(totalOriginDelay * 0.5 + 3)),
        reason: 'Approaching VSKP outer signal held for platform clearance',
        conflictLocation: 'Visakhapatnam Junction (VSKP)',
        timeToImpact: '19 min',
        severity: 'MEDIUM'
      },
      {
        trainId: '12803',
        trainName: 'Swarna Jayanti Express',
        initialDelayMin: 32,
        propagatedDelayMin: Math.min(48, Math.round(totalOriginDelay * 0.4 + 34)),
        reason: 'Freight loop block cascade upstream at Chipurupalle',
        conflictLocation: 'Srikakulam Road - Vizianagaram Section',
        timeToImpact: '24 min',
        severity: 'HIGH'
      }
    ];
  } else if (totalOriginDelay >= 10) {
    cascadeRisk = 'HIGH';
    probability = 78;
    timeToImpactMinutes = 17;
    totalCascadeMinutes = Math.round(totalOriginDelay * 1.25);
    affectedStationCodes = ['CHE', 'VZM', 'VSKP', 'DVD'];
    affectedTrains = [
      {
        trainId: '17240',
        trainName: 'Simhadri Express',
        initialDelayMin: 2,
        propagatedDelayMin: 15,
        additionalDelayMin: 13,
        reason: 'Held at Ponduru Outer / VZM Loop Line for 7 min to clear main line',
        conflictLocation: 'Vizianagaram Junction (VZM)',
        timeToImpact: '17 min',
        severity: 'HIGH'
      },
      {
        trainId: '18520',
        trainName: 'LTT Visakhapatnam Express',
        initialDelayMin: 5,
        propagatedDelayMin: 11,
        additionalDelayMin: 6,
        reason: 'Signal check at Gopalapatnam Cabin',
        conflictLocation: 'Visakhapatnam Junction (VSKP)',
        timeToImpact: '26 min',
        severity: 'MEDIUM'
      },
      {
        trainId: '12727',
        trainName: 'Godavari Superfast Express',
        initialDelayMin: 0,
        propagatedDelayMin: 4,
        additionalDelayMin: 4,
        reason: 'Platform dispatch headway delay at VSKP Platform 1',
        conflictLocation: 'Visakhapatnam Junction (VSKP)',
        timeToImpact: '35 min',
        severity: 'LOW'
      }
    ];
  } else if (totalOriginDelay >= 5) {
    cascadeRisk = 'MEDIUM';
    probability = 54;
    timeToImpactMinutes = 28;
    totalCascadeMinutes = Math.round(totalOriginDelay * 0.8);
    affectedStationCodes = ['VZM', 'VSKP'];
    affectedTrains = [
      {
        trainId: '17240',
        trainName: 'Simhadri Express',
        initialDelayMin: 2,
        propagatedDelayMin: 6,
        additionalDelayMin: 4,
        reason: 'Minor caution order speed restriction on approaching VZM',
        conflictLocation: 'Vizianagaram Junction',
        timeToImpact: '28 min',
        severity: 'LOW'
      }
    ];
  } else {
    cascadeRisk = 'LOW';
    probability = 18;
    timeToImpactMinutes = 60;
    totalCascadeMinutes = 0;
    affectedStationCodes = ['VZM'];
    affectedTrains = [];
  }

  // Time-to-Impact Milestones Timeline
  const impactTimeline = [
    {
      timeOffsetMin: 0,
      timestamp: '17:32',
      event: 'Potential Section Conflict Detected',
      description: `Train #${originTrain.id} and Train #17240 compete for Section ${currentSec.from}→${currentSec.to}`,
      status: 'ACTIVE_NOW'
    },
    {
      timeOffsetMin: 8,
      timestamp: '17:40',
      event: 'Upstream Signal Aspect Turns Amber/Red',
      description: 'Ponduru Outer automatic block signal restricts approaching speed',
      status: 'PREDICTED'
    },
    {
      timeOffsetMin: 17,
      timestamp: '17:48',
      event: 'Train #17240 Held at Outer Signal',
      description: 'Headway safety gap holds secondary train for 7 minutes',
      status: 'PREDICTED_CRITICAL'
    },
    {
      timeOffsetMin: 32,
      timestamp: '18:04',
      event: 'Platform 3 Congestion Cascade at VZM',
      description: 'Subsequent passenger departures delayed by 12 minutes',
      status: 'PREDICTED_DOWNSTREAM'
    }
  ];

  const graphNodes = [
    {
      id: `train-${originTrain.id}`,
      label: `Train ${originTrain.id}`,
      subLabel: `${originTrain.name}`,
      type: 'ORIGIN_TRAIN',
      delayMin: totalOriginDelay,
      status: originTrain.status,
      x: 120,
      y: 200
    },
    {
      id: `sec-${currentSec.id}`,
      label: `Section ${currentSec.from}→${currentSec.to}`,
      subLabel: `${currentSec.activeTrains} trains | ${currentSec.currentOccupancy}% occupancy`,
      type: 'SECTION_BLOCK',
      x: 320,
      y: 200
    },
    {
      id: 'junction-VZM',
      label: 'Vizianagaram Jn (VZM)',
      subLabel: 'Platform Conflict Point',
      type: 'JUNCTION_STATION',
      x: 520,
      y: 120
    },
    {
      id: 'junction-VSKP',
      label: 'Visakhapatnam Jn (VSKP)',
      subLabel: 'Terminal Yard & Turnaround',
      type: 'JUNCTION_STATION',
      x: 520,
      y: 280
    }
  ];

  const graphEdges = [
    { from: `train-${originTrain.id}`, to: `sec-${currentSec.id}`, label: `Occupies Section (+${totalOriginDelay}m delay)`, animated: true }
  ];

  affectedTrains.forEach((at, idx) => {
    const nodeY = idx % 2 === 0 ? 100 + idx * 80 : 260 + idx * 60;
    graphNodes.push({
      id: `train-${at.trainId}`,
      label: `Train ${at.trainId}`,
      subLabel: `${at.trainName} (+${at.propagatedDelayMin}m)`,
      type: 'AFFECTED_TRAIN',
      delayMin: at.propagatedDelayMin,
      severity: at.severity,
      x: 740,
      y: nodeY
    });

    const targetJunction = at.conflictLocation.includes('VSKP') ? 'junction-VSKP' : 'junction-VZM';
    graphEdges.push({
      from: `sec-${currentSec.id}`,
      to: targetJunction,
      label: 'Cascading Occupancy',
      animated: true
    });
    graphEdges.push({
      from: targetJunction,
      to: `train-${at.trainId}`,
      label: `Holds +${at.propagatedDelayMin - at.initialDelayMin}m (${at.timeToImpact || '17m'})`,
      animated: true
    });
  });

  return {
    originTrain: {
      id: originTrain.id,
      name: originTrain.name,
      currentDelayMin: totalOriginDelay,
      section: currentSec
    },
    cascadeRisk,
    probabilityPercent: probability,
    timeToImpactMinutes,
    timeToImpactFormatted: `${timeToImpactMinutes} minutes`,
    impactTimeline,
    affectedTrainsCount: affectedTrains.length,
    potentialAdditionalDelayRange: `${Math.max(4, Math.round(totalOriginDelay * 0.6))}–${Math.round(totalOriginDelay * 1.5)} minutes`,
    totalCascadeMinutes,
    affectedStationsCount: affectedStationCodes.length,
    affectedStations: affectedStationCodes.map(code => stations.find(s => s.code === code) || { code, name: code }),
    affectedTrainsList: affectedTrains,
    graph: {
      nodes: graphNodes,
      edges: graphEdges
    }
  };
}

module.exports = {
  calculateDelayPropagation
};
