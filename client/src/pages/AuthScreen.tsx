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
      background: 'radial-gradient(ellipse at 50% 15%, rgba(16, 185, 129, 0.14) 0%, var(--bg-surface) 60%, var(--bg-elevated) 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '1.25rem 1rem',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background Decorative Track Grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(to right, var(--border-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--border-subtle) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        opacity: 0.2,
        pointerEvents: 'none'
      }} />

      {/* Top Navbar */}
      <div className="auth-top-nav-responsive" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto 1.5rem auto',
        position: 'relative',
        zIndex: 10
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
            boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
            flexShrink: 0
          }}>
            <Radio size={22} color="#ffffff" className="animate-pulse" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                RAIL<span style={{ color: 'var(--color-green)' }}>PULSE</span>
              </span>
              <span className="badge-status badge-ai-intel" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
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
            gap: '0.4rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '0.35rem 0.85rem',
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
      <div className="auth-card-responsive" style={{
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Auth Mode Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-elevated)',
          padding: '0.25rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => { setAuthMode('LOGIN'); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: '8px',
              border: 'none',
              background: authMode === 'LOGIN' ? 'var(--color-green)' : 'transparent',
              color: authMode === 'LOGIN' ? '#000' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Passenger Login
          </button>
          <button
            onClick={() => { setAuthMode('SIGNUP'); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: '8px',
              border: 'none',
              background: authMode === 'SIGNUP' ? 'var(--color-green)' : 'transparent',
              color: authMode === 'SIGNUP' ? '#000' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            New Sign Up
          </button>
        </div>

        {/* Form Title & Subtitle */}
        <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {authMode === 'LOGIN' ? 'Welcome to RailPulse' : authMode === 'SIGNUP' ? 'Create Passenger Account' : 'Verify One-Time Password'}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {authMode === 'LOGIN'
              ? 'Access live train tracking, dynamic ETA predictions & journey weather'
              : authMode === 'SIGNUP'
              ? 'Join millions of passengers tracking Indian Railways coaching trains'
              : `Enter the 6-digit OTP sent to ${identifier}`}
          </p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '0.65rem 0.85rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#ef4444',
            fontSize: '0.75rem'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {authMode === 'SIGNUP' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>
          )}

          {authMode !== 'OTP' ? (
            <>
              {/* Method Switcher */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {loginMethod === 'MOBILE' ? 'Mobile Number' : 'Email Address'}
                </label>
                <button
                  type="button"
                  onClick={() => setLoginMethod(prev => prev === 'MOBILE' ? 'EMAIL' : 'MOBILE')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-cyan)',
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
                  <Smartphone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                ) : (
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
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
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
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
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="password"
                    required
                    placeholder="Enter account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                6-Digit Verification Code
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} color="var(--color-green)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
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
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--color-green)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontFamily: 'JetBrains Mono',
                    letterSpacing: '0.2em'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.7rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Demo Code: any 6 digits</span>
                <button
                  type="button"
                  onClick={() => setAuthMode('LOGIN')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-cyan)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Back to Password Login
                </button>
              </div>
            </div>
          )}

          {/* Remember Me */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--color-green)' }}
              />
              <span>Remember this session</span>
            </label>
            <span style={{ color: 'var(--text-muted)' }}>Forgot password?</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              padding: '0.75rem',
              fontSize: '0.9rem',
              fontWeight: 800,
              width: '100%',
              justifyContent: 'center',
              marginTop: '0.5rem',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
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
              background: 'transparent',
              border: '1px dashed var(--color-green)',
              borderRadius: '8px',
              padding: '0.6rem 1rem',
              color: 'var(--color-green)',
              fontWeight: 700,
              fontSize: '0.8rem',
              width: '100%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Train size={16} />
            <span>Instant Passenger Demo Access (1-Click)</span>
          </button>
        </div>

        {/* Controller Gate Link */}
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onOpenControllerGate}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.725rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              textDecoration: 'underline'
            }}
          >
            <ShieldAlert size={14} color="#f59e0b" />
            <span>Railway Controller / Official Operator Portal &rarr;</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="auth-footer-responsive" style={{
        maxWidth: '1200px',
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
