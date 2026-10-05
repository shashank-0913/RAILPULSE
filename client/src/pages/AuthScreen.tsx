import React, { useState } from 'react';
import {
  Radio,
  Search,
  Train as TrainIcon,
  ShieldCheck,
  ShieldAlert,
  Users,
  ArrowRight,
  Sparkles,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Activity,
  Navigation,
  Clock,
  RefreshCw,
  Building2
} from 'lucide-react';
import { VerifiedUser } from '../types';
import { api } from '../services/api';

interface AuthScreenProps {
  onLoginSuccess: (user: VerifiedUser, role: 'PASSENGER' | 'CONTROLLER') => void;
  onQuickPassengerLogin: (trainId?: string) => void;
  onOpenControllerGate: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onQuickPassengerLogin,
  theme,
  onToggleTheme
}) => {
  // Search state
  const [trainQuery, setTrainQuery] = useState('');
  
  // Controller Auth state
  const [employeeId, setEmployeeId] = useState('IR-VSKP-8821');
  const [password, setPassword] = useState('controller2026');
  const [otpStep, setOtpStep] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Preset Handlers
  const handleSelectPreset = (empId: string) => {
    setEmployeeId(empId);
    setPassword('controller2026');
    setErrorMsg(null);
    setOtpStep(false);
  };

  // 1-Click Passenger Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trainQuery.trim();
    if (clean) {
      onQuickPassengerLogin(clean);
    } else {
      onQuickPassengerLogin('12864');
    }
  };

  // 1-Click Controller Demo Login
  const handleOneClickControllerDemo = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.demoLoginController();
      if (res.success && res.user) {
        onLoginSuccess(res.user, 'CONTROLLER');
      } else {
        setErrorMsg('Failed to initialize demo controller session.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Controller Credentials Submit -> Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setErrorMsg('Please enter an Employee ID');
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.loginController(employeeId, password);
      if (res.success && res.otp_required) {
        setSessionId(res.session_id || `SESS-${Date.now()}`);
        setDemoOtp(res.demo_otp || '749201');
        setEnteredOtp(res.demo_otp || '749201'); // pre-fill for convenience
        setOtpStep(true);
      } else {
        setErrorMsg(res.error || 'Failed to authenticate controller credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to authentication service.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP -> Receive Signed JWT
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredOtp.trim()) {
      setErrorMsg('Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.verifyControllerOtp(sessionId, employeeId, enteredOtp);
      if (res.success && res.user) {
        onLoginSuccess(res.user, 'CONTROLLER');
      } else {
        setErrorMsg(res.error || 'Invalid OTP code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(ellipse at 50% 12%, rgba(0, 242, 254, 0.12) 0%, rgba(16, 185, 129, 0.08) 35%, var(--bg-base) 80%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '1.5rem 1rem',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background Decorative Ambient Track Grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(to right, var(--border-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--border-subtle) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        opacity: 0.3,
        pointerEvents: 'none'
      }} />

      {/* Top Navbar */}
      <div className="auth-top-nav-responsive" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1240px',
        width: '100%',
        margin: '0 auto 1.5rem auto',
        position: 'relative',
        zIndex: 10,
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
              <span className="font-heading gradient-rail-text" style={{ fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
                RailPulse
              </span>
              <span className="badge-status badge-ai-intel" style={{ fontSize: '0.7rem', padding: '0.15rem 0.55rem' }}>
                SIH26028 • Team Ignites
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Dynamic Train ETA & Delay Intelligence Platform • Ministry of Railways
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Quick 1-Click Entry Buttons in Nav */}
          <button
            onClick={() => onQuickPassengerLogin('12864')}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', gap: '0.45rem' }}
          >
            <Users size={15} color="var(--accent-cyan)" />
            <span>Try as Passenger</span>
          </button>

          <button
            onClick={handleOneClickControllerDemo}
            disabled={loading}
            className="btn-cyan"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', gap: '0.45rem' }}
          >
            <ShieldCheck size={15} />
            <span>Try as Controller (Demo)</span>
          </button>

          <button
            onClick={onToggleTheme}
            className="btn-theme-toggle"
            style={{ fontSize: '0.75rem' }}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', maxWidth: '840px', marginBottom: '2.25rem' }}>
          <div className="badge-status badge-ai-intel" style={{ marginBottom: '1rem', padding: '0.35rem 1rem', fontSize: '0.8rem', gap: '0.5rem' }}>
            <Sparkles size={14} color="var(--accent-cyan)" />
            <span>SMART INDIA HACKATHON 2026 • PROBLEM STATEMENT SIH26028</span>
          </div>

          <h1 className="font-heading" style={{
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1.18,
            marginBottom: '0.85rem'
          }}>
            Dynamic Forecast of <span className="gradient-rail-text">Expected Time of Arrival (ETA)</span> for Coaching Trains
          </h1>

          <p style={{
            fontSize: 'clamp(0.9rem, 1.8vw, 1.05rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '1.75rem'
          }}>
            Event-driven machine learning forecasting powered by 15 live telemetry, sectional congestion, historical delay, and Open-Meteo weather parameters. Pilot Corridor: <strong>Visakhapatnam (VSKP)</strong>.
          </p>

          {/* Passenger Instant Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-glass-elevated)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(0, 242, 254, 0.4)',
              borderRadius: '16px',
              padding: '0.4rem 0.5rem 0.4rem 1.25rem',
              maxWidth: '650px',
              width: '100%',
              margin: '0 auto 1rem auto',
              boxShadow: '0 8px 30px rgba(0, 242, 254, 0.15)'
            }}
          >
            <Search size={20} color="var(--accent-cyan)" style={{ flexShrink: 0, marginRight: '0.75rem' }} />
            <input
              type="text"
              placeholder="Search Train Number (e.g. 12864, 12723, 20805) or 10-digit PNR..."
              value={trainQuery}
              onChange={(e) => setTrainQuery(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              className="btn-cyan"
              style={{
                padding: '0.65rem 1.25rem',
                fontSize: '0.875rem',
                borderRadius: '11px',
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              <span>Track Live ETA</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Search Suggestion Chips */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 600 }}>Quick Demos:</span>
            <button
              type="button"
              onClick={() => onQuickPassengerLogin('12864')}
              style={{ background: 'var(--bg-panel-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '0.2rem 0.65rem', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              🚆 12864 Howrah SF Express (VSKP)
            </button>
            <button
              type="button"
              onClick={() => onQuickPassengerLogin('12723')}
              style={{ background: 'var(--bg-panel-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '0.2rem 0.65rem', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              ⚡ 12723 Telangana Express
            </button>
            <button
              type="button"
              onClick={() => onQuickPassengerLogin('20805')}
              style={{ background: 'var(--bg-panel-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '0.2rem 0.65rem', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              🚄 20805 AP Express / Vande Bharat
            </button>
          </div>
        </div>

        {/* 2 Main Entry Cards: Passenger (Open) vs Controller (2FA / Demo) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.75rem',
          width: '100%',
          maxWidth: '1060px'
        }}>
          {/* Card 1: PUBLIC PASSENGER PORTAL */}
          <div className="glass-card glass-glow-cyan" style={{
            padding: '2rem',
            borderRadius: '20px',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(56, 189, 248, 0.3) 100%)',
                  border: '1px solid var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(0, 242, 254, 0.25)'
                }}>
                  <Users size={26} color="var(--accent-cyan)" />
                </div>
                <span className="badge-status badge-ai-intel" style={{ fontSize: '0.725rem', padding: '0.3rem 0.75rem' }}>
                  PUBLIC ACCESS • NO LOGIN
                </span>
              </div>

              <h2 className="font-heading" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Passenger Portal
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '1rem' }}>
                Instant Dynamic ETA, Confidence Bands & Plain-English Explanations
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Navigation size={16} color="var(--accent-cyan)" />
                  <span><strong>Dynamic Station ETA:</strong> Downstream arrival times with ±3m confidence bands</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Zap size={16} color="var(--accent-cyan)" />
                  <span><strong>"Why Am I Delayed?":</strong> Plain-English SHAP attribution factors</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Activity size={16} color="var(--accent-cyan)" />
                  <span><strong>Live GPS Radar:</strong> Real-time track location, speed & weather</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Clock size={16} color="var(--accent-cyan)" />
                  <span><strong>Offline PNR Support:</strong> Cached dead-reckoning journey pack</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onQuickPassengerLogin('12864')}
              className="btn-cyan"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 700
              }}
            >
              <span>Launch Passenger ETA Portal</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Card 2: RAILWAY CONTROLLER / STATION STAFF */}
          <div className="glass-card glass-glow-emerald" style={{
            padding: '2rem',
            borderRadius: '20px',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.3) 100%)',
                  border: '1px solid var(--color-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)'
                }}>
                  <ShieldAlert size={26} color="var(--color-green)" />
                </div>
                <span className="badge-status badge-on-time" style={{ fontSize: '0.725rem', padding: '0.3rem 0.75rem' }}>
                  2FA OTP + JWT SECURED
                </span>
              </div>

              <h2 className="font-heading" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Section Controller Portal
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-green)', fontWeight: 600, marginBottom: '1rem' }}>
                Operations Dashboard, What-If Simulator & Cascade Graph
              </p>

              {errorMsg && (
                <div style={{
                  background: 'rgba(244, 63, 94, 0.14)',
                  border: '1px solid var(--color-red)',
                  borderRadius: '10px',
                  padding: '0.6rem 0.8rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--color-red)',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Step 1: Credentials Form */}
              {!otpStep ? (
                <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                      Employee ID (IR Personnel)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Building2 size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                      <input
                        type="text"
                        required
                        placeholder="e.g. IR-VSKP-8821"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem 0.8rem 0.6rem 2.4rem', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem 0.8rem 0.6rem 2.4rem', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {/* Evaluator Presets */}
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: 600 }}>Quick Presets: </span>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('IR-VSKP-8821')}
                      style={{ background: 'none', border: 'none', color: 'var(--color-green)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.72rem', padding: 0, marginRight: '0.5rem' }}
                    >
                      VSKP Controller
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('IR-BZA-4412')}
                      style={{ background: 'none', border: 'none', color: 'var(--color-green)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.72rem', padding: 0 }}
                    >
                      BZA Controller
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-emerald"
                      style={{ flex: 1, justifyContent: 'center', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 700 }}
                    >
                      {loading ? <RefreshCw className="animate-spin" size={16} /> : <span>Send 2FA OTP</span>}
                    </button>

                    <button
                      type="button"
                      onClick={handleOneClickControllerDemo}
                      disabled={loading}
                      className="btn-secondary"
                      title="Instant 1-click access for SIH evaluators"
                      style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700 }}
                    >
                      ⚡ Quick Demo
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: 2FA OTP Step */
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Demo OTP Box */}
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1.5px dashed #f59e0b',
                    borderRadius: '12px',
                    padding: '0.85rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.725rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      DEMO 2FA OTP GENERATED (BACKEND)
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f59e0b', letterSpacing: '0.25em', margin: '0.35rem 0', fontFamily: 'JetBrains Mono, monospace' }}>
                      {demoOtp || '749201'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      In production, sent via CRIS Railway SMS Gateway.
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                      Enter 6-Digit OTP
                    </label>
                    <div style={{ position: 'relative' }}>
                      <KeyRound size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem 0.8rem 0.6rem 2.4rem', fontSize: '1rem', letterSpacing: '0.15em', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.35rem' }}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-emerald"
                      style={{ flex: 1, justifyContent: 'center', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 700 }}
                    >
                      {loading ? <RefreshCw className="animate-spin" size={16} /> : <span>Verify & Issue JWT</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpStep(false)}
                      className="btn-secondary"
                      style={{ padding: '0.75rem 0.9rem', fontSize: '0.8rem' }}
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              <span>Role: Section Dispatch Controller</span>
              <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>Division: Waltair (VSKP)</span>
            </div>
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
        zIndex: 10,
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>Smart India Hackathon 2026 • Problem Statement: SIH26028</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span>Team: Ignites (Team ID 144678)</span>
          <span>•</span>
          <span>Ministry of Railways</span>
          <span>•</span>
          <span>CRIS</span>
        </div>
      </div>
    </div>
  );
};
