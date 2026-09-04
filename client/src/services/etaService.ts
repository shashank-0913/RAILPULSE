import { api } from './api';

export const etaService = {
  async getTrainETA(trainNumber: string, stationId?: string) {
    try {
      const q = stationId ? `?station_id=${stationId}` : '';
      const res = await fetch(`/api/trains/${trainNumber}/eta${q}`);
      return await res.json();
    } catch (err) {
      console.warn('ETA fetch error, falling back', err);
      return null;
    }
  },

  async getPropagationAnalysis(trainNumber: string) {
    try {
      const res = await fetch(`/api/trains/${trainNumber}/propagation`);
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getCongestionAnalytics() {
    try {
      const res = await fetch('/api/analytics/congestion');
      return await res.json();
    } catch (err) {
      return null;
    }
  }
};
