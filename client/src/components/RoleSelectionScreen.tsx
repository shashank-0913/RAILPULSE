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
      background: 'radial-gradient(ellipse at 50% 15%, rgba(0, 242, 254, 0.12) 0%, rgba(16, 185, 129, 0.08) 35%, var(--bg-base) 80%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '2rem 1.5rem',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background Decorative Ambient Grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(to right, var(--border-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--border-subtle) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        opacity: 0.3,
        pointerEvents: 'none'
      }} />

      {/* Top Navbar in Selection Portal */}
      <div className="auth-top-nav-responsive" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 10,
        maxWidth: '1240px',
        width: '100%',
        margin: '0 auto 1.5rem auto',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #00f2fe 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.45)',
            flexShrink: 0
          }}>
            <Radio size={24} color="#030712" strokeWidth={2.6} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="font-heading gradient-rail-text" style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
                RailPulse
              </span>
              <span className="badge-status badge-ai-intel" style={{ fontSize: '0.7rem', padding: '0.15rem 0.55rem' }}>
                SIH 2026 • SIH26028
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              AI-Powered Dynamic Train ETA & Delay Intelligence Platform
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'var(--bg-glass-elevated)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9999px',
            padding: '0.35rem 0.9rem',
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
        <div className="badge-status badge-ai-intel" style={{ marginBottom: '1.25rem', padding: '0.4rem 1.15rem', fontSize: '0.825rem', gap: '0.5rem' }}>
          <Sparkles size={15} color="var(--accent-cyan)" /> SELECT OPERATIONAL ROLE
        </div>

        <h1 className="font-heading" style={{
          fontSize: 'clamp(2rem, 4.5vw, 2.75rem)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          color: 'var(--text-primary)',
          marginBottom: '0.75rem',
          lineHeight: 1.15
        }}>
          Welcome to <span className="gradient-rail-text">RailPulse AI</span>
        </h1>

        <p style={{
          fontSize: 'clamp(0.9rem, 2vw, 1.05rem)',
          color: 'var(--text-secondary)',
          maxWidth: '700px',
          marginBottom: '2.5rem',
          lineHeight: 1.6
        }}>
          Predictive dynamic arrival forecasting, root-cause delay explainability, network congestion heatmaps, and automated dispatch intelligence for Indian Railways.
        </p>

        {/* 2 Role Selection Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.75rem',
          width: '100%',
          textAlign: 'left'
        }}>
          {/* Card 1: PASSENGER */}
          <div
            onClick={() => onSelectRole('PASSENGER')}
            className="glass-card glass-card-interactive glass-glow-cyan"
            style={{
              padding: '2.25rem 2rem',
              borderRadius: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              border: '1px solid rgba(0, 242, 254, 0.3)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(56, 189, 248, 0.3) 100%)',
                  border: '1px solid var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(0, 242, 254, 0.3)'
                }}>
                  <Users size={28} color="var(--accent-cyan)" />
                </div>
                <span className="badge-status badge-ai-intel" style={{ fontSize: '0.725rem', padding: '0.3rem 0.8rem' }}>
                  PUBLIC ACCESS • NO LOGIN
                </span>
              </div>

              <h2 className="font-heading" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Passenger Portal
              </h2>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '1rem' }}>
                "Track your journey & dynamic ETA"
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.55 }}>
                A streamlined, mobile-first journey companion answering: <em>Where is my train, when will I reach, and why is it delayed?</em>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Navigation size={16} color="var(--accent-cyan)" />
                  <span><strong>Dynamic AI ETA:</strong> Station-by-station arrival forecasts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Zap size={16} color="var(--accent-cyan)" />
                  <span><strong>"Why Am I Delayed?":</strong> Plain-English explainable factors</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Activity size={16} color="var(--accent-cyan)" />
                  <span><strong>Live GPS Radar:</strong> Real-time track speed & stop progression</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Clock size={16} color="var(--accent-cyan)" />
                  <span><strong>Offline PWA Engine:</strong> Cached trip manifests & delays</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-cyan"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 700
              }}
            >
              <span>Continue as Passenger</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Card 2: RAILWAY CONTROLLER / OPERATOR */}
          <div
            onClick={() => onSelectRole('CONTROLLER')}
            className="glass-card glass-card-interactive glass-glow-emerald"
            style={{
              padding: '2.25rem 2rem',
              borderRadius: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              border: '1px solid rgba(16, 185, 129, 0.35)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
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
                <span className="badge-status badge-on-time" style={{ fontSize: '0.725rem', padding: '0.3rem 0.8rem' }}>
                  OFFICIAL ACCESS • SECURE GATE
                </span>
              </div>

              <h2 className="font-heading" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Section Controller
              </h2>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-green)', marginBottom: '1rem' }}>
                "Network-wide dispatch & recovery sandbox"
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.55 }}>
                A full-scale railway operational command center with real-time propagation graphs, sandbox what-if simulations, and precedence decision support.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <ShieldCheck size={16} color="var(--color-green)" />
                  <span><strong>2FA OTP & Signed JWT:</strong> Verified railway controller session</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--color-green)' }}>
                  <Layers size={16} color="var(--color-green)" />
                  <span><strong>Multi-Train Radar:</strong> Full corridor GIS tracking & speed profiles</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--color-green)' }}>
                  <AlertTriangle size={16} color="var(--color-green)" />
                  <span><strong>Propagation Ripple Graph:</strong> Downstream bottleneck prediction</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--color-green)' }}>
                  <Sparkles size={16} color="var(--color-green)" />
                  <span><strong>What-If Sandbox:</strong> Interactive delay simulation & resolution</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-emerald"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 700
              }}
            >
              <span>Authenticate & Enter Controller HUD</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="auth-footer-responsive" style={{
        maxWidth: '1240px',
        width: '100%',
        margin: '2rem auto 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '1rem',
        position: 'relative',
        zIndex: 10
      }}>
        <div>Smart India Hackathon 2026 • Problem Statement: SIH26028</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span>Ministry of Railways</span>
          <span>•</span>
          <span>Centre for Railway Information Systems (CRIS)</span>
        </div>
      </div>
    </div>
  );
};
