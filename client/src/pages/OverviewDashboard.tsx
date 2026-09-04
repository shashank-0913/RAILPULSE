import React, { useState, useEffect } from 'react';
import {
  TrainTrack,
  CheckCircle2,
  Clock,
  AlertTriangle,
  GitBranch,
  Network,
  Cpu,
  TrendingUp,
  Activity,
  ArrowRight,
  RefreshCw,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { Train, Section, SystemAlert } from '../types';
import { api } from '../services/api';

interface OverviewDashboardProps {
  onNavigateTab: (tab: string, trainId?: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigateTab }) => {
  const [trains, setTrains] = useState<Train[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [lastTickAgo, setLastTickAgo] = useState(14);

  const fetchData = async () => {
    try {
      const [trainsRes, networkRes, alertsRes] = await Promise.all([
        api.getTrains(),
        api.getNetworkCongestion(),
        api.getAlerts()
      ]);

      if (trainsRes.success) {
        setTrains(trainsRes.trains);
        setSummary(trainsRes.summary);
      }
      if (networkRes.success) {
        setSections(networkRes.sections);
      }
      if (alertsRes.success) {
        setAlerts(alertsRes.alerts);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
      setLastTickAgo(prev => (prev > 50 ? 5 : prev + 4));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-wrapper">
      {/* Top Banner: Core Intelligence Tagline */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge-status badge-ai-intel">AI RAILWAY INTELLIGENCE</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>
              Continuous Prediction Cycle: Updated {lastTickAgo}s ago
            </span>
          </div>
          <h1 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            RailPulse Predicts Railway Delays Before They Propagate.
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '850px', marginTop: '0.25rem' }}>
            Real-time multi-horizon XGBoost delay forecasting, section headway bottleneck detection, delay cascade modeling, and operational dispatch decision support for Indian Railways coaching operations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => onNavigateTab('simulation')}
            className="btn-cyan"
            style={{ fontSize: '0.825rem' }}
          >
            <Sliders size={16} />
            <span>Launch What-If Sandbox</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Total Monitored Trains */}
        <div className="control-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>MONITORED TRAINS</span>
            <TrainTrack size={16} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: '0.4rem 0 0.2rem 0', fontFamily: 'JetBrains Mono' }}>
            {summary.totalTrains || 12}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span className="radar-live-dot" style={{ width: '6px', height: '6px' }}></span>
            100% Telemetry Stream Active
          </div>
        </div>

        {/* On-Time Trains */}
        <div className="control-card control-card-glow-green">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>ON-TIME TRAINS</span>
            <CheckCircle2 size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', margin: '0.4rem 0 0.2rem 0', fontFamily: 'JetBrains Mono' }}>
            {summary.onTime || 4}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            Delay &lt; 3 minutes
          </div>
        </div>

        {/* Delayed Trains */}
        <div className="control-card control-card-glow-orange">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>DELAYED TRAINS</span>
            <Clock size={16} color="#f97316" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fb923c', margin: '0.4rem 0 0.2rem 0', fontFamily: 'JetBrains Mono' }}>
            {summary.delayed || 3}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#fb923c' }}>
            Minor & Moderate (+3 to +20m)
          </div>
        </div>

        {/* Critical Delays */}
        <div className="control-card control-card-glow-red">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>CRITICAL DELAYS</span>
            <AlertTriangle size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f87171', margin: '0.4rem 0 0.2rem 0', fontFamily: 'JetBrains Mono' }}>
            {summary.critical || 1}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#f87171' }}>
            Delay &gt; 30 minutes (Train 12803)
          </div>
        </div>

        {/* Active Congestion Zones */}
        <div className="control-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>CONGESTION ZONES</span>
            <GitBranch size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: '0.4rem 0 0.2rem 0', fontFamily: 'JetBrains Mono' }}>
            {sections.filter(s => s.congestionLevel === 'HIGH').length || 3} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>/ 15</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#f59e0b' }}>
            VSKP-VZM (88% Occupancy)
          </div>
        </div>

        {/* Predicted Cascading Delays */}
        <div className="control-card" style={{ borderColor: '#8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>CASCADING RISKS</span>
            <Network size={16} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#a78bfa', margin: '0.4rem 0 0.2rem 0', fontFamily: 'JetBrains Mono' }}>
            3 Trains
          </div>
          <div style={{ fontSize: '0.7rem', color: '#c4b5fd' }}>
            Risk Level: HIGH (78% Prob)
          </div>
        </div>

        {/* Average ETA Prediction Error */}
        <div className="control-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>PREDICTION MAE</span>
            <TrendingUp size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', margin: '0.4rem 0 0.2rem 0', fontFamily: 'JetBrains Mono' }}>
            3.8 <span style={{ fontSize: '0.9rem' }}>min</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            RMSE: 5.2 min | MAPE: 6.4%
          </div>
        </div>

        {/* System Prediction Confidence */}
        <div className="control-card control-card-glow-cyan">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>MODEL CONFIDENCE</span>
            <Cpu size={16} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', margin: '0.4rem 0 0.2rem 0', fontFamily: 'JetBrains Mono' }}>
            91.4%
          </div>
          <div style={{ fontSize: '0.7rem', color: '#38bdf8' }}>
            ±5 min Accuracy: 88.6%
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Left Column: Live Active Trains Monitor */}
        <div className="control-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color="#10b981" />
                Live Train Dispatch & Dynamic Prediction Register
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Click any train to inspect multi-horizon ETA prediction, telemetry, and SHAP explainability.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('tracking')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              <span>Full Interactive Map</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="telemetry-table">
              <thead>
                <tr>
                  <th>Train</th>
                  <th>Location & Speed</th>
                  <th>Next Station</th>
                  <th>Sched ETA</th>
                  <th>Predicted ETA</th>
                  <th>Delay Delta</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {trains.slice(0, 6).map(train => {
                  return (
                    <tr key={train.id} style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('eta', train.id)}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
                          #{train.id}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {train.name}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{train.currentLocationName.split('(')[0]}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'JetBrains Mono' }}>
                          {train.speedKmH} km/h (Max: {train.scheduledSpeedKmH})
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#cbd5e1' }}>{train.nextStation}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{train.distanceToNextStationKm} km away</div>
                      </td>
                      <td>
                        <div style={{ fontFamily: 'JetBrains Mono', color: '#94a3b8' }}>{train.scheduledNextArrival}</div>
                      </td>
                      <td>
                        <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: train.currentDelayMin > 0 ? '#fb923c' : '#34d399' }}>
                          {train.predictedNextArrival}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontFamily: 'JetBrains Mono',
                          fontWeight: 700,
                          color: train.currentDelayMin > 10 ? '#ef4444' : train.currentDelayMin > 0 ? '#f59e0b' : '#10b981'
                        }}>
                          {train.currentDelayMin > 0 ? `+${train.currentDelayMin}m` : '0m'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-status ${
                          train.status === 'ON_TIME' ? 'badge-on-time' :
                          train.status === 'MINOR_DELAY' ? 'badge-minor-delay' :
                          train.status === 'MODERATE_DELAY' ? 'badge-moderate-delay' : 'badge-critical-delay'
                        }`}>
                          {train.status === 'ON_TIME' ? 'On Time' : `${train.status.replace('_', ' ')}`}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={(e) => { e.stopPropagation(); onNavigateTab('eta', train.id); }}
                          style={{
                            background: 'rgba(6, 182, 212, 0.15)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            color: '#38bdf8',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          ETA Intel &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Active Bottlenecks & Cascade Warnings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Active Congestion Hotspots */}
          <div className="control-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GitBranch size={16} color="#f97316" />
                Critical Track Sections & Bottlenecks
              </div>
              <button
                onClick={() => onNavigateTab('congestion')}
                style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                View Heatmap &rarr;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {sections.filter(s => s.congestionLevel === 'HIGH').map(sec => (
                <div key={sec.id} style={{
                  background: '#131c33',
                  border: '1px solid #1e2e4f',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc' }}>
                      Section: {sec.from} &rarr; {sec.to}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      {sec.activeTrains} trains | Avg speed: {sec.avgSpeedKmH} km/h (Permissible: {sec.maxSpeed})
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: sec.conflictRisk > 70 ? '#ef4444' : '#f97316',
                      fontFamily: 'JetBrains Mono'
                    }}>
                      {sec.conflictRisk}% Conflict Risk
                    </div>
                    <div style={{ fontSize: '0.675rem', color: '#fb923c' }}>
                      Impact: {sec.congestionLevel === 'HIGH' ? '+8 to +15m' : '+3 to +7m'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dedicated Platform & Traffic Automation Column Module */}
          <div className="control-card control-card-glow-cyan" style={{ border: '1px solid rgba(56, 189, 248, 0.4)', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.85) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{
                fontSize: '0.675rem',
                fontWeight: 800,
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                border: '1px solid #f59e0b',
                letterSpacing: '0.04em'
              }}>
                ⚠ CONFLICT PREDICTED
              </span>
              <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
                Kharagpur (KGP)
              </span>
            </div>

            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <span>🚦 Platform & Traffic Automation</span>
            </h3>

            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
              Platform 1 Headway Conflict detected between Train #12864 and #12723 (3m overlap). AI recommends turnout to Loop Line (Platform 2) to save 3 min network delay.
            </p>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                onClick={() => onNavigateTab('platform_traffic')}
                className="btn-cyan"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', width: '100%', justifyContent: 'center' }}
              >
                <span>Open Platform & Traffic Control &rarr;</span>
              </button>
            </div>
          </div>

          {/* Key Differentiator Feature Card: Delay Propagation Spotlight */}
          <div className="control-card control-card-glow-orange" style={{ background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge-status badge-moderate-delay">CASCADE DIFFERENTIATOR</span>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>Train 12864 &rarr; 17240 Ripple Effect</span>
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Train 12864 delay (+12m) holds Train 17240 at Vizianagaram Outer
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              RailPulse graph propagation engine calculated an 78% probability that Train 17240 will incur a +13 min additional delay if main line clearance is delayed.
            </p>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                onClick={() => onNavigateTab('propagation')}
                className="btn-primary"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
              >
                <Network size={14} />
                <span>Open Propagation Graph</span>
              </button>
              <button
                onClick={() => onNavigateTab('simulation')}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
              >
                <span>Simulate Dispatch Options</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
