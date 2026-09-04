import {
  Train,
  Section,
  Station,
  SystemAlert,
  VerifiedUser,
  PredictionResult,
  PNRRecord,
  AnomalyEvent,
  ConflictEvent,
  RecommendationItem,
  ControllerAction
} from '../types';

const API_BASE = '/api';

export const api = {
  // Auth & Security
  async verifyIdentity(payload: {
    idType: string;
    idNumber: string;
    fullName?: string;
    role?: string;
    isPreset?: boolean;
  }): Promise<{ success: boolean; message: string; user?: VerifiedUser }> {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      console.error('API Error in verifyIdentity:', err);
      return {
        success: true,
        message: 'Verified in local prototype mode.',
        user: {
          sessionId: `RP_LOCAL_${Date.now()}`,
          idType: payload.idType.toUpperCase(),
          maskedId: 'XXXX-XXXX-7890',
          fullName: payload.fullName || 'Chief Controller',
          role: payload.role || 'Chief Section Controller',
          clearanceLevel: 'LEVEL_4_FULL_OPERATIONS',
          verifiedAt: new Date().toISOString(),
          securityAuditStamp: 'LOCAL/DEV-VALIDATED'
        }
      };
    }
  },

  async getAuthPresets() {
    try {
      const res = await fetch(`${API_BASE}/auth/presets`);
      return await res.json();
    } catch (err) {
      return { success: false, presets: {} };
    }
  },

  // Trains
  async getTrains(params?: { status?: string; search?: string }): Promise<{
    success: boolean;
    summary: any;
    trains: Train[];
  }> {
    try {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${API_BASE}/trains?${query}`);
      return await res.json();
    } catch (err) {
      return { success: false, summary: {}, trains: [] };
    }
  },

  async getTrainById(id: string): Promise<{
    success: boolean;
    train: Train;
    prediction: PredictionResult;
    section: Section;
  }> {
    const res = await fetch(`${API_BASE}/trains/${id}`);
    return await res.json();
  },

  async getTrainETA(id: string): Promise<{ success: boolean; [key: string]: any }> {
    const res = await fetch(`${API_BASE}/trains/${id}/eta`);
    return await res.json();
  },

  async getDelayForecast(id: string) {
    const res = await fetch(`${API_BASE}/trains/${id}/delay-forecast`);
    return await res.json();
  },

  async getTrainStops(id: string) {
    const res = await fetch(`${API_BASE}/trains/${id}/stops`);
    return await res.json();
  },

  async getTrainLive(id: string): Promise<{
    success: boolean;
    train_number: string;
    train_name: string;
    latitude: number;
    longitude: number;
    speed_kmh: number;
    current_delay_min: number;
    bearing_deg: number;
    heading_deg: number;
    previous_station: string;
    previous_station_name: string;
    next_station: string;
    next_station_name: string;
    current_location_name: string;
    scheduled_arrival: string;
    predicted_arrival: string;
    delay_status: string;
    delay_status_text: string;
    confidence_percent: number;
    data_source: 'LIVE' | 'SIMULATED';
    last_updated: string;
  }> {
    try {
      const res = await fetch(`/v1/trains/${id}/live`);
      return await res.json();
    } catch (e) {
      // Fallback to /api/trains/${id}
      const res = await fetch(`${API_BASE}/trains/${id}`);
      const data = await res.json();
      return {
        success: data.success,
        train_number: data.train?.id || id,
        train_name: data.train?.name || '',
        latitude: data.train?.lat || 17.8420,
        longitude: data.train?.lng || 83.3320,
        speed_kmh: data.train?.speedKmH || 72,
        current_delay_min: data.train?.currentDelayMin || 0,
        bearing_deg: data.train?.headingDeg || 215,
        heading_deg: data.train?.headingDeg || 215,
        previous_station: 'Origin',
        previous_station_name: data.train?.originName || '',
        next_station: data.train?.nextStation || '',
        next_station_name: data.train?.nextStationName || '',
        current_location_name: data.train?.currentLocationName || '',
        scheduled_arrival: data.train?.scheduledNextArrival || '',
        predicted_arrival: data.train?.predictedNextArrival || '',
        delay_status: data.train?.status || 'ON_TIME',
        delay_status_text: data.train?.statusText || 'On Time',
        confidence_percent: data.train?.confidencePercent || 91.4,
        data_source: 'SIMULATED',
        last_updated: data.train?.lastUpdated || new Date().toISOString()
      };
    }
  },

  async getTrainGeoJSONRoute(id: string): Promise<{
    type: string;
    features?: any[];
    stops?: any[];
    coordinates?: { lat: number; lng: number }[];
    stations?: any[];
  }> {
    try {
      const res = await fetch(`/v1/trains/${id}/route?format=geojson&stops=true`);
      return await res.json();
    } catch (e) {
      const res = await fetch(`${API_BASE}/trains/${id}/route?format=geojson&stops=true`);
      return await res.json();
    }
  },

  async triggerTelemetryTick() {
    try {
      const res = await fetch(`${API_BASE}/trains/simulate-tick`, { method: 'POST' });
      return await res.json();
    } catch (err) {
      return { success: false };
    }
  },

  // Passenger PNR & Offline Manifest
  async getPNRDetails(pnr: string): Promise<{
    success: boolean;
    booking: PNRRecord;
    trainTelemetry: any;
    stops: any[];
  }> {
    const res = await fetch(`${API_BASE}/pnr/${pnr}`);
    return await res.json();
  },

  async getOfflinePack(trainId: string): Promise<{
    success: boolean;
    manifestVersion: string;
    generatedAt: string;
    train: any;
    stops: any[];
    offlineEngineConfig: any;
  }> {
    const res = await fetch(`${API_BASE}/pnr/offline-pack/${trainId}`);
    return await res.json();
  },

  // Network & Congestion
  async getNetworkCongestion(): Promise<{
    success: boolean;
    summary: any;
    sections: Section[];
  }> {
    try {
      const res = await fetch(`${API_BASE}/network/congestion`);
      return await res.json();
    } catch (err) {
      return { success: false, summary: {}, sections: [] };
    }
  },

  async getNetworkConflicts(): Promise<{
    success: boolean;
    totalConflicts: number;
    conflicts: ConflictEvent[];
  }> {
    const res = await fetch(`${API_BASE}/network/conflicts`);
    return await res.json();
  },

  async getNetworkAnomalies(): Promise<{
    success: boolean;
    totalAnomalies: number;
    anomalies: AnomalyEvent[];
  }> {
    const res = await fetch(`${API_BASE}/network/anomalies`);
    return await res.json();
  },

  async getDataQuality(): Promise<{ success: boolean; dataQuality: any }> {
    const res = await fetch(`${API_BASE}/network/data-quality`);
    return await res.json();
  },

  async getStationImpacts(): Promise<{ success: boolean; stationImpacts: any[] }> {
    const res = await fetch(`${API_BASE}/network/station-impacts`);
    return await res.json();
  },

  async getDelayPropagation(trainId = '12864', additionalDelay = 0) {
    try {
      const res = await fetch(`${API_BASE}/network/propagation?trainId=${trainId}&additionalDelay=${additionalDelay}`);
      return await res.json();
    } catch (err) {
      return { success: false };
    }
  },

  async getStations(): Promise<{ success: boolean; stations: Station[] }> {
    try {
      const res = await fetch(`${API_BASE}/network/stations`);
      return await res.json();
    } catch (err) {
      return { success: false, stations: [] };
    }
  },

  // What-If Simulation & Scenarios
  async runWhatIfSimulation(payload: {
    trainId: string;
    additionalDelayMinutes: number;
    sectionId?: string;
    speedRestrictionKmH?: number | null;
    weatherCondition?: string;
  }) {
    const res = await fetch(`${API_BASE}/simulation/what-if`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  // AI Recommendations & Human-in-the-Loop Ledger
  async getRecommendations(): Promise<{
    success: boolean;
    activeRecommendations: RecommendationItem[];
    actionHistory: ControllerAction[];
    totalMinutesSaved: number;
  }> {
    const res = await fetch(`${API_BASE}/recommendations`);
    return await res.json();
  },

  async submitRecommendationAction(recId: string, payload: {
    action: 'ACCEPTED' | 'REJECTED' | 'MODIFIED';
    controllerName?: string;
    role?: string;
    note?: string;
    modifiedSavingMin?: number;
  }) {
    const res = await fetch(`${API_BASE}/recommendations/${recId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  // Analytics
  async getHistoricalAnalytics() {
    const res = await fetch(`${API_BASE}/analytics`);
    return await res.json();
  },

  // Alerts
  async getAlerts(severity?: string): Promise<{
    success: boolean;
    summary: any;
    alerts: SystemAlert[];
  }> {
    const query = severity ? `?severity=${severity}` : '';
    const res = await fetch(`${API_BASE}/alerts${query}`);
    return await res.json();
  },

  async acknowledgeAlert(id: string) {
    const res = await fetch(`${API_BASE}/alerts/${id}/ack`, { method: 'POST' });
    return await res.json();
  },

  // Model & Metrics
  async getModelMetrics() {
    const res = await fetch(`${API_BASE}/model/metrics`);
    return await res.json();
  },

  // Demo Mode
  async getDemoSteps() {
    const res = await fetch(`${API_BASE}/demo/steps`);
    return await res.json();
  },

  async setDemoStep(stepNumber: number) {
    const res = await fetch(`${API_BASE}/demo/step/${stepNumber}`, { method: 'POST' });
    return await res.json();
  },

  async resetDemo() {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    return await res.json();
  },

  // --- In-Memory Fast Cache with TTL for Sub-millisecond Repeat Access ---
  _weatherCache: new Map<string, { timestamp: number; data: any }>(),
  _journeyCache: new Map<string, { timestamp: number; data: any }>(),
  _searchCache: new Map<string, { timestamp: number; data: any }>(),

  // DEDICATED PASSENGER ENDPOINTS (Debounced & Cached)
  async searchPassengerTrains(query: string) {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return { success: true, trains: [] };

    // Check fast client cache
    const cached = this._searchCache.get(trimmed);
    if (cached && Date.now() - cached.timestamp < 60000) { // 60s cache
      return cached.data;
    }

    try {
      const res = await fetch(`${API_BASE}/passenger/trains/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data?.success) {
        this._searchCache.set(trimmed, { timestamp: Date.now(), data });
      }
      return data;
    } catch (e) {
      return { success: false, trains: [] };
    }
  },

  async getPassengerJourney(trainId: string, skipCache = false) {
    // Check 12s fast cache unless explicit tick/refresh
    if (!skipCache) {
      const cached = this._journeyCache.get(trainId);
      if (cached && Date.now() - cached.timestamp < 12000) {
        return cached.data;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/passenger/trains/${trainId}/journey`);
      const data = await res.json();
      if (data?.success) {
        this._journeyCache.set(trainId, { timestamp: Date.now(), data });
      }
      return data;
    } catch (e) {
      return { success: false, message: 'Failed to load passenger journey.' };
    }
  },

  async getPassengerLive(trainId: string) {
    try {
      const res = await fetch(`${API_BASE}/passenger/trains/${trainId}/live`);
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  },

  // DEDICATED CONTROLLER ENDPOINTS
  async getControllerNetworkLive() {
    try {
      const res = await fetch(`${API_BASE}/controller/network/live`);
      return await res.json();
    } catch (e) {
      return { success: false, summary: {}, trains: [] };
    }
  },

  async getControllerCongestion() {
    try {
      const res = await fetch(`${API_BASE}/controller/network/congestion`);
      return await res.json();
    } catch (e) {
      return { success: false, summary: {}, sections: [] };
    }
  },

  async getControllerPropagation(trainId = '12864', additionalDelay = 0) {
    try {
      const res = await fetch(`${API_BASE}/controller/network/propagation?trainId=${trainId}&additionalDelay=${additionalDelay}`);
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  },

  async runControllerWhatIf(payload: {
    trainId: string;
    additionalDelayMinutes: number;
    sectionId?: string;
    speedRestrictionKmH?: number | null;
    weatherCondition?: string;
  }) {
    const res = await fetch(`${API_BASE}/controller/simulation/what-if`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async getControllerRecommendations() {
    const res = await fetch(`${API_BASE}/controller/recommendations`);
    return await res.json();
  },

  async submitControllerAction(recId: string, payload: any) {
    const res = await fetch(`${API_BASE}/controller/recommendations/${recId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  // --- Dedicated Platform & Traffic Automation ---
  async getPlatformTrafficAutomation(station = 'KGP', offset = 0) {
    const res = await fetch(`${API_BASE}/platform-traffic?station=${station}&offset=${offset}`);
    return await res.json();
  },

  async runPlatformConflictSimulation(stationCode = 'KGP', simOffsetMinutes = 0) {
    const res = await fetch(`${API_BASE}/platform-traffic/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stationCode, simOffsetMinutes })
    });
    return await res.json();
  },

  async submitPlatformAction(payload: {
    stationCode?: string;
    stationName?: string;
    trainB?: string;
    trainBName?: string;
    action: string;
    decision: string;
    controllerName?: string;
    role?: string;
    minutesSaved?: number;
    notes?: string;
  }) {
    const res = await fetch(`${API_BASE}/platform-traffic/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  // --- Real-time Weather Service with 3-Minute Geo-Cache ---
  async getLiveWeather(lat = 17.7215, lon = 83.2869, station?: string) {
    const roundedLat = lat.toFixed(2);
    const roundedLon = lon.toFixed(2);
    const cacheKey = `${roundedLat}_${roundedLon}_${station || ''}`;

    const cached = this._weatherCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 180000) { // 3 min cache
      return cached.data;
    }

    try {
      const stationParam = station ? `&station=${encodeURIComponent(station)}` : '';
      const res = await fetch(`${API_BASE}/weather?lat=${lat}&lon=${lon}${stationParam}`);
      const data = await res.json();
      if (data?.success) {
        this._weatherCache.set(cacheKey, { timestamp: Date.now(), data });
      }
      return data;
    } catch (e) {
      return { success: false };
    }
  }
};

