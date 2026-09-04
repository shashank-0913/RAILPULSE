export type TrainStatus = 'ON_TIME' | 'MINOR_DELAY' | 'MODERATE_DELAY' | 'CRITICAL_DELAY';

export interface Train {
  id: string;
  name: string;
  type: string;
  origin: string;
  destination: string;
  originName: string;
  destinationName: string;
  currentSection: string;
  currentLocationName: string;
  lat: number;
  lng: number;
  headingDeg: number;
  speedKmH: number;
  scheduledSpeedKmH: number;
  expectedSpeedKmH?: number;
  currentDelayMin: number;
  prevStationDelayMin: number;
  status: TrainStatus;
  statusText: string;
  statusColor: string;
  lastUpdated: string;
  nextStation: string;
  nextStationName: string;
  distanceToNextStationKm: number;
  distanceToDestinationKm: number;
  scheduledNextArrival: string;
  predictedNextArrival: string;
  predictionRange?: string;
  scheduledDestArrival: string;
  predictedDestArrival: string;
  predictedDestDelayMin: number;
  confidencePercent: number;
  dwellOverrunMin: number;
  weatherSeverity: string;
  passengersOnboard: number;
  rakeType: string;
  locoType: string;
}

export interface FeatureAttribution {
  feature: string;
  value: string;
  impactMin: string;
  impactDirection: 'DELAY_INCREASE' | 'DELAY_RECOVERY';
  description: string;
}

export interface StationImpact {
  stationCode: string;
  stationName: string;
  congestionRisk: string;
  platformPressurePercent: number;
  expectedDelayedArrivals: number;
  additionalDwellMin: number;
  connectingPassengerMissRiskPercent: number;
}

export interface PredictionResult {
  trainId: string;
  trainName: string;
  scheduledArrival: string;
  predictedArrival: string;
  predictionRange: string;
  scheduledDestArrival: string;
  predictedDestArrival: string;
  currentDelayMin: number;
  predictedNextDelayMin: number;
  predictedFinalDelayMin: number;
  delayDeltaMin: number;
  confidencePercent: number;
  uncertaintyWarning?: string | null;
  confidenceInterval: {
    lower: string;
    upper: string;
    marginMinutes: number;
  };
  featureAttributions: FeatureAttribution[];
  stationImpacts?: StationImpact[];
}

export interface Section {
  id: string;
  from: string;
  to: string;
  distanceKm: number;
  trackType: string;
  maxSpeed: number;
  currentOccupancy: number;
  activeTrains: number;
  congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  avgSpeedKmH: number;
  conflictRisk: number;
  trainSpacingKm?: number;
  futureCongestionProb?: number;
  trainsInBlock?: {
    id: string;
    name: string;
    speedKmH: number;
    delayMin: number;
    status: TrainStatus;
  }[];
  expectedDelayImpactRange?: string;
  headwayBufferStatus?: string;
}

export interface Station {
  code: string;
  name: string;
  zone: string;
  lat: number;
  lng: number;
  platforms: number;
  division: string;
  baseDwellMin?: number;
}

export interface AnomalyEvent {
  id: string;
  timestamp: string;
  type: string;
  trainId: string;
  trainName: string;
  location: string;
  sectionId: string;
  observedSpeedKmH?: number;
  expectedSpeedKmH?: number;
  allottedDwellMin?: number;
  actualDwellMin?: number;
  deviationPercent: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  impactDescription: string;
}

export interface ConflictEvent {
  id: string;
  timestamp: string;
  primaryTrainId: string;
  secondaryTrainId: string;
  sectionId: string;
  junctionCode: string;
  conflictProbabilityPercent: number;
  estimatedDelayImpactMin: string;
  timeToImpactMinutes: number;
  description: string;
}

export interface PNRRecord {
  pnr: string;
  trainId: string;
  trainName: string;
  class: string;
  coach: string;
  berthNumber: number;
  berthType: string;
  quota: string;
  bookingStatus: string;
  currentStatus: string;
  boardingStation: string;
  boardingStationName: string;
  destinationStation: string;
  destinationStationName: string;
  boardingDate: string;
  scheduledDeparture: string;
  passengerName: string;
  passengerAge: number;
  passengerGender: string;
}

export interface ScenarioOption {
  id: string;
  name: string;
  strategy: string;
  totalNetworkDelayMin: number;
  delaySavedMin: number;
  cascadeRisk: string;
  platformCongestionPercent: number;
  controllerFeasibility: string;
  isPreferred: boolean;
}

export interface RecommendationItem {
  id: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  estimatedSavingMin: number;
  affectedJunction: string;
  scenarioLinked: string;
  confidencePercent?: number;
  status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'MODIFIED';
}

export interface ControllerAction {
  id: string;
  timestamp: string;
  recommendationId?: string;
  recommendationTitle: string;
  controllerName: string;
  role: string;
  actionTaken: 'ACCEPTED' | 'REJECTED' | 'MODIFIED';
  delayMinutesSaved: number;
  note?: string;
  status: string;
}

export interface SystemAlert {
  id: string;
  timestamp: string;
  severity: 'RED' | 'ORANGE' | 'YELLOW' | 'BLUE' | 'PURPLE';
  type: string;
  title: string;
  message: string;
  trainId: string | null;
  affectedTrains: string[];
  sectionId: string | null;
  acknowledged: boolean;
  actionRecommended?: string;
}

export interface VerifiedUser {
  sessionId: string;
  idType: string;
  maskedId: string;
  fullName: string;
  role: string;
  clearanceLevel: string;
  verifiedAt: string;
  securityAuditStamp: string;
}

export interface PlatformInfo {
  platformNumber: string;
  status: 'OCCUPIED' | 'AVAILABLE' | 'EXPECTED OCCUPANCY' | 'BLOCKED';
  statusLabel: string;
  statusColor: string;
  currentTrain?: string | null;
  trainName: string;
  eta: string;
  clearanceTime: string;
  dwellMinutes: number;
  lengthMeters: number;
  compatibleCoaches: number;
  notes: string;
}

export interface PlatformConflict {
  conflictId: string;
  station: string;
  stationCode: string;
  platform: string;
  trainA: {
    number: string;
    name: string;
    eta: string;
    clearance: string;
  };
  trainB: {
    number: string;
    name: string;
    eta: string;
    requiredPlatform: string;
  };
  conflictWindow: string;
  overlapMinutes: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface PlatformOption {
  id: string;
  title: string;
  actionName: string;
  suggestedPlatform?: string;
  waitingTime?: string;
  waitingMinutes?: number;
  additionalTime?: string;
  additionalMinutes?: number;
  additionalRouteTime?: string;
  predictedNewEta: string;
  networkImpact: 'Low' | 'Medium' | 'High';
  networkImpactDesc: string;
  passengerImpact: 'Low' | 'Medium' | 'High';
  passengerImpactDesc: string;
  isRecommended: boolean;
  infrastructureSupported?: boolean;
  infrastructureNote?: string;
}

export interface AIPlatformRecommendation {
  recommendedAction: string;
  recommendedOptionId: string;
  platform: string;
  reasons: string[];
  expectedResult: {
    trainBDelay: string;
    trainBDelayNum: number;
    networkDelayImpact: string;
    passengerImpact: string;
  };
  confidenceScore?: number;
  confidenceType: string;
}

export interface WhatIfComparisonRow {
  metric: string;
  wait: string;
  platform2: string;
  reroute: string;
}

export interface WhatIfComparison {
  headers: string[];
  rows: WhatIfComparisonRow[];
}

export interface DelayPropagationNode {
  entity: string;
  impact: string;
  location: string;
  stage: string;
}

export interface DelayPropagationInfo {
  rootCause: string;
  chain: DelayPropagationNode[];
  affectedTrains: number;
  predictedAdditionalNetworkDelayMinutes: number;
}

export interface TimelineTrackItem {
  trainNumber: string;
  trainLabel: string;
  startTime: string;
  endTime: string;
  status: string;
  color: string;
  hasConflict?: boolean;
  isRecommendedSlot?: boolean;
}

export interface TimelinePlatform {
  platform: string;
  tracks: TimelineTrackItem[];
}

export interface SimulationStep {
  step: number;
  name: string;
  desc: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED';
  durationMs: number;
}

export interface PlatformActionRecord {
  decisionId: string;
  stationCode: string;
  stationName: string;
  trainB: string;
  trainBName: string;
  action: string;
  decision: string;
  controllerName: string;
  role: string;
  timestamp: string;
  status: string;
  minutesSaved: number;
  notes?: string;
}

export interface PlatformTrafficState {
  success: boolean;
  stationCode: string;
  stationName: string;
  currentTime: string;
  status: 'NETWORK NORMAL' | 'CONFLICT PREDICTED' | 'CRITICAL CONFLICT';
  statusColor: 'GREEN' | 'AMBER' | 'RED';
  approachingTrain: {
    number: string;
    name: string;
    currentEta: string;
    requiredPlatform: string;
    platformStatus: string;
    predictedConflictMinutes: number;
  };
  conflicts: PlatformConflict[];
  platforms: PlatformInfo[];
  options: PlatformOption[];
  aiRecommendation: AIPlatformRecommendation;
  whatIfComparison: WhatIfComparison;
  delayPropagation: DelayPropagationInfo;
  timeline: TimelinePlatform[];
  simulationPipeline: SimulationStep[];
  actionHistory: PlatformActionRecord[];
  disclaimer: string;
  lastCalculated: string;
}

