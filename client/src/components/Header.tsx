import React, { useState, useEffect } from 'react';
import { Activity, Bell, Clock, ShieldCheck, Play, RefreshCw, Radio, LogOut, Sun, Moon } from 'lucide-react';
import { VerifiedUser, SystemAlert } from '../types';
import { api } from '../services/api';

import { DataSourceStatus } from './DataSourceStatus';

interface HeaderProps {
  user: VerifiedUser | null;
  onLogout: () => void;
  onStartDemo: () => void;
  onSelectTab: (tab: string) => void;
  activeAlertCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSwitchRole?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onStartDemo,
  onSelectTab,
  activeAlertCount,
  theme,
  onToggleTheme,
  onSwitchRole
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [utcTime, setUtcTime] = useState<string>('');
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isTickLoading, setIsTickLoading] = useState(false);
  const [tickMessage, setTickMessage] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const istStr = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const utcStr = now.toLocaleTimeString('en-GB', {
        timeZone: 'UTC',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      setCurrentTime(`${istStr} IST`);
      setUtcTime(`${utcStr} UTC`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    const res = await api.getAlerts();
    if (res.success) {
      setAlerts(res.alerts);
    }
  };

  const handleTriggerTick = async () => {
    setIsTickLoading(true);
    try {
      await api.triggerTelemetryTick();
      setTickMessage('Dynamic ETA recalculated! Telemetry updated.');
      setTimeout(() => setTickMessage(null), 3500);
    } finally {
      setIsTickLoading(false);
    }
  };

  return (
    <header style={{
      background: 'var(--header-bg)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: 'var(--card-shadow)'
    }}>
      {/* Brand & Platform Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #10b981 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
          }}>
            <Radio size={20} color="#ffffff" className="animate-pulse" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                RAIL<span style={{ color: 'var(--color-green)' }}>PULSE</span>
              </span>
              <span className="badge-status badge-ai-intel" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                AI INTELLIGENCE v2.5
              </span>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.02em' }}>
              Dynamic Train ETA & Delay Intelligence Platform | SIH26028
            </p>
          </div>
        </div>

        {/* Data Quality Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '9999px',
          padding: '0.25rem 0.75rem',
          fontSize: '0.725rem'
        }}>
          <span className="radar-live-dot"></span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>DATA QUALITY:</span>
          <span style={{ color: 'var(--color-green)', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>EXCELLENT (96.4%)</span>
        </div>

        {/* Real-time External Services & Fallback Status HUD */}
        <DataSourceStatus />
      </div>

      {/* Center Live Mode / Demo Mode Switcher, Clock & Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Live Mode vs Demo Mode Switch */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '2px'
        }}>
          <button
            onClick={() => {
              const ev = new CustomEvent('railpulse:setMode', { detail: 'LIVE' });
              window.dispatchEvent(ev);
            }}
            id="btn-live-mode"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.725rem',
              fontWeight: 700,
              border: 'none',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              cursor: 'pointer'
            }}
            title="Query real RailRadar API when API key is set"
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} className="animate-pulse"></span>
            LIVE MODE
          </button>
          <button
            onClick={() => {
              const ev = new CustomEvent('railpulse:setMode', { detail: 'DEMO' });
              window.dispatchEvent(ev);
            }}
            id="btn-demo-mode"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.725rem',
              fontWeight: 700,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
            title="Simulated high-fidelity telemetry for SIH offline presentation"
          >
            DEMO MODE
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '0.35rem 0.8rem',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          <Clock size={15} color="var(--color-cyan)" />
          <span style={{ color: 'var(--color-cyan)', fontWeight: 700, fontSize: '0.85rem' }}>{currentTime}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>| {utcTime}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="btn-theme-toggle"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={15} color="#f59e0b" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={15} color="#8b5cf6" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        <button
          onClick={handleTriggerTick}
          disabled={isTickLoading}
          className="btn-secondary"
          title="Simulate live GPS movement and trigger dynamic ETA recalculation"
          style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
        >
          <RefreshCw size={14} className={isTickLoading ? 'animate-spin' : ''} color="var(--color-green)" />
          <span>Simulate Telemetry Tick</span>
        </button>

        <button
          onClick={onStartDemo}
          className="btn-primary"
          style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
        >
          <Play size={14} />
          <span>Start SIH 14-Step Demo</span>
        </button>
      </div>

      {/* Right User & Alerts Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
        <button
          onClick={() => {
            setShowAlertsDropdown(!showAlertsDropdown);
            if (!showAlertsDropdown) loadAlerts();
          }}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <Bell size={18} color={activeAlertCount > 0 ? 'var(--color-red)' : 'var(--text-muted)'} />
          {activeAlertCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'var(--color-red)',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 800,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
            }}>
              {activeAlertCount}
            </span>
          )}
        </button>

        {showAlertsDropdown && (
          <div style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            width: '380px',
            background: 'var(--modal-bg)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1rem',
            boxShadow: 'var(--card-shadow)',
            zIndex: 100
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Active Intelligence Alerts</div>
              <button
                onClick={() => { setShowAlertsDropdown(false); onSelectTab('alerts'); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-cyan)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                View All Alerts &rarr;
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
              {alerts.slice(0, 3).map(a => (
                <div key={a.id} style={{
                  background: 'var(--bg-elevated)',
                  borderLeft: `4px solid ${a.severity === 'RED' ? 'var(--color-red)' : a.severity === 'ORANGE' ? 'var(--color-orange)' : 'var(--color-yellow)'}`,
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0 8px 8px 0',
                  fontSize: '0.75rem'
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{a.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{a.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {onSwitchRole && (
          <button
            onClick={onSwitchRole}
            className="btn-secondary"
            style={{ fontSize: '0.725rem', padding: '0.35rem 0.65rem' }}
            title="Switch to Passenger Mode or Role Portal"
          >
            <span>Switch Role</span>
          </button>
        )}

        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '0.35rem 0.75rem'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'var(--color-green-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={16} color="var(--color-green)" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.fullName.split(' ')[0]}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-green)', fontFamily: 'JetBrains Mono' }}>{user.idType}: {user.maskedId}</div>
            </div>
            <button
              onClick={onLogout}
              title="Change ID / Re-verify"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>

      {tickMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#065f46',
          border: '1px solid #10b981',
          color: '#ecfdf5',
          padding: '0.75rem 1.25rem',
          borderRadius: '8px',
          fontSize: '0.825rem',
          fontWeight: 600,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Activity size={16} />
          {tickMessage}
        </div>
      )}
    </header>
  );
};
