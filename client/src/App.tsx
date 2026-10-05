import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SIHDemoModal } from './components/SIHDemoModal';
import { AuthScreen } from './pages/AuthScreen';
import { PassengerDashboard } from './pages/PassengerDashboard';

import { OverviewDashboard } from './pages/OverviewDashboard';
import { PlatformTrafficAutomation } from './pages/PlatformTrafficAutomation';
import { LiveTrainTracking } from './pages/LiveTrainTracking';
import { ETAIntelligence } from './pages/ETAIntelligence';
import { DelayForecast } from './pages/DelayForecast';
import { NetworkCongestion } from './pages/NetworkCongestion';
import { DelayPropagation } from './pages/DelayPropagation';
import { WhatIfSimulation } from './pages/WhatIfSimulation';
import { AIRecommendations } from './pages/AIRecommendations';
import { HistoricalAnalytics } from './pages/HistoricalAnalytics';
import { AlertsCenter } from './pages/AlertsCenter';
import { ModelPerformance } from './pages/ModelPerformance';
import { ModelArchitecture } from './pages/ModelArchitecture';
import { PassengerPortal } from './pages/PassengerPortal';
import { StationDisplayBoard } from './pages/StationDisplayBoard';

import { VerifiedUser } from './types';
import { api, DOCS_URL } from './services/api';
import { RefreshCw, AlertTriangle, CheckCircle2, Radio, Server, ArrowRight, Zap, ExternalLink } from 'lucide-react';

export const App: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'PASSENGER' | 'CONTROLLER' | null>(() => {
    return (localStorage.getItem('railpulse_selected_role') as 'PASSENGER' | 'CONTROLLER' | null) || null;
  });

  const [user, setUser] = useState<VerifiedUser | null>(() => {
    const saved = localStorage.getItem('railpulse_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (window.location.pathname.startsWith('/board')) {
      return 'board';
    }
    return 'overview';
  });

  const [boardStationCode, setBoardStationCode] = useState<string>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/board')) {
      const parts = path.split('/');
      return parts[2] ? parts[2].toUpperCase() : 'VSKP';
    }
    return 'VSKP';
  });

  const [isBoardRoute, setIsBoardRoute] = useState<boolean>(() => {
    return window.location.pathname.startsWith('/board');
  });

  const [selectedTrainId, setSelectedTrainId] = useState<string>('12864');
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [unacknowledgedAlerts, setUnacknowledgedAlerts] = useState<number>(3);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('railpulse_theme') as 'dark' | 'light') || 'dark';
  });

  // Render backend cold-start & health check state
  const [serverState, setServerState] = useState<'CHECKING' | 'WAKING_UP' | 'ONLINE' | 'OFFLINE_DEMO'>('CHECKING');
  const [wakeUpElapsedSec, setWakeUpElapsedSec] = useState<number>(0);
  const [hasDismissedWakeUp, setHasDismissedWakeUp] = useState<boolean>(false);
  const wakeUpTimerRef = useRef<any>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('railpulse_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Health check & Render cold-start waking up engine
  const checkBackendHealth = async () => {
    try {
      const health = await api.getHealth();
      if (health.status === 'HEALTHY' || health.model_loaded) {
        setServerState('ONLINE');
        if (wakeUpTimerRef.current) clearInterval(wakeUpTimerRef.current);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    let attempts = 0;
    let seconds = 0;

    const startWakeUpFlow = async () => {
      const isHealthy = await checkBackendHealth();
      if (isHealthy) return;

      // Start waking up sequence
      setServerState('WAKING_UP');
      
      wakeUpTimerRef.current = setInterval(async () => {
        seconds += 1;
        setWakeUpElapsedSec(seconds);

        // Retry check every 5 seconds
        if (seconds % 5 === 0) {
          attempts += 1;
          const healthy = await checkBackendHealth();
          if (healthy) {
            clearInterval(wakeUpTimerRef.current);
            return;
          }
        }

        // After 60 seconds, fallback to offline demo mode
        if (seconds >= 60) {
          clearInterval(wakeUpTimerRef.current);
          setServerState('OFFLINE_DEMO');
        }
      }, 1000);
    };

    startWakeUpFlow();

    return () => {
      if (wakeUpTimerRef.current) clearInterval(wakeUpTimerRef.current);
    };
  }, []);

  const handleManualRetryHealth = async () => {
    setServerState('CHECKING');
    setWakeUpElapsedSec(0);
    const healthy = await checkBackendHealth();
    if (!healthy) {
      setServerState('WAKING_UP');
    }
  };

  const handleSelectRole = (role: 'PASSENGER' | 'CONTROLLER', trainId?: string) => {
    setSelectedRole(role);
    localStorage.setItem('railpulse_selected_role', role);
    if (trainId) {
      setSelectedTrainId(trainId);
    }
  };

  const handleSwitchRole = () => {
    setSelectedRole(null);
    localStorage.removeItem('railpulse_selected_role');
  };

  useEffect(() => {
    if (selectedRole === 'CONTROLLER') {
      const updateAlerts = async () => {
        const res = await api.getAlerts();
        if (res.success && res.summary) {
          setUnacknowledgedAlerts(res.summary.unacknowledged || 0);
        }
      };
      updateAlerts();
      const interval = setInterval(updateAlerts, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedRole]);

  const handleLogout = () => {
    api.logoutController();
    setUser(null);
    setSelectedRole(null);
  };

  const handleNavigateTab = (tab: string, trainId?: string) => {
    setActiveTab(tab);
    setIsMobileNavOpen(false);
    if (trainId) {
      setSelectedTrainId(trainId);
    }
  };

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      {/* 0. Render Cold-Start Server Wakeup Overlay (Non-blocking: can dismiss or skip) */}
      {serverState === 'WAKING_UP' && !hasDismissedWakeUp && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 9999,
          background: 'var(--bg-glass-elevated)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid #f59e0b',
          borderRadius: '16px',
          padding: '1.15rem 1.25rem',
          maxWidth: '420px',
          boxShadow: '0 10px 35px rgba(245, 158, 11, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <RefreshCw size={20} color="#f59e0b" className="animate-spin" />
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Waking up the RailPulse prediction server...
            </div>
          </div>
          
          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            Render free-tier servers spin down after idle periods. Booting Python FastAPI & loading the XGBoost model (~{Math.max(0, 50 - wakeUpElapsedSec)}s remaining).
          </p>

          {/* Progress Bar */}
          <div style={{ height: '6px', background: 'var(--border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, (wakeUpElapsedSec / 50) * 100)}%`,
              background: 'linear-gradient(90deg, #f59e0b 0%, #10b981 100%)',
              transition: 'width 1s linear'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem' }}>
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>Elapsed: {wakeUpElapsedSec}s / 50s</span>
            <button
              onClick={() => setHasDismissedWakeUp(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-cyan)',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              Skip & Use Demo Simulation
            </button>
          </div>
        </div>
      )}

      {/* 0b. Offline Fallback Status Banner (Shown if server could not be reached) */}
      {serverState === 'OFFLINE_DEMO' && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(239, 68, 68, 0.15) 100%)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.35)',
          padding: '0.4rem 1rem',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          position: 'relative',
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
            <AlertTriangle size={15} />
            <span>
              <strong>Offline Demo Mode Active:</strong> High-fidelity local simulation running. Live backend server is sleeping.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleManualRetryHealth}
              style={{
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid #f59e0b',
                color: '#f59e0b',
                borderRadius: '6px',
                padding: '0.2rem 0.55rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <RefreshCw size={12} />
              <span>Retry Server Connection</span>
            </button>
          </div>
        </div>
      )}

      {/* 0c. Public Station Display Board Route (/board or /board/:stationCode) */}
      {isBoardRoute && (
        <StationDisplayBoard
          initialStationCode={boardStationCode}
          onNavigateTab={handleNavigateTab}
        />
      )}

      {/* 1. Landing & Authentication Screen */}
      {!isBoardRoute && selectedRole === null && (
        <AuthScreen
          onLoginSuccess={(verifiedUser, role) => {
            setUser(verifiedUser);
            localStorage.setItem('railpulse_user', JSON.stringify(verifiedUser));
            handleSelectRole(role);
          }}
          onQuickPassengerLogin={(trainId?: string) => {
            const guestPassenger: VerifiedUser = {
              sessionId: `SESS-${Date.now()}`,
              idType: 'PASSENGER_GUEST',
              maskedId: '98765XXXXX',
              fullName: 'Passenger User',
              role: 'Verified Passenger',
              clearanceLevel: 'LEVEL_1_PASSENGER',
              verifiedAt: new Date().toISOString(),
              securityAuditStamp: 'GUEST-PASSENGER-ACTIVE'
            };
            setUser(guestPassenger);
            handleSelectRole('PASSENGER', trainId || '12864');
          }}
          onOpenControllerGate={() => {
            handleSelectRole('CONTROLLER');
          }}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* 2. Role = PASSENGER: Dedicated User-First Passenger Dashboard (Public, No Login Required) */}
      {!isBoardRoute && selectedRole === 'PASSENGER' && (
        <PassengerDashboard
          user={user}
          onLogout={handleLogout}
          onOpenControllerGate={() => handleSelectRole('CONTROLLER')}
          onSwitchRole={handleSwitchRole}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* 3. Role = RAILWAY CONTROLLER (Not authenticated): Show Controller 2FA Login */}
      {!isBoardRoute && selectedRole === 'CONTROLLER' && !user?.role?.includes('Controller') && (
        <AuthScreen
          onLoginSuccess={(verifiedUser, role) => {
            setUser(verifiedUser);
            localStorage.setItem('railpulse_user', JSON.stringify(verifiedUser));
            handleSelectRole(role);
          }}
          onQuickPassengerLogin={(trainId?: string) => {
            handleSelectRole('PASSENGER', trainId);
          }}
          onOpenControllerGate={() => {
            handleSelectRole('CONTROLLER');
          }}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* 4. Role = RAILWAY CONTROLLER (Authenticated): Network Control HUD */}
      {!isBoardRoute && selectedRole === 'CONTROLLER' && user && user.role.includes('Controller') && (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh' }}>
          {/* Top Header */}
          <Header
            user={user}
            onLogout={handleLogout}
            onStartDemo={() => setIsDemoActive(true)}
            onSelectTab={handleNavigateTab}
            activeAlertCount={unacknowledgedAlerts}
            theme={theme}
            onToggleTheme={toggleTheme}
            onSwitchRole={handleSwitchRole}
            onToggleMobileNav={() => setIsMobileNavOpen(prev => !prev)}
          />

          {/* Interactive SIH Demo Walkthrough Banner */}
          {isDemoActive && (
            <SIHDemoModal
              onClose={() => setIsDemoActive(false)}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {/* Body with Controller Operations Sidebar & Main Views */}
          <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
            <Sidebar
              activeTab={activeTab}
              onSelectTab={handleNavigateTab}
              unacknowledgedAlerts={unacknowledgedAlerts}
              isMobileOpen={isMobileNavOpen}
              onCloseMobile={() => setIsMobileNavOpen(false)}
            />

            <main className="main-content">
              {(activeTab === 'overview' || activeTab === 'dashboard') && (
                <OverviewDashboard onNavigateTab={handleNavigateTab} />
              )}
              {(activeTab === 'board' || activeTab === 'station_board' || activeTab === 'station_display') && (
                <StationDisplayBoard
                  initialStationCode={boardStationCode}
                  onNavigateTab={handleNavigateTab}
                />
              )}
              {(activeTab === 'platform_traffic' || activeTab === 'stations' || activeTab === 'platform') && (
                <PlatformTrafficAutomation user={user} onNavigateTab={handleNavigateTab} />
              )}
              {(activeTab === 'tracking' || activeTab === 'tracking_map' || activeTab === 'live_map' || activeTab === 'map') && (
                <LiveTrainTracking
                  selectedTrainId={selectedTrainId}
                  onNavigateTab={handleNavigateTab}
                />
              )}
              {(activeTab === 'eta' || activeTab === 'eta_intelligence') && (
                <ETAIntelligence selectedTrainId={selectedTrainId} />
              )}
              {(activeTab === 'forecast' || activeTab === 'delay_insights' || activeTab === 'insights') && (
                <DelayForecast selectedTrainId={selectedTrainId} />
              )}
              {(activeTab === 'congestion' || activeTab === 'network' || activeTab === 'network_monitoring') && (
                <NetworkCongestion onNavigateTab={handleNavigateTab} />
              )}
              {(activeTab === 'propagation' || activeTab === 'delay_propagation') && (
                <DelayPropagation onNavigateTab={handleNavigateTab} />
              )}
              {(activeTab === 'simulation' || activeTab === 'whatif' || activeTab === 'what_if') && (
                <WhatIfSimulation onNavigateTab={handleNavigateTab} />
              )}
              {(activeTab === 'recommendations' || activeTab === 'feedback' || activeTab === 'ai_recommendations') && (
                <AIRecommendations user={user} />
              )}
              {(activeTab === 'performance' || activeTab === 'model_performance') && (
                <ModelPerformance />
              )}
              {(activeTab === 'analytics' || activeTab === 'historical_analytics') && (
                <HistoricalAnalytics />
              )}
              {(activeTab === 'alerts' || activeTab === 'notifications' || activeTab === 'alert_center') && (
                <AlertsCenter onNavigateTab={handleNavigateTab} />
              )}
              {(activeTab === 'model_docs' || activeTab === 'architecture' || activeTab === 'docs') && (
                <ModelArchitecture />
              )}
              {(activeTab === 'passenger' || activeTab === 'passenger_portal' || activeTab === 'pnr') && (
                <PassengerPortal />
              )}

              {/* Fallback ensuring unknown tabs NEVER result in a blank page */}
              {![
                'overview', 'dashboard',
                'platform_traffic', 'stations', 'platform',
                'tracking', 'tracking_map', 'live_map', 'map',
                'eta', 'eta_intelligence',
                'forecast', 'delay_insights', 'insights',
                'congestion', 'network', 'network_monitoring',
                'propagation', 'delay_propagation',
                'simulation', 'whatif', 'what_if',
                'recommendations', 'feedback', 'ai_recommendations',
                'performance', 'model_performance',
                'analytics', 'historical_analytics',
                'alerts', 'notifications', 'alert_center',
                'model_docs', 'architecture', 'docs',
                'passenger', 'passenger_portal', 'pnr'
              ].includes(activeTab) && (
                <OverviewDashboard onNavigateTab={handleNavigateTab} />
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
