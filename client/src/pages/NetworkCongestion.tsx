import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  AlertTriangle,
  Activity,
  Gauge,
  Layers,
  TrainTrack,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  Sparkles
} from 'lucide-react';
import { Section, AnomalyEvent, ConflictEvent, StationImpact } from '../types';
import { api } from '../services/api';

interface NetworkCongestionProps {
  onNavigateTab: (tab: string, trainId?: string) => void;
}

export const NetworkCongestion: React.FC<NetworkCongestionProps> = ({ onNavigateTab }) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [conflicts, setConflicts] = useState<ConflictEvent[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [stationImpacts, setStationImpacts] = useState<StationImpact[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'SECTIONS' | 'ANOMALIES_CONFLICTS' | 'STATION_IMPACTS'>('SECTIONS');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [netRes, confRes, anomRes, impactRes] = await Promise.all([
        api.getNetworkCongestion(),
        api.getNetworkConflicts(),
        api.getNetworkAnomalies(),
        api.getStationImpacts()
      ]);

      if (netRes.success) {
        setSections(netRes.sections);
        setSummary(netRes.summary);
      }
      if (confRes.success) setConflicts(confRes.conflicts);
      if (anomRes.success) setAnomalies(anomRes.anomalies);
      if (impactRes.success) setStationImpacts(impactRes.stationImpacts);

      setLoading(false);
    };
    load();
  }, []);

  const filteredSections = sections.filter(s => filterLevel === 'ALL' || s.congestionLevel === filterLevel);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge-status badge-moderate-delay">NETWORK INTELLIGENCE</span>
          </div>
          <h1 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitBranch size={22} color="#f97316" />
            Network Monitoring: Congestion, Anomalies & Junction Conflicts
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Real-time tracking of block section track occupancy, locomotive speed anomalies, and junction platform pressure.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', background: '#131c33', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setActiveSubTab('SECTIONS')}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              border: 'none',
              background: activeSubTab === 'SECTIONS' ? '#10b981' : 'transparent',
              color: activeSubTab === 'SECTIONS' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            Block Sections ({sections.length})
          </button>
          <button
            onClick={() => setActiveSubTab('ANOMALIES_CONFLICTS')}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              border: 'none',
              background: activeSubTab === 'ANOMALIES_CONFLICTS' ? '#f97316' : 'transparent',
              color: activeSubTab === 'ANOMALIES_CONFLICTS' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            Anomalies & Conflicts ({anomalies.length + conflicts.length})
          </button>
          <button
            onClick={() => setActiveSubTab('STATION_IMPACTS')}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              border: 'none',
              background: activeSubTab === 'STATION_IMPACTS' ? '#06b6d4' : 'transparent',
              color: activeSubTab === 'STATION_IMPACTS' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            Station Platform Impacts ({stationImpacts.length})
          </button>
        </div>
      </div>

      {/* 1. SECTIONS VIEW */}
      {activeSubTab === 'SECTIONS' && (
        <>
          {/* Summary KPI Highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="control-card control-card-glow-orange">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fb923c' }}>HIGH CONGESTION SECTIONS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fb923c', fontFamily: 'JetBrains Mono', margin: '0.3rem 0' }}>
                {summary.highCongestionSections || 3} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ {sections.length}</span>
              </div>
              <div style={{ fontSize: '0.725rem', color: '#cbd5e1' }}>Occupancy &gt; 80% (VSKP-VZM, CHE-VZM, EE-BZA)</div>
            </div>

            <div className="control-card">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>MODERATE CONGESTION</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'JetBrains Mono', margin: '0.3rem 0' }}>
                {summary.mediumCongestionSections || 7}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>Occupancy 55% – 80%</div>
            </div>

            <div className="control-card control-card-glow-green">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>NOMINAL FLOW SECTIONS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono', margin: '0.3rem 0' }}>
                {summary.lowCongestionSections || 5}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#34d399' }}>Occupancy &lt; 55% | Clear Headway</div>
            </div>

            <div className="control-card control-card-glow-red">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171' }}>HIGHEST CONFLICT HOTSPOT</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ef4444', fontFamily: 'JetBrains Mono', margin: '0.3rem 0' }}>
                VSKP &rarr; VZM (73%)
              </div>
              <div style={{ fontSize: '0.725rem', color: '#fca5a5' }}>Expected delay impact: +8 to +15 min</div>
            </div>
          </div>

          {/* Section Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filteredSections.map(sec => {
              const isHigh = sec.congestionLevel === 'HIGH';

              return (
                <div
                  key={sec.id}
                  className={`control-card ${isHigh ? 'control-card-glow-orange' : ''}`}
                  style={{ background: '#0d1527' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'JetBrains Mono' }}>{sec.id}</span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                        {sec.from} &rarr; {sec.to}
                      </h3>
                    </div>
                    <span className={`badge-status ${
                      sec.congestionLevel === 'HIGH' ? 'badge-moderate-delay' :
                      sec.congestionLevel === 'MEDIUM' ? 'badge-minor-delay' : 'badge-on-time'
                    }`}>
                      {sec.congestionLevel}
                    </span>
                  </div>

                  <div style={{ marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                      <span style={{ color: '#94a3b8' }}>Occupancy:</span>
                      <strong style={{ color: isHigh ? '#f97316' : '#cbd5e1', fontFamily: 'JetBrains Mono' }}>{sec.currentOccupancy}%</strong>
                    </div>
                    <div style={{ height: '6px', background: '#131c33', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${sec.currentOccupancy}%`, height: '100%', background: isHigh ? '#ef4444' : '#10b981' }}></div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.85rem', textAlign: 'center' }}>
                    <div style={{ background: '#131c33', padding: '0.5rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>TRAINS</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>{sec.activeTrains}</div>
                    </div>
                    <div style={{ background: '#131c33', padding: '0.5rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>AVG SPEED</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>{sec.avgSpeedKmH}km/h</div>
                    </div>
                    <div style={{ background: '#131c33', padding: '0.5rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>CONFLICT</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: sec.conflictRisk > 60 ? '#ef4444' : '#10b981', fontFamily: 'JetBrains Mono' }}>{sec.conflictRisk}%</div>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateTab('simulation')}
                    className="btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '0.4rem' }}
                  >
                    <span>Simulate Section Interventions &rarr;</span>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 2. ANOMALIES & CONFLICTS VIEW (Prompt Sections 10 & 11) */}
      {activeSubTab === 'ANOMALIES_CONFLICTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Active Conflicts */}
          <div className="control-card control-card-glow-red">
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f87171', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="#ef4444" />
              Active Headway & Section Conflicts
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {conflicts.map(conf => (
                <div key={conf.id} style={{ background: '#10192e', padding: '1rem', borderRadius: '8px', border: '1px solid #1e2e4f' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ef4444' }}>
                      ⚠️ POTENTIAL CONFLICT: Train #{conf.primaryTrainId} & Train #{conf.secondaryTrainId}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                      Conflict Probability: {conf.conflictProbabilityPercent}% | Time to Impact: {conf.timeToImpactMinutes} min
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                    {conf.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span>Estimated Delay Impact: <strong style={{ color: '#fb923c' }}>{conf.estimatedDelayImpactMin}</strong></span>
                    <button
                      onClick={() => onNavigateTab('simulation')}
                      className="btn-cyan"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                    >
                      Resolve in What-If Sandbox &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Abnormal Movements & Speed Deviations (Prompt Section 11) */}
          <div className="control-card">
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Gauge size={18} color="#f97316" />
              Detected Telemetry Anomalies & Abnormal Movement Patterns
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {anomalies.map(anom => (
                <div key={anom.id} style={{ background: '#131c33', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #f97316' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.85rem' }}>
                      ⚠️ {anom.type.replace('_', ' ')}: Train #{anom.trainId} ({anom.trainName})
                    </span>
                    <span className="badge-status badge-critical-delay" style={{ fontSize: '0.65rem' }}>
                      {anom.deviationPercent}% Deviation
                    </span>
                  </div>
                  <div style={{ fontSize: '0.775rem', color: '#38bdf8', fontFamily: 'JetBrains Mono', marginBottom: '0.35rem' }}>
                    Location: {anom.location} | Observed: {anom.observedSpeedKmH} km/h vs Expected: {anom.expectedSpeedKmH} km/h
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                    {anom.impactDescription}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. STATION IMPACTS VIEW (Prompt Section 21) */}
      {activeSubTab === 'STATION_IMPACTS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
          {stationImpacts.map(st => (
            <div key={st.stationCode} className="control-card control-card-glow-cyan" style={{ background: '#0d1527' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>STATION NODE:</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                    {st.stationName} ({st.stationCode})
                  </h3>
                </div>
                <span className={`badge-status ${st.congestionRisk === 'HIGH' ? 'badge-critical-delay' : 'badge-minor-delay'}`}>
                  {st.congestionRisk} RISK
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ background: '#131c33', padding: '0.5rem', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b' }}>Platform Pressure</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444', fontFamily: 'JetBrains Mono' }}>{st.platformPressurePercent}%</div>
                </div>
                <div style={{ background: '#131c33', padding: '0.5rem', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b' }}>Delayed Arrivals</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f97316', fontFamily: 'JetBrains Mono' }}>{st.expectedDelayedArrivals} Trains</div>
                </div>
                <div style={{ background: '#131c33', padding: '0.5rem', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b' }}>Dwell Penalty</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#cbd5e1', fontFamily: 'JetBrains Mono' }}>+{st.additionalDwellMin}m</div>
                </div>
                <div style={{ background: '#131c33', padding: '0.5rem', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b' }}>Missed Connect Risk</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>{st.connectingPassengerMissRiskPercent}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
