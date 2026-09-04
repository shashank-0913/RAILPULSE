import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit3,
  Clock,
  TrendingDown,
  ShieldCheck,
  History,
  AlertTriangle,
  ArrowRight,
  Zap
} from 'lucide-react';
import { RecommendationItem, ControllerAction, VerifiedUser } from '../types';
import { api } from '../services/api';

interface AIRecommendationsProps {
  user: VerifiedUser | null;
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({ user }) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [history, setHistory] = useState<ControllerAction[]>([]);
  const [totalSaved, setTotalSaved] = useState<number>(14);
  const [loading, setLoading] = useState(true);
  const [modifyingId, setModifyingId] = useState<string | null>(null);
  const [modifiedSaving, setModifiedSaving] = useState<number>(10);
  const [modifyNote, setModifyNote] = useState<string>('');

  const loadData = async () => {
    try {
      const res = await api.getRecommendations();
      if (res.success) {
        setRecommendations(res.activeRecommendations);
        setHistory(res.actionHistory);
        setTotalSaved(res.totalMinutesSaved || 14);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (recId: string, action: 'ACCEPTED' | 'REJECTED' | 'MODIFIED') => {
    await api.submitRecommendationAction(recId, {
      action,
      controllerName: user?.fullName || 'Chief Section Controller',
      role: user?.role || 'Chief Section Controller (Waltair)',
      note: action === 'MODIFIED' ? modifyNote : undefined,
      modifiedSavingMin: action === 'MODIFIED' ? modifiedSaving : undefined
    });
    setModifyingId(null);
    setModifyNote('');
    loadData();
  };

  return (
    <div className="page-wrapper">
      {/* Top Banner */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span className="badge-status badge-on-time">DECISION SUPPORT</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>•</span>
          <span style={{ fontSize: '0.75rem', color: '#10b981', fontFamily: 'JetBrains Mono' }}>
            Human-in-the-Loop Operations Ledger
          </span>
        </div>
        <h1 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={22} color="#10b981" />
          AI Dispatch Recommendations & Operational Decision Support
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          Real-time algorithmic dispatch advisories. Human controllers retain final command authority to Accept, Reject, or Modify interventions.
        </p>
      </div>

      {/* KPI Overview Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="control-card control-card-glow-green">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>CUMULATIVE DELAY SAVINGS</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono', margin: '0.3rem 0' }}>
            ~{totalSaved} <span style={{ fontSize: '1rem' }}>min</span>
          </div>
          <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>Network minutes saved via accepted interventions</div>
        </div>

        <div className="control-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>PENDING REVIEW</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono', margin: '0.3rem 0' }}>
            {recommendations.length} Advisories
          </div>
          <div style={{ fontSize: '0.725rem', color: '#38bdf8' }}>Formulated from live conflict analysis</div>
        </div>

        <div className="control-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>HUMAN DECISIONS LOGGED</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#cbd5e1', fontFamily: 'JetBrains Mono', margin: '0.3rem 0' }}>
            {history.length} Actions
          </div>
          <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>CRIS Operations Audit Trail</div>
        </div>
      </div>

      {/* Active Recommendations Section */}
      <div className="control-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={18} color="#06b6d4" />
          Active Algorithmic Recommendations Awaiting Controller Review
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {recommendations.map(rec => {
            const isModifying = modifyingId === rec.id;

            return (
              <div
                key={rec.id}
                style={{
                  background: '#10192e',
                  border: '1px solid #1e2e4f',
                  borderLeft: `5px solid ${rec.priority === 'CRITICAL' ? '#ef4444' : rec.priority === 'HIGH' ? '#f97316' : '#10b981'}`,
                  borderRadius: '0 10px 10px 0',
                  padding: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                      <span className={`badge-status ${rec.priority === 'CRITICAL' ? 'badge-critical-delay' : rec.priority === 'HIGH' ? 'badge-moderate-delay' : 'badge-on-time'}`}>
                        {rec.priority} PRIORITY
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                        Estimated Net Saving: ~{rec.estimatedSavingMin} min
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Linked: {rec.scenarioLinked}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem' }}>
                      {rec.title}
                    </h3>
                    <p style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                      {rec.description}
                    </p>
                    <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                      Junction Area: <strong style={{ color: '#f8fafc' }}>{rec.affectedJunction}</strong>
                    </div>
                  </div>

                  {/* Action Buttons: ACCEPT / REJECT / MODIFY */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleAction(rec.id, 'ACCEPTED')}
                      className="btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                    >
                      <CheckCircle2 size={15} />
                      <span>ACCEPT</span>
                    </button>

                    <button
                      onClick={() => handleAction(rec.id, 'REJECTED')}
                      className="btn-danger"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                    >
                      <XCircle size={15} />
                      <span>REJECT</span>
                    </button>

                    <button
                      onClick={() => setModifyingId(isModifying ? null : rec.id)}
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                    >
                      <Edit3 size={15} />
                      <span>MODIFY</span>
                    </button>
                  </div>
                </div>

                {/* Inline Modification Drawer */}
                {isModifying && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#0d1527',
                    border: '1px solid #1e3a8a',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem' }}>
                      Modify Dispatch Parameters Before Logging:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.75rem', alignItems: 'center' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.2rem' }}>
                          Custom Saving (min):
                        </label>
                        <input
                          type="number"
                          value={modifiedSaving}
                          onChange={e => setModifiedSaving(Number(e.target.value))}
                          style={{
                            width: '100%',
                            background: '#131c33',
                            border: '1px solid #1e2e4f',
                            color: '#f8fafc',
                            padding: '0.4rem 0.6rem',
                            borderRadius: '6px',
                            fontFamily: 'JetBrains Mono',
                            fontSize: '0.85rem'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.2rem' }}>
                          Controller Operational Note:
                        </label>
                        <input
                          type="text"
                          value={modifyNote}
                          onChange={e => setModifyNote(e.target.value)}
                          placeholder="e.g. Caution order 45 km/h enforced on loop line..."
                          style={{
                            width: '100%',
                            background: '#131c33',
                            border: '1px solid #1e2e4f',
                            color: '#f8fafc',
                            padding: '0.4rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem'
                          }}
                        />
                      </div>
                      <div>
                        <button
                          onClick={() => handleAction(rec.id, 'MODIFIED')}
                          className="btn-cyan"
                          style={{ fontSize: '0.75rem', padding: '0.45rem 0.8rem', marginTop: '1rem' }}
                        >
                          Submit Modified Action
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controller Decision Action History Ledger (CRIS Compliance) */}
      <div className="control-card">
        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={18} color="#38bdf8" />
          Human-in-the-Loop Action History & CRIS Compliance Ledger
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="telemetry-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Recommendation</th>
                <th>Controller</th>
                <th>Action Taken</th>
                <th>Delay Saved</th>
                <th>Operational Note</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(item => (
                <tr key={item.id}>
                  <td style={{ fontFamily: 'JetBrains Mono', color: '#94a3b8', fontSize: '0.75rem' }}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </td>
                  <td style={{ fontWeight: 600, color: '#f8fafc' }}>
                    {item.recommendationTitle}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{item.controllerName}</div>
                    <div style={{ fontSize: '0.675rem', color: '#64748b' }}>{item.role}</div>
                  </td>
                  <td>
                    <span className={`badge-status ${
                      item.actionTaken === 'ACCEPTED' ? 'badge-on-time' :
                      item.actionTaken === 'MODIFIED' ? 'badge-ai-intel' : 'badge-critical-delay'
                    }`}>
                      {item.actionTaken}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: item.delayMinutesSaved > 0 ? '#10b981' : '#64748b' }}>
                    {item.delayMinutesSaved > 0 ? `+${item.delayMinutesSaved}m` : '0m'}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {item.note || 'Recorded in shift log.'}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
