import { api } from './api';
import { Train, Station, Section } from '../types';

export const trainService = {
  async getAllTrains(search?: string, status?: string): Promise<Train[]> {
    const res = await api.getTrains({ search, status });
    return res.trains || [];
  },

  async getTrainLiveStatus(trainNumber: string) {
    try {
      const res = await fetch(`/api/trains/${trainNumber}/live`);
      return await res.json();
    } catch (err) {
      console.warn('Live API fallback for train', trainNumber);
      return null;
    }
  },

  async getTrainRoute(trainNumber: string) {
    try {
      const res = await fetch(`/api/trains/${trainNumber}/route`);
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async trackTrain(trainNumber: string, channels: string[] = ['IN_APP']) {
    try {
      const res = await fetch('/api/trains/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ train_number: trainNumber, notification_channels: channels })
      });
      return await res.json();
    } catch (err) {
      return { status: 'TRACKING_LOCAL' };
    }
  }
};
