import React, { useState, useEffect } from 'react';
import {
  Network,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Cpu,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  RefreshCw,
  GitCommit,
  Clock,
  Timer,
  Activity
} from 'lucide-react';
import { Train } from '../types';
import { api } from '../services/api';

interface DelayPropagationProps {
  onNavigateTab: (tab: string, trainId?: string) => void;
}

export const DelayPropagation: React.FC<DelayPropagationProps> = ({ onNavigateTab }) => {
  const [trains, setTrains] = useState<Train[]>([]);
  const [originTrainId, setOriginTrainId] = useState<string>('12864');
  const [additionalDelay, setAdditionalDelay] = useState<number>(0);
  const [propagationData, setPropagationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async (trainId: string, addDelay: number) => {
    try {
      const [trainsRes, propRes] = await Promise.all([
        api.getTrains(),
        api.getDelayPropagation(trainId, addDelay)
      ]);
      if (trainsRes.success) setTrains(trainsRes.trains);
      if (propRes.success) setPropagationData(propRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(originTrainId, additionalDelay);
  }, [originTrainId, additionalDelay]);

  return (
    <div className="page-wrapper">
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge-status badge-moderate-delay">KEY DIFFERENTIATOR</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: '#8b5cf6', fontFamily: 'JetBrains Mono' }}>
              Time-to-Impact & Cascade Graph Engine
            </span>
          </div>
          <h1 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Network size={22} color="#8b5cf6" />
            Delay Propagation, Downstream Cascades & Early Warning Time-to-Impact
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Calculates how delays cascade across trains, junctions, and platform lines, alerting controllers minutes before disruptions strike.
          </p>
        </div>

        {/* Origin Train Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={originTrainId}
            onChange={e => setOriginTrainId(e.target.value)}
            style={{
              background: '#131c33',
              border: '1px solid #1e2e4f',
              color: '#f8fafc',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              fontFamily: 'JetBrains Mono'
            }}
          >
            {trains.map(t => (
              <option key={t.id} value={t.id}>
                Origin: Train #{t.id} - {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prominent Early-Warning Time-to-Impact Box (Prompt Section 13) */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
        border: '1px solid #6366f1',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#4338ca',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)'
          }}>
            <Timer size={26} color="#ffffff" className="animate-pulse" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              EARLY-WARNING CASCADE ADVISORY
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
              Secondary Train #17240 may be affected in approx. <span style={{ color: '#fbbf24' }}>{propagationData?.timeToImpactFormatted || '17 minutes'}</span>
            </div>
            <div style={{ fontSize: '0.775rem', color: '#cbd5e1' }}>
              Action window available: Divert or stage hold before junction entry to eliminate 14 minutes cascading delay.
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('simulation')}
          className="btn-cyan"
          style={{ padding: '0.6rem 1.1rem', fontSize: '0.825rem' }}
        >
          <Sliders size={16} />
          <span>Simulate Interventions</span>
        </button>
      </div>

      {/* Cascade Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Cascade Risk Level */}
        <div className="control-card control-card-glow-red" style={{
          background: propagationData?.cascadeRisk === 'CRITICAL' ? 'rgba(239, 68, 68, 0.12)' :
                      propagationData?.cascadeRisk === 'HIGH' ? 'rgba(249, 115, 22, 0.12)' : 'rgba(16, 185, 129, 0.12)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171' }}>CASCADE RISK LEVEL</div>
          <div style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            fontFamily: 'JetBrains Mono',
            margin: '0.3rem 0',
            color: propagationData?.cascadeRisk === 'CRITICAL' ? '#ef4444' :
                   propagationData?.cascadeRisk === 'HIGH' ? '#f97316' : '#10b981'
          }}>
            {propagationData?.cascadeRisk || 'HIGH'}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#cbd5e1' }}>
            Probability: <strong>{propagationData?.probabilityPercent || 78}%</strong>
          </div>
        </div>

        {/* Affected Trains */}
        <div className="control-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>AFFECTED TRAINS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono', margin: '0.3rem 0' }}>
            {propagationData?.affectedTrainsCount || 3} Trains
          </div>
          <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
            Headway & Signal Block Holds
          </div>
        </div>

        {/* Potential Additional Delay */}
        <div className="control-card control-card-glow-orange">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fb923c' }}>POTENTIAL ADDITIONAL DELAY</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fb923c', fontFamily: 'JetBrains Mono', margin: '0.3rem 0' }}>
            {propagationData?.potentialAdditionalDelayRange || '8–18 minutes'}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#cbd5e1' }}>
            Total Downstream Impact: ~{propagationData?.totalCascadeMinutes || 27}m lost
          </div>
        </div>

        {/* Affected Stations */}
        <div className="control-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>AFFECTED STATIONS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono', margin: '0.3rem 0' }}>
            {propagationData?.affectedStationsCount || 4} Stations
          </div>
          <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
            VZM, VSKP, CHE, DVD Junctions
          </div>
        </div>
      </div>

      {/* Two Columns: Network Cascade Graph & Time-to-Impact Progression Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* SVG Network Graph */}
        <div className="control-card" style={{ background: '#0a0f1d', padding: '1.25rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitCommit size={18} color="#8b5cf6" />
            Topological Cascade Propagation Graph
          </div>

          <div style={{ width: '100%', height: '300px', background: '#070b16', borderRadius: '10px', border: '1px solid #1c2a47', overflow: 'hidden' }}>
            <svg viewBox="0 0 740 300" style={{ width: '100%', height: '100%' }}>
              {/* Lines */}
              <line x1="120" y1="150" x2="260" y2="150" stroke="#f97316" strokeWidth="3.5" strokeDasharray="5 3" />
              <line x1="340" y1="150" x2="440" y2="90" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 2" />
              <line x1="340" y1="150" x2="440" y2="210" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 2" />
              <line x1="520" y1="90" x2="590" y2="70" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4 2" />
              <line x1="520" y1="210" x2="590" y2="180" stroke="#f97316" strokeWidth="2" strokeDasharray="4 2" />
              <line x1="520" y1="210" x2="590" y2="240" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />

              {/* Node 1: Origin */}
              <g transform="translate(30, 115)">
                <rect width="90" height="70" rx="8" fill="#131c33" stroke="#ef4444" strokeWidth="2" />
                <text x="45" y="24" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="800" fontFamily="JetBrains Mono">Train #{originTrainId}</text>
                <text x="45" y="42" textAnchor="middle" fill="#94a3b8" fontSize="8">Superfast Exp</text>
                <text x="45" y="58" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="800" fontFamily="JetBrains Mono">+12 min</text>
              </g>

              {/* Node 2: Section */}
              <g transform="translate(260, 115)">
                <rect width="80" height="70" rx="8" fill="#131c33" stroke="#f97316" strokeWidth="2" />
                <text x="40" y="24" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="700">Section</text>
                <text x="40" y="40" textAnchor="middle" fill="#fb923c" fontSize="10" fontWeight="800" fontFamily="JetBrains Mono">VSKP→VZM</text>
                <text x="40" y="58" textAnchor="middle" fill="#94a3b8" fontSize="8">88% Occ</text>
              </g>

              {/* Node 3: Junction VZM */}
              <g transform="translate(440, 60)">
                <rect width="80" height="55" rx="6" fill="#131c33" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="40" y="24" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">VZM Jn</text>
                <text x="40" y="42" textAnchor="middle" fill="#cbd5e1" fontSize="8">Platform 3</text>
              </g>

              {/* Node 4: Junction VSKP */}
              <g transform="translate(440, 180)">
                <rect width="80" height="55" rx="6" fill="#131c33" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="40" y="24" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">VSKP Jn</text>
                <text x="40" y="42" textAnchor="middle" fill="#cbd5e1" fontSize="8">Yard Block</text>
              </g>

              {/* Node 5: Affected Train 17240 */}
              <g transform="translate(590, 45)">
                <rect width="115" height="50" rx="6" fill="#131c33" stroke="#ef4444" strokeWidth="2" />
                <text x="57" y="20" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="800" fontFamily="JetBrains Mono">Train #17240</text>
                <text x="57" y="38" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="800" fontFamily="JetBrains Mono">+15 min (T-17m)</text>
              </g>

              {/* Node 6: Affected Train 18520 */}
              <g transform="translate(590, 155)">
                <rect width="115" height="50" rx="6" fill="#131c33" stroke="#f97316" strokeWidth="1.5" />
                <text x="57" y="20" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="800" fontFamily="JetBrains Mono">Train #18520</text>
                <text x="57" y="38" textAnchor="middle" fill="#fb923c" fontSize="10" fontWeight="800" fontFamily="JetBrains Mono">+11 min (T-26m)</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Time-to-Impact Progression Timeline */}
        <div className="control-card">
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={16} color="#06b6d4" />
            Time-to-Impact Cascade Progression
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {propagationData?.impactTimeline?.map((item: any, idx: number) => (
              <div key={idx} style={{
                background: item.status === 'ACTIVE_NOW' ? 'rgba(239, 68, 68, 0.15)' :
                            item.status === 'PREDICTED_CRITICAL' ? 'rgba(249, 115, 22, 0.15)' : '#10192e',
                border: item.status === 'ACTIVE_NOW' ? '1px solid #ef4444' :
                        item.status === 'PREDICTED_CRITICAL' ? '1px solid #f97316' : '1px solid #1c2a47',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, fontFamily: 'JetBrains Mono', color: item.status === 'ACTIVE_NOW' ? '#ef4444' : '#fbbf24' }}>
                    {item.timestamp} (T+{item.timeOffsetMin}m)
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                  {item.event}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#cbd5e1', marginTop: '2px' }}>
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
