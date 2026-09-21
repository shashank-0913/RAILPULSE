import React, { useState } from 'react';
import {
  Radio,
  Train,
  ShieldCheck,
  Smartphone,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  KeyRound,
  User,
  ShieldAlert,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { VerifiedUser } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: VerifiedUser, role: 'PASSENGER' | 'CONTROLLER') => void;
  onQuickPassengerLogin: () => void;
  onOpenControllerGate: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onQuickPassengerLogin,
  onOpenControllerGate,
  theme,
  onToggleTheme
}) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'OTP'>('LOGIN');
  const [loginMethod, setLoginMethod] = useState<'MOBILE' | 'EMAIL'>('MOBILE');
  
  // Form fields
  const [identifier, setIdentifier] = useState('9876543210');
  const [password, setPassword] = useState('railpulse2026');
  const [fullName, setFullName] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = () => {
    if (!identifier || identifier.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number or email address');
      return;
    }
    setErrorMsg(null);
    setOtpSent(true);
    setAuthMode('OTP');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      setLoading(false);
      const passengerUser: VerifiedUser = {
        sessionId: `SESS-${Date.now()}`,
        idType: 'PASSENGER_AUTH',
        maskedId: identifier.includes('@') ? identifier : `XXXXXX${identifier.slice(-4)}`,
        fullName: fullName || (identifier.includes('@') ? identifier.split('@')[0] : 'Passenger User'),
        role: 'Verified Passenger',
        clearanceLevel: 'LEVEL_1_PASSENGER',
        verifiedAt: new Date().toISOString(),
        securityAuditStamp: 'PASSENGER-AUTH-TOKEN-VALID'
      };

      if (rememberMe) {
        localStorage.setItem('railpulse_passenger_auth', JSON.stringify(passengerUser));
      }

      onLoginSuccess(passengerUser, 'PASSENGER');
    }, 600);
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
        opacity: 0.35,
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
        zIndex: 10
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
                RAILPULSE
              </span>
              <span className="badge-status badge-ai-intel" style={{ fontSize: '0.7rem', padding: '0.15rem 0.55rem' }}>
                SIH26028
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Live Train Tracking & Dynamic AI ETA Platform • Ministry of Railways
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="header-hide-on-tablet" style={{
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
            <span>Real-time RailRadar Live Telemetry</span>
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

      {/* Main Authentication Card */}
      <div className="auth-card-responsive glass-card" style={{
        maxWidth: '490px',
        width: '100%',
        margin: '0 auto',
        padding: '2.25rem 2rem',
        boxShadow: 'var(--card-shadow-hover)',
        position: 'relative',
        zIndex: 10,
        borderRadius: '20px',
        border: '1px solid var(--border-medium)'
      }}>
        {/* Auth Mode Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-panel-tertiary)',
          padding: '0.3rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => { setAuthMode('LOGIN'); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '9px',
              border: 'none',
              background: authMode === 'LOGIN' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: authMode === 'LOGIN' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.825rem',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: authMode === 'LOGIN' ? '0 2px 10px rgba(16, 185, 129, 0.4)' : 'none'
            }}
          >
            Passenger Login
          </button>
          <button
            onClick={() => { setAuthMode('SIGNUP'); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '9px',
              border: 'none',
              background: authMode === 'SIGNUP' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: authMode === 'SIGNUP' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.825rem',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: authMode === 'SIGNUP' ? '0 2px 10px rgba(16, 185, 129, 0.4)' : 'none'
            }}
          >
            New Sign Up
          </button>
        </div>

        {/* Form Title & Subtitle */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h2 className="font-heading" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {authMode === 'LOGIN' ? 'Welcome to RailPulse' : authMode === 'SIGNUP' ? 'Create Passenger Account' : 'Verify One-Time Password'}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.45 }}>
            {authMode === 'LOGIN'
              ? 'Access live train tracking, dynamic ETA predictions & journey weather'
              : authMode === 'SIGNUP'
              ? 'Join millions of passengers tracking Indian Railways coaching trains'
              : `Enter the 6-digit OTP sent to ${identifier}`}
          </p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.14)',
            border: '1px solid var(--color-red)',
            borderRadius: '10px',
            padding: '0.65rem 0.85rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--color-red)',
            fontSize: '0.75rem',
            fontWeight: 600
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {authMode === 'SIGNUP' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>
          )}

          {authMode !== 'OTP' ? (
            <>
              {/* Method Switcher */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {loginMethod === 'MOBILE' ? 'Mobile Number' : 'Email Address'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setLoginMethod(prev => prev === 'MOBILE' ? 'EMAIL' : 'MOBILE')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Use {loginMethod === 'MOBILE' ? 'Email instead' : 'Mobile Number instead'}
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  {loginMethod === 'MOBILE' ? (
                    <Smartphone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  ) : (
                    <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  )}
                  <input
                    type={loginMethod === 'MOBILE' ? 'tel' : 'email'}
                    required
                    placeholder={loginMethod === 'MOBILE' ? '10-digit mobile number' : 'name@example.com'}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-green)',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Login via OTP instead &rarr;
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type="password"
                    required
                    placeholder="Enter account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                6-Digit Verification Code
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} color="var(--color-green)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="Enter 6-digit OTP (e.g. 482910)"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    border: '1px solid var(--color-green)',
                    fontSize: '1rem',
                    fontFamily: 'JetBrains Mono',
                    letterSpacing: '0.2em'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.45rem', fontSize: '0.7rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Demo Code: any 6 digits</span>
                <button
                  type="button"
                  onClick={() => setAuthMode('LOGIN')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Back to Password Login
                </button>
              </div>
            </div>
          )}

          {/* Remember Me */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--color-green)' }}
              />
              <span>Remember this session</span>
            </label>
            <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Forgot password?</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-emerald"
            style={{
              padding: '0.8rem',
              fontSize: '0.9rem',
              fontWeight: 800,
              width: '100%',
              justifyContent: 'center',
              marginTop: '0.5rem'
            }}
          >
            <span>{loading ? 'Authenticating...' : authMode === 'SIGNUP' ? 'Create Passenger Account &rarr;' : 'Enter Passenger Dashboard &rarr;'}</span>
          </button>
        </form>

        {/* Quick Instant Entry Option */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onQuickPassengerLogin}
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px dashed rgba(16, 185, 129, 0.5)',
              borderRadius: '10px',
              padding: '0.65rem 1rem',
              color: 'var(--color-green)',
              fontWeight: 700,
              fontSize: '0.8rem',
              width: '100%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.16)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)')}
          >
            <Train size={16} />
            <span>Instant Passenger Demo Access (1-Click)</span>
          </button>
        </div>

        {/* Controller Gate Link */}
        <div style={{ marginTop: '1.1rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onOpenControllerGate}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-yellow)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <ShieldAlert size={14} color="var(--color-yellow)" />
            <span>Railway Controller / Official Operator Portal &rarr;</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="auth-footer-responsive" style={{
        maxWidth: '1240px',
        width: '100%',
        margin: '1.5rem auto 0 auto',
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
        <div>Smart India Hackathon 2026 • Ministry of Railways Problem Statement SIH26028</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span>Indian Railways Coaching Operations</span>
          <span>•</span>
          <span>CRIS Interoperable Protocol</span>
        </div>
      </div>
    </div>
  );
};
