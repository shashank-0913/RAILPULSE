/**
 * RailPulse Passenger PNR & In-Train Offline Mode API Routes
 */

const express = require('express');
const router = express.Router();
const { pnrRegistry, trains, train12864Stops } = require('../data/database');
const { predictTrainETA } = require('../services/mlPredictionService');

// GET /api/pnr/:pnr - Retrieve passenger booking & live train telemetry
router.get('/:pnr', (req, res) => {
  const pnrQuery = req.params.pnr.replace(/[\s-]/g, '');
  
  // Look up PNR or fallback to closest match
  let booking = pnrRegistry.find(p => p.pnr.replace(/[\s-]/g, '') === pnrQuery);

  if (!booking) {
    // If not found in seed, create synthetic confirmed PNR for any 10-digit number entered by user
    booking = {
      pnr: req.params.pnr,
      trainId: '12864',
      trainName: 'Howrah - SMVB Superfast Express',
      class: '3A (AC 3 Tier)',
      coach: 'B3',
      berthNumber: 36,
      berthType: 'Lower Berth',
      quota: 'General (GN)',
      bookingStatus: 'CNF (Confirmed)',
      currentStatus: 'CNF / B3 / 36',
      boardingStation: 'VSKP',
      boardingStationName: 'Visakhapatnam Jn',
      destinationStation: 'MAS',
      destinationStationName: 'MGR Chennai Central',
      boardingDate: 'Today',
      scheduledDeparture: '20:00',
      passengerName: 'Passenger',
      passengerAge: 32,
      passengerGender: 'M'
    };
  }

  const assignedTrain = trains.find(t => t.id === booking.trainId) || trains[0];
  const prediction = predictTrainETA(assignedTrain);

  res.json({
    success: true,
    booking,
    trainTelemetry: {
      id: assignedTrain.id,
      name: assignedTrain.name,
      currentLocation: assignedTrain.currentLocationName,
      speedKmH: assignedTrain.speedKmH,
      currentDelayMin: assignedTrain.currentDelayMin,
      status: assignedTrain.status,
      statusText: assignedTrain.statusText,
      nextStation: assignedTrain.nextStation,
      nextStationName: assignedTrain.nextStationName,
      scheduledNextArrival: assignedTrain.scheduledNextArrival,
      predictedNextArrival: prediction.predictedArrival,
      predictionRange: prediction.predictionRange,
      scheduledDestArrival: assignedTrain.scheduledDestArrival,
      predictedDestArrival: assignedTrain.predictedDestArrival,
      confidencePercent: prediction.confidencePercent,
      delayReason: assignedTrain.currentDelayMin > 0 ? 'Congestion and headway speed limits in upcoming section' : 'Running on scheduled timetable'
    },
    stops: train12864Stops
  });
});

// GET /api/pnr/offline-pack/:trainId - Download entire manifest for in-train offline operation
router.get('/offline-pack/:trainId', (req, res) => {
  const train = trains.find(t => t.id === req.params.trainId) || trains[0];
  const stops = train.id === '12864' ? train12864Stops : train12864Stops;

  res.json({
    success: true,
    manifestVersion: '2.5.0',
    generatedAt: new Date().toISOString(),
    train: {
      id: train.id,
      name: train.name,
      origin: train.origin,
      destination: train.destination,
      scheduledSpeedKmH: train.scheduledSpeedKmH
    },
    stops,
    offlineEngineConfig: {
      deadReckoningIntervalSec: 5,
      assumedCruisingSpeedKmH: train.scheduledSpeedKmH,
      localPersistenceKey: `railpulse_offline_manifest_${train.id}`
    }
  });
});

module.exports = router;
