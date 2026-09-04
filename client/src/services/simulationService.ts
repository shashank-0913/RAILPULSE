export const simulationService = {
  async getStatus() {
    try {
      const res = await fetch('/api/simulation/status');
      return await res.json();
    } catch (err) {
      return { is_running: false, is_simulation_mode: true };
    }
  },

  async startSimulation(scenarioName = 'Disruption Cascade Evaluation') {
    const res = await fetch('/api/simulation/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_name: scenarioName })
    });
    return await res.json();
  },

  async stopSimulation() {
    const res = await fetch('/api/simulation/stop', { method: 'POST' });
    return await res.json();
  },

  async resetSimulation() {
    const res = await fetch('/api/simulation/reset', { method: 'POST' });
    return await res.json();
  },

  async runWhatIf(trainNumber: string, additionalDelayMinutes: number, customSpeed?: number) {
    const res = await fetch('/api/what-if', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        train_number: trainNumber,
        additional_delay_minutes: additionalDelayMinutes,
        custom_speed_kmh: customSpeed
      })
    });
    return await res.json();
  }
};
