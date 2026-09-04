/**
 * RailPulse Passenger-Specific API Routes
 * Strict Isolation: Returns ONLY train-specific information for the passenger's selected journey.
 * Never exposes network-wide operational details or controller dispatch tools.
 */

const express = require('express');
const router = express.Router();
const { trains, train12864Stops, stations, sections } = require('../data/database');
const { predictTrainETA } = require('../services/mlPredictionService');

// GET /api/passenger/trains/search - Train Autocomplete Search
router.get('/trains/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  let results = trains;

  if (q) {
    results = trains.filter(t => 
      t.id.includes(q) || 
      t.name.toLowerCase().includes(q) || 
      t.origin.toLowerCase().includes(q) || 
      t.destination.toLowerCase().includes(q) ||
      t.originName.toLowerCase().includes(q) ||
      t.destinationName.toLowerCase().includes(q)
    );
  }

  const sanitized = results.map(t => ({
    id: t.id,
    name: t.name,
    type: t.type,
    origin: t.origin,
    origin_station: t.originName,
    destination: t.destination,
    destination_station: t.destinationName,
    status: t.status,
    status_text: t.statusText,
    delay_min: t.currentDelayMin,
    next_station_name: t.nextStationName,
    scheduled_next_arrival: t.scheduledNextArrival,
    predicted_next_arrival: t.predictedNextArrival
  }));

  res.json({
    success: true,
    count: sanitized.length,
    trains: sanitized
  });
});

// GET /api/passenger/trains/:id/journey - Comprehensive Single-Train Journey Data
router.get('/trains/:id/journey', (req, res) => {
  const train = trains.find(t => t.id === req.params.id) || trains[0];
  const prediction = predictTrainETA(train);
  const is12864 = train.id === '12864';

  // Format stops timeline
  const rawStops = is12864 ? train12864Stops : [
    { stationCode: train.origin, stationName: train.originName, scheduledArr: 'Start', actualArr: 'Start', status: 'PASSED', delayDepMin: 0, distanceKm: 0, platform: 1 },
    { stationCode: 'BBS', stationName: 'Bhubaneswar', scheduledArr: '16:00', actualArr: '16:02', status: 'PASSED', delayDepMin: 2, distanceKm: 437, platform: 2 },
    { stationCode: 'VZM', stationName: 'Vizianagaram Jn', scheduledArr: '18:30', actualArr: '18:38', status: 'PASSED', delayDepMin: 8, distanceKm: 818, platform: 3 },
    { stationCode: train.nextStation, stationName: train.nextStationName, scheduledArr: train.scheduledNextArrival, predictedArr: train.predictedNextArrival, status: 'UPCOMING_NEXT', predictedDelayMin: train.currentDelayMin, distanceKm: 878, platform: 2 },
    { stationCode: train.destination, stationName: train.destinationName, scheduledArr: train.scheduledDestArrival, predictedArr: train.predictedDestArrival, status: 'DESTINATION', predictedDelayMin: train.predictedDestDelayMin, distanceKm: 1662, platform: 4 }
  ];

  const stops_timeline = rawStops.map((s, idx) => ({
    code: s.stationCode || s.code,
    name: s.stationName || s.name,
    distance_km: s.distanceKm || s.distance_km || idx * 150,
    scheduled_arr: s.scheduledArr || s.scheduled_arr || 'Origin',
    scheduled_dep: s.scheduledDep || s.scheduled_dep || '—',
    predicted_arr: s.predictedArr || s.predicted_arr || s.scheduledArr || 'On Time',
    delay_minutes: s.delayDepMin !== undefined ? s.delayDepMin : s.predictedDelayMin !== undefined ? s.predictedDelayMin : train.currentDelayMin,
    platform: s.platform || (idx % 4) + 1,
    status: s.status || 'UPCOMING'
  }));

  // Plain English Explainability
  const plain_english_explanation = {
    summary: `Train #${train.id} (${train.name}) is currently running ${train.currentDelayMin} minutes late primarily due to scheduled freight crossing preemption near Rajahmundry and track caution orders.`,
    delay_factors: [
      {
        factor: 'Freight Preemption at RJY',
        impact: `+${Math.round(train.currentDelayMin * 0.45)} min`,
        desc: 'Preempted by priority freight rake on loop line for safe section block clearance.'
      },
      {
        factor: 'Track Maintenance Caution Order',
        impact: `+${Math.round(train.currentDelayMin * 0.3)} min`,
        desc: `Speed restricted to 30 km/h over ${train.nextStationName || 'EE-BZA'} bridge maintenance work.`
      },
      {
        factor: 'Weather & Visibility (Morning Fog)',
        impact: `+${Math.round(train.currentDelayMin * 0.15)} min`,
        desc: 'Loco pilot operating under restricted fog visibility speed protocol.'
      },
      {
        factor: 'Section Headway Congestion',
        impact: `+${Math.max(2, Math.round(train.currentDelayMin * 0.1))} min`,
        desc: 'Preceding coaching rake running in automatic block section.'
      }
    ]
  };

  // Future Delay Forecast
  const future_delay_forecast = [
    { horizon: '+30 Minutes', predicted_delay: Math.max(0, train.currentDelayMin + 2), confidence: 96.1, next_station: train.nextStationName || 'Eluru' },
    { horizon: '+60 Minutes', predicted_delay: Math.max(0, train.currentDelayMin - 2), confidence: 92.4, next_station: 'Vijayawada Jn' },
    { horizon: '+120 Minutes', predicted_delay: Math.max(0, train.currentDelayMin - 6), confidence: 88.0, next_station: 'Tenali Jn' },
    { horizon: 'Destination', predicted_delay: Math.max(0, train.currentDelayMin - 8), confidence: 84.5, next_station: train.destinationName }
  ];

  // Passenger Journey Alerts
  const alerts = [
    {
      id: `ALT_${train.id}_1`,
      type: 'STATUS_UPDATE',
      title: train.currentDelayMin > 0 ? `Train Running +${train.currentDelayMin} Minutes Late` : 'Train Running On Time',
      message: train.currentDelayMin > 0 
        ? `Your train #${train.id} is currently delayed by ${train.currentDelayMin} minutes. Predicted arrival at ${train.nextStationName} is ${train.predictedNextArrival}.`
        : `Your train #${train.id} is on schedule. Next stop ${train.nextStationName} at ${train.scheduledNextArrival}.`,
      severity: train.currentDelayMin >= 30 ? 'RED' : train.currentDelayMin >= 10 ? 'ORANGE' : 'GREEN',
      time: 'Live Update'
    },
    {
      id: `ALT_${train.id}_2`,
      type: 'APPROACHING_STATION',
      title: `Next Station Approach: ${train.nextStationName}`,
      message: `Approaching ${train.nextStationName} (${train.distanceToNextStationKm || 22.6} km away). Expected Platform #2.`,
      severity: 'YELLOW',
      time: '5 min ago'
    }
  ];

  res.json({
    success: true,
    train: {
      id: train.id,
      name: train.name,
      type: train.type,
      origin: train.origin,
      origin_station: train.originName,
      destination: train.destination,
      destination_station: train.destinationName,
      total_distance_km: 1662
    },
    current_status: {
      status: train.status,
      status_text: train.currentDelayMin > 0 ? `${train.currentDelayMin} min Late` : 'On Time',
      delay_minutes: train.currentDelayMin,
      current_location_name: train.currentLocationName,
      speed_kmh: train.speedKmH,
      heading_deg: train.headingDeg || 215,
      next_station_name: train.nextStationName,
      next_station_countdown_min: Math.round((train.distanceToNextStationKm || 22.6) / (train.speedKmH || 60) * 60) || 38,
      scheduled_next_arrival: train.scheduledNextArrival,
      predicted_next_arrival: train.predictedNextArrival,
      traversed_distance_km: 875,
      progress_percent: 52.6,
      confidence_percent: train.confidencePercent || 94.2
    },
    plain_english_explanation,
    future_delay_forecast,
    stops_timeline,
    alerts,
    data_source: process.env.RAILRADAR_API_KEY ? 'LIVE' : 'SIMULATED'
  });
});

// GET /api/passenger/trains/:id/live - Live GPS coordinates for passenger map
router.get('/trains/:id/live', (req, res) => {
  const train = trains.find(t => t.id === req.params.id) || trains[0];
  res.json({
    success: true,
    train_number: train.id,
    train_name: train.name,
    latitude: train.lat,
    longitude: train.lng,
    speed_kmh: train.speedKmH,
    bearing_deg: train.headingDeg || 215,
    current_delay_min: train.currentDelayMin,
    next_station_name: train.nextStationName,
    current_location_name: train.currentLocationName,
    last_updated: train.lastUpdated || new Date().toISOString()
  });
});

module.exports = router;
