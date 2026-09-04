import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Filter,
  ShieldAlert,
  Clock,
  Radio,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { SystemAlert } from '../types';
import { api } from '../services/api';

interface AlertsCenterProps {
  onNavigateTab: (tab: string, trainId?: string) => void;
}

export const AlertsCenter: React.FC<AlertsCenterProps> = ({ onNavigateTab }) => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const loadAlerts = async (sev?: string) => {
    const res = await api.getAlerts(sev === 'ALL' ? undefined : sev);
    if (res.success) {
      setAlerts(res.alerts);
      setSummary(res.summary);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAlerts(selectedSeverity);
  }, [selectedSeverity]);

  const handleAcknowledge = async (id: string) => {
    await api.acknowledgeAlert(id);
    loadAlerts(selectedSeverity);
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge-status badge-critical-delay">REAL-TIME TELEMETRY</span>
          </div>
          <h1 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={22} color="#ef4444" />
            Intelligent Operational Alerts & Incident Dispatch Center
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Multi-tier algorithmic alerts categorizing critical cascading threats, track bottlenecks, and dynamic ETA shifts.
          </p>
        </div>

        {/* Severity Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['ALL', 'RED', 'ORANGE', 'YELLOW', 'BLUE'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: selectedSeverity === sev ? '1px solid #38bdf8' : '1px solid #1e2e4f',
                background: selectedSeverity === sev ? 'rgba(56, 189, 248, 0.15)' : '#10192e',
                color: selectedSeverity === sev ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              {sev === 'ALL' ? 'All Alerts' :
               sev === 'RED' ? '🔴 Critical' :
               sev === 'ORANGE' ? '🟠 High Congestion' :
               sev === 'YELLOW' ? '🟡 ETA Shift' : '🔵 Info Telemetry'}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Severity KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="control-card control-card-glow-red">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171' }}>CRITICAL ALERTS (RED)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444', fontFamily: 'JetBrains Mono', margin: '0.3rem 0' }}>
            {summary.critical || 1}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Cascade Risk Threat</div>
        </div>

        <div className="control-card control-card-glow-orange">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fb923c' }}>CONGESTION (ORANGE)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fb923c', fontFamily: 'JetBrains Mono', margin: '0.3rem 0' }}>
            {summary.warning || 1}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Track Occupancy &gt; 80%</div>
        </div>

        <div className="control-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>ETA SHIFT (YELLOW)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'JetBrains Mono', margin: '0.3rem 0' }}>
            {summary.advisory || 1}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Dynamic Re-estimate</div>
        </div>

        <div className="control-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>TELEMETRY SYNC (BLUE)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono', margin: '0.3rem 0' }}>
            {summary.info || 1}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Nominal Heartbeat</div>
        </div>
      </div>

      {/* Alert Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {alerts.map(alert => {
          const isRed = alert.severity === 'RED';
          const isOrange = alert.severity === 'ORANGE';
          const isYellow = alert.severity === 'YELLOW';

          return (
            <div
              key={alert.id}
              className="control-card"
              style={{
                background: '#0d1527',
                borderLeft: `5px solid ${isRed ? '#ef4444' : isOrange ? '#f97316' : isYellow ? '#f59e0b' : '#38bdf8'}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <span className={`badge-status ${
                      isRed ? 'badge-critical-delay' : isOrange ? 'badge-moderate-delay' : isYellow ? 'badge-minor-delay' : 'badge-ai-intel'
                    }`}>
                      {alert.severity} PRIORITY
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'JetBrains Mono' }}>
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                    {alert.acknowledged && (
                      <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <CheckCircle2 size={12} /> Acknowledged
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem' }}>
                    {alert.title}
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.4, marginBottom: '0.6rem' }}>
                    {alert.message}
                  </p>

                  {alert.actionRecommended && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                      color: '#ecfdf5',
                      marginBottom: '0.5rem'
                    }}>
                      <strong style={{ color: '#34d399' }}>AI Recommended Action:</strong> {alert.actionRecommended}
                    </div>
                  )}

                  {alert.affectedTrains?.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.725rem', color: '#94a3b8' }}>
                      <span>Affected Trains:</span>
                      {alert.affectedTrains.map(tId => (
                        <span key={tId} style={{
                          background: '#131c33',
                          border: '1px solid #1e2e4f',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          color: '#f8fafc',
                          fontFamily: 'JetBrains Mono',
                          fontWeight: 700
                        }}>
                          #{tId}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                    >
                      <CheckCircle2 size={14} color="#10b981" />
                      <span>Acknowledge</span>
                    </button>
                  )}

                  {alert.trainId && (
                    <button
                      onClick={() => onNavigateTab('eta', alert.trainId || '12864')}
                      className="btn-cyan"
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                    >
                      <span>Inspect Train &rarr;</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
