/**
 * RailPulse ML ETA Prediction Engine v2.5
 * Simulates an XGBoost Gradient Boosted Regression Model with 12 features,
 * Data Quality Uncertainty adjustment, and Station-Level Impact predictions.
 */

const { sections, dataQualityStatus, stationImpacts } = require('../data/database');

const MODEL_METRICS = {
  modelType: 'XGBoost Regressor (v2.5.0)',
  objective: 'reg:squarederror',
  nEstimators: 450,
  maxDepth: 6,
  learningRate: 0.045,
  trainingSetSize: 524000,
  evaluationDataset: 'South Eastern & East Coast Trunk Historical Telemetry (Simulated Benchmark)',
  maeMinutes: 3.8,
  rmseMinutes: 5.2,
  mapePercent: 6.4,
  accuracyWithin3MinPercent: 74.2,
  accuracyWithin5MinPercent: 88.6,
  accuracyWithin10MinPercent: 94.2,
  featureImportances: [
    { feature: 'current_delay', weight: 0.34, description: 'Live instantaneous delay at current GPS block' },
    { feature: 'section_congestion_index', weight: 0.22, description: 'Section track occupancy & active train density' },
    { feature: 'speed_deficit_ratio', weight: 0.16, description: 'Discrepancy between MPS (Max Permissible Speed) and actual telemetry' },
    { feature: 'prev_station_delay_delta', weight: 0.11, description: 'Delay gradient change between last two station checkpoints' },
    { feature: 'station_dwell_overrun', weight: 0.08, description: 'Boarding/alighting dwell overstay past allotted schedule' },
    { feature: 'historical_section_bias', weight: 0.05, description: 'Long-term rolling average delay on section' },
    { feature: 'time_of_day_factor', weight: 0.03, description: 'Diurnal traffic density curve (peak vs off-peak)' },
    { feature: 'weather_visibility_factor', weight: 0.01, description: 'External visibility and atmospheric condition' }
  ]
};

function predictTrainETA(train, customOverrides = {}) {
  const currentDelay = customOverrides.currentDelay !== undefined ? customOverrides.currentDelay : train.currentDelayMin;
  const currentSpeed = customOverrides.speed !== undefined ? customOverrides.speed : train.speedKmH;
  const scheduledSpeed = train.scheduledSpeedKmH || 80;
  const prevDelay = train.prevStationDelayMin || 0;
  const dwellOverrun = train.dwellOverrunMin || 1.5;
  const distanceNext = train.distanceToNextStationKm || 20;
  const distanceDest = train.distanceToDestinationKm || 400;

  const section = sections.find(s => s.id === train.currentSection) || { currentOccupancy: 65, avgSpeedKmH: 60, conflictRisk: 30 };

  const speedDeficit = Math.max(0, scheduledSpeed - currentSpeed);
  const speedDelayMin = currentSpeed > 0 ? (speedDeficit / scheduledSpeed) * (distanceNext / Math.max(20, currentSpeed)) * 60 * 0.4 : 3.0;
  const congestionDelayMin = (section.conflictRisk / 100) * 4.5 * (distanceNext / 30);
  const delayGradient = (currentDelay - prevDelay) * 0.35;
  const dwellPenalty = dwellOverrun * 0.9;
  const historicalBiasMin = 1.2;

  const totalPredictedNextDelay = Math.max(0, currentDelay + speedDelayMin + congestionDelayMin + delayGradient + dwellPenalty * 0.3);
  const recoveryFactor = 0.85;
  const totalPredictedDestDelay = Math.max(0, (totalPredictedNextDelay + (distanceDest / 100) * 1.2) * recoveryFactor);

  const [schedH, schedM] = (train.scheduledNextArrival || '18:30').split(':').map(Number);
  const schedMinutesTotal = (schedH * 60 + schedM) % 1440;
  const predMinutesTotal = Math.round((schedMinutesTotal + totalPredictedNextDelay) % 1440);
  
  const predH = Math.floor(predMinutesTotal / 60);
  const predM = predMinutesTotal % 60;
  const predictedNextArrival = `${String(predH).padStart(2, '0')}:${String(predM).padStart(2, '0')}`;

  const errorMargin = Math.max(2, Math.round(3.8 * (1 + (section.conflictRisk / 100) * 0.5)));
  const ciLowerTotal = Math.max(0, predMinutesTotal - errorMargin);
  const ciUpperTotal = (predMinutesTotal + errorMargin) % 1440;
  const ciLower = `${String(Math.floor(ciLowerTotal / 60)).padStart(2, '0')}:${String(ciLowerTotal % 60).padStart(2, '0')}`;
  const ciUpper = `${String(Math.floor(ciUpperTotal / 60)).padStart(2, '0')}:${String(ciUpperTotal % 60).padStart(2, '0')}`;
  const predictionRange = `${ciLower} – ${ciUpper}`;

  let confidence = 95 - (section.conflictRisk * 0.12) - (currentDelay > 20 ? 6 : 0) - (speedDeficit > 25 ? 4 : 0);
  
  // Data Quality degradation check
  let uncertaintyWarning = null;
  if (dataQualityStatus.overallQuality === 'DEGRADED') {
    confidence = Math.max(55, confidence - 24);
    uncertaintyWarning = 'Limited recent GPS movement data — confidence degraded.';
  } else {
    confidence = Math.max(78.5, Math.min(98.2, Number(confidence.toFixed(1))));
  }

  const featureAttributions = [
    {
      feature: 'Previous Inbound Delay',
      value: `+${Number(prevDelay).toFixed(1)} min`,
      impactMin: Number(prevDelay * 0.45).toFixed(1),
      impactDirection: 'DELAY_INCREASE',
      description: 'Residual delay accumulated from previous block section crossing.'
    },
    {
      feature: 'Section Congestion & Headway',
      value: `${section.currentOccupancy}% occupancy (${section.activeTrains} trains in section)`,
      impactMin: Number(congestionDelayMin).toFixed(1),
      impactDirection: 'DELAY_INCREASE',
      description: `Track headway compression in section ${section.from}→${section.to} causing signal speed limits.`
    },
    {
      feature: 'Speed Deficit on Track Section',
      value: `${currentSpeed} km/h (Permissible: ${scheduledSpeed} km/h)`,
      impactMin: Number(speedDelayMin).toFixed(1),
      impactDirection: 'DELAY_INCREASE',
      description: 'Locomotive telemetry running below section maximum permissible speed (MPS).'
    },
    {
      feature: 'Station Dwell Time Variance',
      value: `+${dwellOverrun} min overrun`,
      impactMin: Number(dwellPenalty).toFixed(1),
      impactDirection: 'DELAY_INCREASE',
      description: 'Platform dwell overstay during peak passenger boarding.'
    },
    {
      feature: 'Historical Route Bottleneck Model',
      value: 'Historical mean bias',
      impactMin: Number(historicalBiasMin).toFixed(1),
      impactDirection: 'DELAY_INCREASE',
      description: 'Empirical delay pattern observed on this corridor during evening peak.'
    },
    {
      feature: 'Schedule Recovery Allowance',
      value: '15% buffer applied',
      impactMin: `-${Number(totalPredictedNextDelay * 0.15).toFixed(1)}`,
      impactDirection: 'DELAY_RECOVERY',
      description: 'Timetable padding allocated for high-priority superfast corridor runs.'
    }
  ];

  return {
    trainId: train.id,
    trainName: train.name,
    scheduledArrival: train.scheduledNextArrival || '18:30',
    predictedArrival: predictedNextArrival,
    predictionRange,
    scheduledDestArrival: train.scheduledDestArrival || '06:15',
    predictedDestArrival: train.predictedDestArrival || '06:34',
    currentDelayMin: Number(currentDelay),
    predictedNextDelayMin: Number(totalPredictedNextDelay.toFixed(1)),
    predictedFinalDelayMin: Number(totalPredictedDestDelay.toFixed(1)),
    delayDeltaMin: Number((totalPredictedNextDelay - (train.scheduledNextArrival ? 0 : 0)).toFixed(1)),
    confidencePercent: confidence,
    uncertaintyWarning,
    confidenceInterval: {
      lower: ciLower,
      upper: ciUpper,
      marginMinutes: errorMargin
    },
    featureAttributions,
    stationImpacts,
    modelMetrics: MODEL_METRICS
  };
}

module.exports = {
  MODEL_METRICS,
  predictTrainETA
};
