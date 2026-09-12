import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SecurityGateModal } from './components/SecurityGateModal';
import { SIHDemoModal } from './components/SIHDemoModal';
import { RoleSelectionScreen } from './components/RoleSelectionScreen';
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

import { VerifiedUser } from './types';
import { api } from './services/api';

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

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedTrainId, setSelectedTrainId] = useState<string>('12864');
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [unacknowledgedAlerts, setUnacknowledgedAlerts] = useState<number>(3);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('railpulse_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('railpulse_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSelectRole = (role: 'PASSENGER' | 'CONTROLLER') => {
    setSelectedRole(role);
    localStorage.setItem('railpulse_selected_role', role);
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

  const handleVerified = (verifiedUser: VerifiedUser) => {
    setUser(verifiedUser);
    localStorage.setItem('railpulse_user', JSON.stringify(verifiedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('railpulse_user');
    setSelectedRole(null);
    localStorage.removeItem('railpulse_selected_role');
  };

  const handleNavigateTab = (tab: string, trainId?: string) => {
    setActiveTab(tab);
    setIsMobileNavOpen(false);
    if (trainId) {
      setSelectedTrainId(trainId);
    }
  };

  return (
    <div className="app-container">
      {/* 1. First Screen: User Login / Sign Up */}
      {selectedRole === null && (
        <AuthScreen
          onLoginSuccess={(verifiedUser, role) => {
            setUser(verifiedUser);
            handleSelectRole(role);
          }}
          onQuickPassengerLogin={() => {
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
            handleSelectRole('PASSENGER');
          }}
          onOpenControllerGate={() => {
            handleSelectRole('CONTROLLER');
          }}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* 2. Role = PASSENGER: Dedicated User-First Passenger Dashboard */}
      {selectedRole === 'PASSENGER' && (
        <PassengerDashboard
          user={user}
          onLogout={handleLogout}
          onOpenControllerGate={() => handleSelectRole('CONTROLLER')}
          onSwitchRole={handleSwitchRole}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* 3. Role = RAILWAY CONTROLLER: Requires Official Security Clearance */}
      {selectedRole === 'CONTROLLER' && !user?.role?.includes('Controller') && (
        <SecurityGateModal
          onVerified={handleVerified}
          onCancel={handleSwitchRole}
        />
      )}

      {/* 4. Role = RAILWAY CONTROLLER (Authenticated): Network Control HUD */}
      {selectedRole === 'CONTROLLER' && user && (
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
