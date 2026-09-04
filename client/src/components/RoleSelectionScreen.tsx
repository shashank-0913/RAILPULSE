import React from 'react';
import { Radio, Users, ShieldAlert, Sparkles, Navigation, Activity, ArrowRight, ShieldCheck, Clock, Layers, AlertTriangle, Zap } from 'lucide-react';

interface RoleSelectionScreenProps {
  onSelectRole: (role: 'PASSENGER' | 'CONTROLLER') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({
  onSelectRole,
  theme,
  onToggleTheme
}) => {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(ellipse at 50% 20%, rgba(16, 185, 129, 0.12) 0%, var(--bg-surface) 60%, var(--bg-elevated) 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '2rem 1.5rem',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background Decorative Grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(to right, var(--border-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--border-subtle) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        opacity: 0.25,
        pointerEvents: 'none'
      }} />

      {/* Top Navbar in Selection Portal */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 10,
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto 1.5rem auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)'
          }}>
            <Radio size={22} color="#ffffff" className="animate-pulse" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                RAIL<span style={{ color: 'var(--color-green)' }}>PULSE</span>
              </span>
              <span className="badge-status badge-ai-intel" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                SIH 2026 • SIH26028
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              AI-Powered Dynamic Train ETA & Delay Intelligence Platform
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '0.35rem 0.85rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)'
          }}>
            <span className="radar-live-dot"></span>
            <span>Ministry of Railways • Live Telemetry Active</span>
          </div>

          <button
            onClick={onToggleTheme}
            className="btn-theme-toggle"
            style={{ fontSize: '0.75rem' }}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>

      {/* Main Role Selection Area */}
      <div style={{
        maxWidth: '1100px',
        width: '100%',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <div className="badge-status badge-ai-intel" style={{ marginBottom: '1rem', padding: '0.35rem 1rem', fontSize: '0.8rem', gap: '0.5rem' }}>
          <Sparkles size={14} color="var(--color-cyan)" /> SELECT YOUR OPERATIONAL ROLE
        </div>

        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          color: 'var(--text-primary)',
          marginBottom: '0.75rem',
          lineHeight: 1.15
        }}>
          Welcome to <span style={{ color: 'var(--color-green)' }}>RailPulse AI</span>
        </h1>

        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary)',
          maxWidth: '680px',
          marginBottom: '2.5rem',
          lineHeight: 1.5
        }}>
          Predictive dynamic arrival forecasting, root-cause delay explainability, network congestion heatmaps, and automated dispatch intelligence for Indian Railways.
        </p>

        {/* 2 Big Role Selection Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '2rem',
          width: '100%',
          textAlign: 'left'
        }}>
          {/* Card 1: PASSENGER */}
          <div
            onClick={() => onSelectRole('PASSENGER')}
            className="control-card control-card-glow-cyan"
            style={{
              padding: '2rem',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              background: 'var(--card-bg)',
              border: '2px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.borderColor = 'var(--color-cyan)';
              e.currentTarget.style.boxShadow = '0 20px 40px -15px rgba(6, 182, 212, 0.35)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
              e.currentTarget.style.boxShadow = 'var(--card-shadow)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(14, 165, 233, 0.3) 100%)',
                  border: '1px solid var(--color-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)'
                }}>
                  <Users size={28} color="var(--color-cyan)" />
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  color: 'var(--color-cyan)',
                  border: '1px solid rgba(6, 182, 212, 0.3)'
                }}>
                  PUBLIC ACCESS • NO LOGIN REQUIRED
                </span>
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Passenger
              </h2>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-cyan)', marginBottom: '1rem' }}>
                "Track your journey & dynamic ETA"
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                A streamlined, mobile-first journey companion answering: <em>Where is my train, when will I reach, and why is it delayed?</em>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                  <Navigation size={16} color="var(--color-cyan)" />
                  <span><strong>Dynamic AI ETA:</strong> Live station-by-station arrival forecasts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                  <Zap size={16} color="var(--color-cyan)" />
                  <span><strong>"Why Am I Delayed?":</strong> Plain-English explainable factors</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                  <Activity size={16} color="var(--color-cyan)" />
                  <span><strong>Single-Train Map:</strong> Isolated GPS telemetry & stop timeline</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                  <Clock size={16} color="var(--color-cyan)" />
                  <span><strong>Future Delay Forecast:</strong> +30m, +60m & destination arrival</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.9rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                borderColor: 'var(--color-cyan)'
              }}
            >
              <span>Continue as Passenger</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Card 2: RAILWAY CONTROLLER / OPERATOR */}
          <div
            onClick={() => onSelectRole('CONTROLLER')}
            className="control-card control-card-glow-green"
            style={{
              padding: '2rem',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              background: 'var(--card-bg)',
              border: '2px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.borderColor = 'var(--color-green)';
              e.currentTarget.style.boxShadow = '0 20px 40px -15px rgba(16, 185, 129, 0.35)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.35)';
              e.currentTarget.style.boxShadow = 'var(--card-shadow)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.3) 100%)',
                  border: '1px solid var(--color-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
                }}>
                  <ShieldAlert size={28} color="var(--color-green)" />
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--color-green)',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  🔒 RESTRICTED • GOVT ID REQUIRED
                </span>
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Railway Controller / Operator
              </h2>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-green)', marginBottom: '1rem' }}>
                "Monitor & optimize the railway network"
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                A dense, high-frequency operations center answering: <em>What is happening across the network, what will cascade next, and what action recovers time?</em>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                  <Layers size={16} color="var(--color-green)" />
                  <span><strong>Network Overview HUD:</strong> Multi-train telemetry & corridor heatmaps</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.825rem', color: 'var(--color-green)' }}>
                  <AlertTriangle size={16} color="var(--color-green)" />
                  <span><strong>Delay Propagation:</strong> Downstream ripple effects & knock-on trees</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.825rem', color: 'var(--color-green)' }}>
                  <Zap size={16} color="var(--color-green)" />
                  <span><strong>What-If Simulator:</strong> Multi-scenario disruption & recovery models</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.825rem', color: 'var(--color-green)' }}>
                  <ShieldCheck size={16} color="var(--color-green)" />
                  <span><strong>AI Dispatch Recommendations:</strong> Human-in-the-loop action ledger</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.9rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderColor: 'var(--color-green)'
              }}
            >
              <span>Access Control Room (Official Gate)</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
        fontSize: '0.775rem',
        color: 'var(--text-muted)',
        marginTop: '2rem',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1100px',
        width: '100%',
        margin: '2rem auto 0 auto'
      }}>
        <div>Smart India Hackathon 2026 • Problem Statement SIH26028</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>RailRadar API Active</span>
          <span>•</span>
          <span>XGBoost + LightGBM + Graph Neural Network</span>
        </div>
      </div>
    </div>
  );
};
