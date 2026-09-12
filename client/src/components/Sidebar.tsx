import React from 'react';
import {
  LayoutDashboard,
  TrainTrack,
  Map,
  BarChart3,
  TrendingUp,
  Building2,
  Bell,
  MessageSquareQuote,
  Network,
  Sliders,
  Sparkles,
  Award,
  FileCode2,
  Users,
  GitMerge,
  X,
  Radio,
  Activity
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  unacknowledgedAlerts: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  unacknowledgedAlerts,
  isMobileOpen = false,
  onCloseMobile
}) => {
  // Primary Navigation matching the reference UI directly
  const primaryNavItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, aliases: ['overview', 'dashboard'] },
    { id: 'tracking', label: 'Track Train', icon: TrainTrack, aliases: ['tracking'] },
    { id: 'tracking_map', label: 'Live Map', icon: Map, mappedTab: 'tracking', aliases: ['tracking_map', 'live_map', 'map'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, aliases: ['analytics', 'historical_analytics'] },
    { id: 'forecast', label: 'Delay Insights', icon: TrendingUp, aliases: ['forecast', 'delay_insights', 'insights'] },
    { id: 'platform_traffic', label: 'Stations', icon: Building2, aliases: ['platform_traffic', 'stations', 'platform'] },
    { id: 'alerts', label: 'Notifications', icon: Bell, badge: unacknowledgedAlerts > 0 ? `${unacknowledgedAlerts}` : null, isAlert: true, aliases: ['alerts', 'notifications', 'alert_center'] },
    { id: 'recommendations', label: 'Feedback', icon: MessageSquareQuote, aliases: ['recommendations', 'feedback', 'ai_recommendations'] }
  ];

  // Advanced Intelligence & Decision Support Tools
  const aiIntelligenceItems = [
    { id: 'propagation', label: 'Delay Propagation', icon: Network, badge: 'T-17m', aliases: ['propagation', 'delay_propagation'] },
    { id: 'simulation', label: 'What-If Simulator', icon: Sliders, badge: 'Sandbox', aliases: ['simulation', 'whatif', 'what_if'] },
    { id: 'eta', label: 'ETA Intelligence', icon: Activity, badge: 'XGBoost', aliases: ['eta', 'eta_intelligence'] },
    { id: 'congestion', label: 'Network Congestion', icon: GitMerge, aliases: ['congestion', 'network', 'network_monitoring'] },
    { id: 'performance', label: 'Model Performance', icon: Award, badge: '96.3%', aliases: ['performance', 'model_performance'] }
  ];

  // Secondary Portals
  const secondaryItems = [
    { id: 'passenger', label: 'Passenger Portal', icon: Users, aliases: ['passenger', 'passenger_portal', 'pnr'] },
    { id: 'model_docs', label: 'Architecture Docs', icon: FileCode2, aliases: ['model_docs', 'architecture', 'docs'] }
  ];

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const isItemActive = (item: { id: string; mappedTab?: string; aliases?: string[] }) => {
    if (item.aliases && item.aliases.includes(activeTab)) return true;
    if (item.mappedTab && item.mappedTab === activeTab) return true;
    return activeTab === item.id;
  };

  const renderContent = (isDrawer = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        {/* RailPulse Brand Header */}
        <div style={{
          padding: '1.25rem 1.15rem 1.15rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #00D9FF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0, 217, 255, 0.45)',
              flexShrink: 0
            }}>
              <Activity size={22} color="#06111F" strokeWidth={2.8} />
            </div>
            <div>
              <div style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                fontFamily: 'var(--font-heading)'
              }}>
                RailPulse
              </div>
              <div style={{
                fontSize: '0.675rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                letterSpacing: '0.01em'
              }}>
                Smarter Railways <br />
                <span style={{ color: 'var(--accent-cyan)' }}>Brighter Journeys</span>
              </div>
            </div>
          </div>

          {isDrawer && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Primary Navigation List */}
        <div style={{ padding: '0.85rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {primaryNavItems.map(item => {
            const Icon = item.icon;
            const targetTab = item.mappedTab || item.id;
            const isActive = isItemActive(item);

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(targetTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.6)' : '1px solid transparent',
                  background: isActive ? 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon
                    size={18}
                    color={isActive ? '#00D9FF' : 'var(--text-secondary)'}
                    strokeWidth={isActive ? 2.3 : 1.9}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '0.12rem 0.45rem',
                    borderRadius: '9999px',
                    fontWeight: 700,
                    background: item.isAlert ? 'var(--color-red)' : 'var(--badge-default-bg)',
                    color: item.isAlert ? '#ffffff' : 'var(--badge-default-text)',
                    boxShadow: item.isAlert ? '0 0 8px rgba(239, 68, 68, 0.6)' : 'none'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* AI Decision & Intelligence Section Divider */}
          <div style={{
            padding: '0.65rem 0.5rem 0.25rem 0.5rem',
            marginTop: '0.4rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.675rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)'
          }}>
            AI Operations & Sandbox
          </div>

          {aiIntelligenceItems.map(item => {
            const Icon = item.icon;
            const targetTab = item.id;
            const isActive = isItemActive(item);

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(targetTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '10px',
                  border: isActive ? '1px solid rgba(0, 217, 255, 0.5)' : '1px solid transparent',
                  background: isActive ? 'rgba(0, 217, 255, 0.12)' : 'transparent',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon
                    size={16}
                    color={isActive ? 'var(--accent-cyan)' : 'var(--text-muted)'}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span style={{
                    fontSize: '0.625rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                    fontWeight: 700,
                    background: 'rgba(0, 217, 255, 0.15)',
                    color: 'var(--accent-cyan)',
                    border: '1px solid rgba(0, 217, 255, 0.3)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Portals & Docs */}
          <div style={{
            padding: '0.5rem 0.5rem 0.2rem 0.5rem',
            marginTop: '0.3rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)'
          }}>
            Portals & Specs
          </div>

          {secondaryItems.map(item => {
            const Icon = item.icon;
            const targetTab = item.id;
            const isActive = isItemActive(item);

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(targetTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid transparent',
                  background: isActive ? 'var(--bg-panel-tertiary)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  <Icon size={15} color="var(--text-muted)" />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Sidebar Indian Railways Visual Treatment */}
      <div style={{
        margin: '0.75rem',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid var(--border-subtle)',
        minHeight: '140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '0.85rem',
        backgroundImage: 'url(/sidebar_train.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        {/* Dark Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, #06111F 30%, rgba(6, 17, 31, 0.7) 70%, rgba(6, 17, 31, 0.2) 100%)'
        }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            fontSize: '1rem',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.2,
            fontFamily: 'var(--font-heading)'
          }}>
            People move <br />
            <span style={{ color: '#00D9FF' }}>India grows</span>
          </div>

          <div style={{
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.675rem',
            color: '#cbd5e1'
          }}>
            <span style={{ fontSize: '0.9rem' }}>🇮🇳</span>
            <span>Built for a Smarter Tomorrow</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="desktop-sidebar-fixed" style={{
        width: '260px',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto'
      }}>
        {renderContent(false)}
      </aside>

      {/* Mobile Slide-Out Drawer Navigation */}
      {isMobileOpen && (
        <>
          <div className="mobile-sidebar-backdrop" onClick={onCloseMobile} />
          <aside className="mobile-sidebar-drawer">
            {renderContent(true)}
          </aside>
        </>
      )}
    </>
  );
};
