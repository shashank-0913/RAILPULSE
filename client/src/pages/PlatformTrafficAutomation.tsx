import React, { useState, useEffect } from 'react';
import {
  GitMerge,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
  TrendingDown,
  RefreshCw,
  Sliders,
  ChevronRight,
  Users,
  TrainTrack,
  Layers,
  Activity,
  Check,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import {
  PlatformTrafficState,
  PlatformOption,
  VerifiedUser,
  PlatformActionRecord
} from '../types';
import { api } from '../services/api';

interface PlatformTrafficAutomationProps {
  user?: VerifiedUser | null;
  onNavigateTab?: (tab: string, trainId?: string) => void;
}

export const PlatformTrafficAutomation: React.FC<PlatformTrafficAutomationProps> = ({
  user,
  onNavigateTab
}) => {
  const [data, setData] = useState<PlatformTrafficState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOption, setSelectedOption] = useState<string>('OPTION_B');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simActiveStep, setSimActiveStep] = useState<number>(0);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [lastUpdatedSec, setLastUpdatedSec] = useState<number>(0);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);

  const fetchState = async (offset = 0) => {
    try {
      const res = await api.getPlatformTrafficAutomation('KGP', offset);
      if (res && res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Error fetching platform traffic state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(() => {
      fetchState();
      setLastUpdatedSec(0);
    }, 6000);

    const ticker = setInterval(() => {
      setLastUpdatedSec(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(ticker);
    };
  }, []);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimActiveStep(1);

    for (let s = 1; s <= 6; s++) {
      setSimActiveStep(s);
      await new Promise(r => setTimeout(r, 450));
    }

    try {
      const simRes = await api.runPlatformConflictSimulation('KGP', 0);
      if (simRes && simRes.success) {
        setData(simRes);
      }
    } catch (e) {
      console.error('Simulation error:', e);
    } finally {
      setIsSimulating(false);
      setSimActiveStep(0);
    }
  };

  const handleAcceptRecommendation = async () => {
    if (!data) return;
    try {
      const payload = {
        stationCode: data.stationCode,
        stationName: data.stationName,
        trainB: data.approachingTrain.number,
        trainBName: data.approachingTrain.name,
        action: data.aiRecommendation.recommendedAction,
        decision: 'ACCEPTED',
        controllerName: user?.fullName || 'Chief Section Controller',
        role: user?.role || 'Chief Section Controller (Waltair Division)',
        minutesSaved: 3.0,
        notes: `Accepted recommendation to route Train #${data.approachingTrain.number} to ${data.aiRecommendation.platform} to prevent 3m platform bottleneck.`
      };

      const res = await api.submitPlatformAction(payload);
      if (res.success) {
        setActionSuccessMsg(`✓ Advisory Action Recorded: ${data.aiRecommendation.recommendedAction} (Logged in Decision Ledger)`);
        fetchState();
        setTimeout(() => setActionSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.error('Error submitting platform action:', err);
    }
  };

  if (loading && !data) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <RefreshCw className="spin" size={36} color="var(--color-cyan)" style={{ margin: '0 auto 1rem' }} />
          <p style={{ fontWeight: 600 }}>Loading Real-time Platform & Traffic Automation Intelligence...</p>
        </div>
      </div>
    );
  }

  const d = data!;
  const approaching = d.approachingTrain;
  const aiRec = d.aiRecommendation;

  return (
    <div className="page-wrapper">
      {/* 1. COLUMN HEADER & STATUS BADGE */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #10b981, #38bdf8, #f59e0b)' }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.725rem',
              fontWeight: 800,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: d.status === 'CRITICAL CONFLICT' ? 'rgba(239, 68, 68, 0.2)' : d.status === 'CONFLICT PREDICTED' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: d.status === 'CRITICAL CONFLICT' ? '#ef4444' : d.status === 'CONFLICT PREDICTED' ? '#f59e0b' : '#10b981',
              border: `1px solid ${d.status === 'CRITICAL CONFLICT' ? '#ef4444' : d.status === 'CONFLICT PREDICTED' ? '#f59e0b' : '#10b981'}`
            }}>
              {d.status === 'CRITICAL CONFLICT' ? '🔴 CRITICAL CONFLICT' : d.status === 'CONFLICT PREDICTED' ? '⚠ CONFLICT PREDICTED' : '● NETWORK NORMAL'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>
              Station: {d.stationName} ({d.stationCode}) | Live Feed Updated {lastUpdatedSec}s ago
            </span>
          </div>

          <h1 className="font-heading" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span>🚦 PLATFORM & TRAFFIC AUTOMATION</span>
          </h1>
          <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.25rem', maxWidth: '820px' }}>
            Monitors upcoming platform headway bottlenecks, evaluates alternative platform turnouts & bypass chord routes, computes dynamic delay propagation, and renders AI operational advisories.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="btn-cyan"
            style={{
              padding: '0.65rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.35)'
            }}
          >
            <Play size={15} className={isSimulating ? 'spin' : ''} fill={isSimulating ? 'none' : 'currentColor'} />
            {isSimulating ? 'Simulating Dynamic Flow...' : '▶ RUN CONFLICT SIMULATION'}
          </button>

          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
            Decision Engine: Python XGBoost + Rule Dispatch
          </span>
        </div>
      </div>

      {/* ACTION SUCCESS BANNER */}
      {actionSuccessMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#10b981',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ANIMATED SIMULATION PIPELINE (SECTION 9) */}
      {isSimulating && (
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--color-cyan)',
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-cyan)', marginBottom: '0.75rem' }}>
            ⚡ EXECUTING MULTI-STAGE TRAFFIC CONFLICT SIMULATION
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem' }}>
            {d.simulationPipeline.map((step) => {
              const isPassed = simActiveStep > step.step;
              const isCurrent = simActiveStep === step.step;
              return (
                <div
                  key={step.step}
                  style={{
                    background: isCurrent ? 'rgba(56, 189, 248, 0.15)' : isPassed ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface)',
                    border: isCurrent ? '1px solid var(--color-cyan)' : isPassed ? '1px solid var(--color-green)' : '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: isCurrent ? 'var(--color-cyan)' : isPassed ? 'var(--color-green)' : 'var(--text-muted)'
                  }}>
                    {step.step}. {step.name}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {isCurrent ? 'Processing...' : isPassed ? '✓ Done' : 'Queued'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2-COLUMN OPERATIONAL LAYOUT (RESPONSIVE) */}
      <div className="dashboard-grid-main" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        
        {/* LEFT COLUMN: UPCOMING CONFLICTS & PLATFORM OCCUPANCY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* SECTION 1 — UPCOMING PLATFORM CONFLICTS */}
          <div className="card" style={{ border: '1px solid rgba(245, 158, 11, 0.3)', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="#f59e0b" />
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                  SECTION 1 — UPCOMING PLATFORM CONFLICTS
                </h2>
              </div>
              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 700 }}>
                1 Active Conflict
              </span>
            </div>

            {d.conflicts.map(c => (
              <div
                key={c.conflictId}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {/* Train A */}
                  <div style={{ background: 'var(--bg-surface)', padding: '0.65rem', borderRadius: '6px', borderLeft: '3px solid #ef4444' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>TRAIN A (Current Occupant)</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      #{c.trainA.number} — {c.trainA.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <strong>{c.platform}</strong> • ETA: <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>{c.trainA.eta}</span> | Expected Clear: <span style={{ fontFamily: 'JetBrains Mono', color: '#ef4444', fontWeight: 700 }}>{c.trainA.clearance}</span>
                    </div>
                  </div>

                  {/* Train B */}
                  <div style={{ background: 'var(--bg-surface)', padding: '0.65rem', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>TRAIN B (Approaching)</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      #{c.trainB.number} — {c.trainB.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <strong>{c.platform}</strong> • Current ETA: <span style={{ fontFamily: 'JetBrains Mono', color: '#f59e0b', fontWeight: 700 }}>{c.trainB.eta}</span>
                    </div>
                  </div>
                </div>

                {/* Conflict Box */}
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '6px',
                  padding: '0.6rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} color="#f59e0b" />
                    <span style={{ fontSize: '0.775rem', fontWeight: 800, color: '#f59e0b' }}>⚠ CONFLICT PREDICTED</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                    Conflict Window: <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: '#f59e0b' }}>{c.conflictWindow}</span> ({c.overlapMinutes} min overlap)
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SECTION 2 — PLATFORM OCCUPANCY */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} color="var(--color-cyan)" />
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                  SECTION 2 — PLATFORM OCCUPANCY
                </h2>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>4 Track Platforms</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {d.platforms.map((p) => {
                const isOcc = p.status === 'OCCUPIED';
                const isAvail = p.status === 'AVAILABLE';
                const isExp = p.status === 'EXPECTED OCCUPANCY';
                const isBlocked = p.status === 'BLOCKED';

                return (
                  <div
                    key={p.platformNumber}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: isAvail ? '1px solid rgba(16, 185, 129, 0.4)' : isOcc ? '1px solid rgba(239, 68, 68, 0.4)' : isExp ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{p.platformNumber}</span>
                      <span style={{
                        fontSize: '0.675rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: isAvail ? 'rgba(16, 185, 129, 0.15)' : isOcc ? 'rgba(239, 68, 68, 0.15)' : isExp ? 'rgba(245, 158, 11, 0.15)' : 'rgba(100, 116, 139, 0.2)',
                        color: isAvail ? '#10b981' : isOcc ? '#ef4444' : isExp ? '#f59e0b' : '#94a3b8'
                      }}>
                        {p.statusLabel}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      {p.trainName}
                    </div>

                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Clearance: <strong>{p.clearanceTime}</strong></span>
                      <span>Length: {p.compatibleCoaches} Coaches</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 8 — PLATFORM TIMELINE (GANTT CHART) */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="var(--color-green)" />
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                  SECTION 8 — PLATFORM TIMELINE
                </h2>
              </div>
              <span style={{ fontSize: '0.675rem', color: 'var(--color-green)', fontWeight: 600 }}>Visual Dynamic Gantt</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {d.timeline.map(tl => (
                <div key={tl.platform} style={{ background: 'var(--bg-elevated)', borderRadius: '6px', padding: '0.6rem 0.85rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    {tl.platform}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {tl.tracks.map((tr, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: tr.hasConflict ? 'rgba(245, 158, 11, 0.15)' : tr.isRecommendedSlot ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface)',
                          border: `1px solid ${tr.color}`,
                          borderRadius: '4px',
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.7rem'
                        }}
                      >
                        <span style={{ fontWeight: 700, color: tr.color }}>
                          {tr.trainLabel}
                        </span>
                        <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)' }}>
                          {tr.startTime} ──────── {tr.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TRAIN B DECISION, OPTIONS, AI RECOMMENDATION & WHAT-IF */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* SECTION 3 — TRAIN B DECISION SUMMARY */}
          <div className="card" style={{ border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrainTrack size={18} color="var(--color-cyan)" />
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                  SECTION 3 — TRAIN B DECISION
                </h2>
              </div>
              <span className="badge-status badge-ai-intel">APPROACHING JUNCTION</span>
            </div>

            <div style={{
              background: 'var(--bg-elevated)',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.5rem',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current ETA</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>{approaching.currentEta}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Required Platform</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ef4444' }}>{approaching.requiredPlatform}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Platform Status</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444' }}>Occupied (Train A)</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Predicted Conflict</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'JetBrains Mono' }}>{approaching.predictedConflictMinutes} min</div>
              </div>
            </div>
          </div>

          {/* SECTION 4 — OPTIONS (OPTION A, B, C) */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={18} color="var(--color-cyan)" />
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                  SECTION 4 — DISPATCH OPTIONS
                </h2>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>3 Feasible Operational Strategies</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {d.options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedOption(opt.id)}
                    style={{
                      background: isSelected ? 'var(--color-cyan-glow)' : 'var(--bg-elevated)',
                      border: isSelected ? '1px solid var(--color-cyan)' : opt.isRecommended ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.8rem', color: opt.isRecommended ? 'var(--color-green)' : 'var(--text-primary)' }}>
                          {opt.title}
                        </span>
                        {opt.isRecommended && (
                          <span style={{ fontSize: '0.625rem', padding: '0.1rem 0.4rem', borderRadius: '9999px', background: 'var(--color-green)', color: '#000', fontWeight: 800 }}>
                            ★ AI RECOMMENDED
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono', color: 'var(--text-primary)', fontWeight: 700 }}>
                        New ETA: {opt.predictedNewEta}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      <div>Time Added: <strong style={{ color: 'var(--text-primary)' }}>{opt.waitingTime || opt.additionalTime || opt.additionalRouteTime}</strong></div>
                      <div>Network Impact: <strong style={{ color: opt.networkImpact === 'Low' ? 'var(--color-green)' : opt.networkImpact === 'Medium' ? '#f59e0b' : '#ef4444' }}>{opt.networkImpact}</strong></div>
                      <div>Passenger Impact: <strong style={{ color: opt.passengerImpact === 'Low' ? 'var(--color-green)' : opt.passengerImpact === 'Medium' ? '#f59e0b' : '#ef4444' }}>{opt.passengerImpact}</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 5 — AI RECOMMENDATION CARD */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 78, 59, 0.25) 100%)',
            border: '1px solid #10b981',
            borderRadius: '10px',
            padding: '1.25rem',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  SECTION 5 — 🤖 AI RECOMMENDATION
                </h3>
              </div>
              <span style={{
                fontSize: '0.675rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                border: '1px solid #10b981'
              }}>
                {aiRec.confidenceScore ? `${aiRec.confidenceScore}% Model Confidence` : 'RULE-BASED RECOMMENDATION'}
              </span>
            </div>

            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.65rem' }}>
              Recommended Action: <span style={{ color: '#10b981' }}>{aiRec.recommendedAction}</span>
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Operational Rationale:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.775rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {aiRec.reasons.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Expected Result & Controller Actions */}
            <div style={{
              background: 'var(--bg-elevated)',
              borderRadius: '6px',
              padding: '0.65rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.725rem' }}>
                Train B Delay: <strong style={{ color: '#10b981' }}>{aiRec.expectedResult.trainBDelay}</strong>
              </div>
              <div style={{ fontSize: '0.725rem' }}>
                Network Impact: <strong style={{ color: '#10b981' }}>{aiRec.expectedResult.networkDelayImpact}</strong>
              </div>
              <div style={{ fontSize: '0.725rem' }}>
                Passenger Impact: <strong style={{ color: '#10b981' }}>{aiRec.expectedResult.passengerImpact}</strong>
              </div>
            </div>

            {/* SECTION 10 — CONTROLLER ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                onClick={handleAcceptRecommendation}
                style={{
                  flex: 1,
                  background: '#10b981',
                  color: '#022c22',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.6rem 0.85rem',
                  fontSize: '0.825rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)'
                }}
              >
                <Check size={16} />
                ACCEPT RECOMMENDATION
              </button>

              <button
                onClick={handleRunSimulation}
                className="btn-cyan"
                style={{
                  fontSize: '0.775rem',
                  padding: '0.6rem 0.85rem'
                }}
              >
                <RefreshCw size={14} />
                RUN ANOTHER SIMULATION
              </button>

              <button
                onClick={() => setShowDetailsModal(true)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '0.6rem 0.85rem',
                  fontSize: '0.775rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                VIEW DETAILS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6 & 7: WHAT-IF COMPARISON TABLE & DELAY PROPAGATION */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        
        {/* SECTION 6 — WHAT-IF COMPARISON */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--color-cyan)" />
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                SECTION 6 — COMPARE OPTIONS (WHAT-IF MATRIX)
              </h2>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dynamically Calculated</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table-railpulse" style={{ fontSize: '0.775rem' }}>
              <thead>
                <tr>
                  <th>METRIC</th>
                  <th>OPTION A (WAIT)</th>
                  <th style={{ color: 'var(--color-green)' }}>OPTION B (PLATFORM 2) ★</th>
                  <th>OPTION C (REROUTE)</th>
                </tr>
              </thead>
              <tbody>
                {d.whatIfComparison.rows.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700 }}>{row.metric}</td>
                    <td style={{ fontFamily: 'JetBrains Mono' }}>{row.wait}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--color-green)', fontWeight: 700, background: 'rgba(16, 185, 129, 0.05)' }}>
                      {row.platform2}
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono' }}>{row.reroute}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 7 — DELAY PROPAGATION */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingDown size={18} color="#38bdf8" />
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                SECTION 7 — DELAY PROPAGATION
              </h2>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Downstream Ripple Effect</span>
          </div>

          <div style={{
            background: 'var(--bg-elevated)',
            borderRadius: '8px',
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginBottom: '0.85rem'
          }}>
            {d.delayPropagation.chain.map((node, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: i === 0 ? '#f59e0b' : i === d.delayPropagation.chain.length - 1 ? '#10b981' : 'var(--color-cyan)',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {i + 1}
                </div>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{node.entity}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{node.stage}</span>
                  <span style={{ fontWeight: 700, color: '#10b981', fontFamily: 'JetBrains Mono' }}>{node.impact}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', background: 'var(--bg-surface)', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <span>Affected Downstream Trains: <strong style={{ color: 'var(--text-primary)' }}>{d.delayPropagation.affectedTrains}</strong></span>
            <span>Additional Delay: <strong style={{ color: '#10b981' }}>+{d.delayPropagation.predictedAdditionalNetworkDelayMinutes} min</strong></span>
          </div>
        </div>
      </div>

      {/* ADVISORY DECISION LEDGER HISTORY */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck size={18} color="var(--color-cyan)" />
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
              CONTROLLER ADVISORY DECISION LEDGER (CRIS AUDIT LOG)
            </h2>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.actionHistory.length} Recorded Entries</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table-railpulse" style={{ fontSize: '0.75rem' }}>
            <thead>
              <tr>
                <th>DECISION ID</th>
                <th>TIMESTAMP</th>
                <th>TRAIN</th>
                <th>ACTION TAKEN</th>
                <th>CONTROLLER</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {d.actionHistory.map((h, idx) => (
                <tr key={idx}>
                  <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--color-cyan)', fontWeight: 700 }}>{h.decisionId}</td>
                  <td style={{ fontFamily: 'JetBrains Mono' }}>{h.timestamp}</td>
                  <td>#{h.trainB} {h.trainBName}</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-green)' }}>{h.action}</td>
                  <td>{h.controllerName}</td>
                  <td>
                    <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SAFETY & COMPLIANCE DISCLAIMER */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        <ShieldCheck size={20} color="var(--color-cyan)" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--text-secondary)' }}>Predictive Operational Decision Support:</strong> Recommended actions require authorized railway controller approval and verification. This module provides predictive decision support and does NOT directly control signals, railway points, interlocking mechanisms, or Kavach systems.
        </div>
      </div>

      {/* DETAILS MODAL */}
      {showDetailsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--color-cyan)',
            borderRadius: '12px',
            padding: '1.5rem',
            width: '90%',
            maxWidth: '650px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
              Platform & Traffic Automation Architecture Details
            </h3>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
              This module operates on continuous predictive simulation. When two trains converge on the same block section or station platform, the system compares turnout decelerations, route reservations, and schedule buffers using the Indian Railways Working Time Table (WTT) rules.
            </p>

            <div style={{ background: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              <div>• <strong>Station:</strong> {d.stationName} ({d.stationCode})</div>
              <div>• <strong>Platform 1 Throat:</strong> Occupied by #{d.conflicts[0]?.trainA.number}</div>
              <div>• <strong>Platform 2 Turnout:</strong> 30 km/h PSR Turnout to Loop Line 2 (Clear)</div>
              <div>• <strong>Delay Delta:</strong> +2 min with zero downstream ripple</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn-cyan"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
