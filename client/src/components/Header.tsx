import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Clock,
  ShieldCheck,
  Play,
  RefreshCw,
  LogOut,
  Sun,
  Moon,
  Menu,
  ChevronDown,
  Train as TrainIcon,
  Activity,
  Users
} from 'lucide-react';
import { VerifiedUser, SystemAlert, Train } from '../types';
import { api } from '../services/api';

interface HeaderProps {
  user: VerifiedUser | null;
  onLogout: () => void;
  onStartDemo: () => void;
  onSelectTab: (tab: string, trainId?: string) => void;
  activeAlertCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSwitchRole?: () => void;
  onToggleMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onStartDemo,
  onSelectTab,
  activeAlertCount,
  theme,
  onToggleTheme,
  onSwitchRole,
  onToggleMobileNav
}) => {
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [formattedTime, setFormattedTime] = useState<string>('');
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isTickLoading, setIsTickLoading] = useState(false);
  const [tickMessage, setTickMessage] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [trainsList, setTrainsList] = useState<Train[]>([]);
  const [mode, setMode] = useState<'LIVE' | 'DEMO'>('LIVE');

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const timeStr = now.toLocaleTimeString('en-IN', {
        hour12: true,
        hour: 'numeric',
        minute: '2-digit'
      });
      setFormattedDate(dateStr);
      setFormattedTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch trains list for search autocomplete
  useEffect(() => {
    const loadTrains = async () => {
      const res = await api.getTrains();
      if (res.success && res.trains) {
        setTrainsList(res.trains);
      }
    };
    loadTrains();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      setTickMessage('Dynamic ETA updated! Telemetry stream refreshed.');
      setTimeout(() => setTickMessage(null), 3500);
    } finally {
      setIsTickLoading(false);
    }
  };

  const handleSelectTrainFromSearch = (trainId: string) => {
    setSearchQuery('');
    setIsSearchFocused(false);
    onSelectTab('tracking', trainId);
  };

  const filteredTrains = searchQuery.trim()
    ? trainsList.filter(
        t =>
          t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.destination.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // User initials & display names
  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'PG';

  const userDisplayName = user?.fullName ? user.fullName.split(' ')[0] : 'Pavan';
  const userTeamName = user?.role || 'Team RailPulse';

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
      {/* Left: Mobile Nav Toggle + Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1', maxWidth: '520px' }}>
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="mobile-nav-toggle-btn"
            title="Open Menu"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Search train by number or name */}
        <div ref={searchContainerRef} style={{ position: 'relative', width: '100%' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--input-bg)',
            border: `1px solid ${isSearchFocused ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
            borderRadius: '10px',
            padding: '0.45rem 0.85rem',
            gap: '0.65rem',
            transition: 'all 0.2s ease',
            boxShadow: isSearchFocused ? '0 0 0 2px rgba(0, 217, 255, 0.2)' : 'none'
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search train by number or name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                width: '100%',
                outline: 'none',
                boxShadow: 'none'
              }}
            />
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && filteredTrains.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: 'var(--modal-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '0.5rem',
              boxShadow: 'var(--card-shadow)',
              zIndex: 100,
              maxHeight: '280px',
              overflowY: 'auto'
            }}>
              {filteredTrains.map(train => (
                <div
                  key={train.id}
                  onClick={() => handleSelectTrainFromSearch(train.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <TrainIcon size={16} color="var(--accent-cyan)" />
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        #{train.id}
                      </span>{' '}
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {train.name}
                      </span>
                    </div>
                  </div>
                  <span className={`badge-status ${train.status === 'ON_TIME' ? 'badge-on-time' : 'badge-moderate-delay'}`} style={{ fontSize: '0.65rem' }}>
                    {train.status === 'ON_TIME' ? 'On Time' : `+${train.currentDelayMin}m`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Header Status, Date/Time, User Avatar & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Live Data Status Indicator Pill matching reference */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          background: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '9999px',
          padding: '0.25rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--color-green)'
        }}>
          <span className="radar-live-dot" />
          <span>Live Data</span>
        </div>

        {/* Live Date and Time */}
        <div className="header-hide-on-tablet" style={{
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-mono)'
        }}>
          <span>{formattedDate}</span>
          <span style={{ margin: '0 0.35rem', color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formattedTime}</span>
        </div>

        {/* Telemetry Trigger & SIH Demo Buttons */}
        <button
          onClick={handleTriggerTick}
          disabled={isTickLoading}
          className="btn-secondary header-hide-on-tablet"
          style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
          title="Simulate GPS movement and dynamic ETA recalculation"
        >
          <RefreshCw size={14} className={isTickLoading ? 'animate-spin' : ''} color="var(--accent-cyan)" />
          <span>Simulate Tick</span>
        </button>

        <button
          onClick={onStartDemo}
          className="btn-primary header-hide-on-tablet"
          style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
        >
          <Play size={13} fill="#ffffff" />
          <span>SIH Demo</span>
        </button>

        {/* Notifications Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowAlertsDropdown(!showAlertsDropdown);
              if (!showAlertsDropdown) loadAlerts();
            }}
            style={{
              background: 'var(--bg-panel-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'border-color 0.2s ease'
            }}
            title="Intelligence Alerts"
          >
            <Bell size={18} color={activeAlertCount > 0 ? 'var(--color-red)' : 'var(--text-secondary)'} />
            {activeAlertCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--color-red)',
                color: '#ffffff',
                fontSize: '0.625rem',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.7)'
              }}>
                {activeAlertCount}
              </span>
            )}
          </button>

          {/* Alerts Dropdown Modal */}
          {showAlertsDropdown && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: 0,
              width: '360px',
              background: 'var(--modal-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '1rem',
              boxShadow: 'var(--card-shadow)',
              zIndex: 100
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  Active Operational Alerts
                </div>
                <button
                  onClick={() => {
                    setShowAlertsDropdown(false);
                    onSelectTab('alerts');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  View All &rarr;
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '260px', overflowY: 'auto' }}>
                {alerts.slice(0, 3).map(a => (
                  <div key={a.id} style={{
                    background: 'var(--bg-panel-secondary)',
                    borderLeft: `3px solid ${a.severity === 'RED' ? 'var(--color-red)' : a.severity === 'ORANGE' ? 'var(--color-orange)' : 'var(--color-yellow)'}`,
                    padding: '0.55rem 0.75rem',
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
        </div>

        {/* User Profile Avatar with Initials & Dropdown */}
        <div ref={profileDropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'var(--bg-panel-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '0.35rem 0.65rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Round Avatar with Initials */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
            }}>
              {userInitials}
            </div>

            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {userDisplayName}
              </div>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                {userTeamName}
              </div>
            </div>

            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '240px',
              background: 'var(--modal-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '0.75rem',
              boxShadow: 'var(--card-shadow)',
              zIndex: 100
            }}>
              <div style={{
                padding: '0.4rem 0.5rem 0.65rem 0.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '0.5rem'
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {user?.fullName || 'Pavan'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {user ? `${user.idType}: ${user.maskedId}` : 'CONTROLLER-VERIFIED'}
                </div>
              </div>

              {onSwitchRole && (
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    onSwitchRole();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Users size={14} color="var(--accent-cyan)" />
                  <span>Switch Role / Portal</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowProfileDropdown(false);
                  onToggleTheme();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {theme === 'dark' ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} color="#8b5cf6" />}
                <span>Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
              </button>

              <button
                onClick={() => {
                  setShowProfileDropdown(false);
                  onLogout();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  marginTop: '0.35rem',
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-red)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <LogOut size={14} color="var(--color-red)" />
                <span>Log Out / Re-verify</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Status Notification Toast */}
      {tickMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#06111F',
          border: '1px solid var(--accent-cyan)',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          fontSize: '0.825rem',
          fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.7)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <Activity size={16} color="var(--accent-cyan)" />
          {tickMessage}
        </div>
      )}
    </header>
  );
};
