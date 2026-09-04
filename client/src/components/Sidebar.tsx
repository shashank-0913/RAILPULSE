import React from 'react';
import {
  LayoutDashboard,
  TrainTrack,
  Cpu,
  TrendingUp,
  GitBranch,
  Network,
  Sliders,
  AlertTriangle,
  BarChart3,
  Users,
  FileCode2,
  Sparkles,
  Award,
  GitMerge
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  unacknowledgedAlerts: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  unacknowledgedAlerts
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview HUD', icon: LayoutDashboard, badge: null },
    { id: 'platform_traffic', label: 'Platform & Traffic Automation', icon: GitMerge, badge: '🚦 Conflict Alert', highlight: true },
    { id: 'tracking', label: 'Live Trains & Map', icon: TrainTrack, badge: '12 Live' },
    { id: 'eta', label: 'ETA Intelligence', icon: Cpu, badge: 'XGBoost', highlight: true },
    { id: 'forecast', label: 'Delay Forecast', icon: TrendingUp, badge: null },
    { id: 'congestion', label: 'Network Monitoring', icon: GitBranch, badge: '3 High' },
    { id: 'propagation', label: 'Delay Propagation', icon: Network, badge: 'T-17m', highlight: true },
    { id: 'simulation', label: 'What-If Simulator', icon: Sliders, badge: 'Scenarios', highlight: true },
    { id: 'recommendations', label: 'AI Recommendations', icon: Sparkles, badge: '3 Active', highlight: true },
    { id: 'alerts', label: 'Alert Center', icon: AlertTriangle, badge: unacknowledgedAlerts > 0 ? `${unacknowledgedAlerts}` : null, isAlert: true },
    { id: 'analytics', label: 'Historical Analytics', icon: BarChart3, badge: null },
    { id: 'performance', label: 'Model Performance', icon: Award, badge: '88.6%' }
  ];

  const secondaryItems = [
    { id: 'passenger', label: 'Passenger PNR Portal', icon: Users, badge: 'PNR + Offline' },
    { id: 'model_docs', label: 'Architecture & CRIS Docs', icon: FileCode2, badge: 'Spec' }
  ];

  return (
    <aside style={{
      width: '260px',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      padding: '1.25rem 0.75rem',
      transition: 'background-color 0.25s ease, border-color 0.25s ease'
    }}>
      <div style={{ padding: '0 0.75rem 0.85rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.65rem' }}>
        <div style={{ fontSize: '0.675rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
          CONTROL OPERATIONS
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1, overflowY: 'auto' }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: isActive ? '1px solid var(--color-green)' : '1px solid transparent',
                background: isActive ? 'var(--color-green-glow)' : 'transparent',
                color: isActive ? 'var(--color-green)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Icon size={16} color={isActive ? 'var(--color-green)' : item.highlight ? 'var(--color-cyan)' : 'var(--text-muted)'} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span style={{
                  fontSize: '0.625rem',
                  padding: '0.12rem 0.4rem',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  background: item.isAlert ? 'var(--color-red)' : item.highlight ? 'var(--color-cyan-glow)' : 'var(--badge-default-bg)',
                  color: item.isAlert ? '#ffffff' : item.highlight ? 'var(--color-cyan)' : 'var(--badge-default-text)'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div style={{ padding: '0.75rem 0.75rem 0.35rem 0.75rem', marginTop: '0.4rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.675rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
            PORTALS & SPECIFICATION
          </div>
        </div>

        {secondaryItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: isActive ? '1px solid var(--color-cyan)' : '1px solid transparent',
                background: isActive ? 'var(--color-cyan-glow)' : 'transparent',
                color: isActive ? 'var(--color-cyan)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Icon size={16} color={isActive ? 'var(--color-cyan)' : 'var(--text-muted)'} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span style={{
                  fontSize: '0.625rem',
                  padding: '0.12rem 0.4rem',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  background: 'var(--badge-default-bg)',
                  color: 'var(--badge-default-text)'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{
        marginTop: 'auto',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '0.65rem',
        fontSize: '0.7rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>MODEL MAE</span>
          <span style={{ color: 'var(--color-green)', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>3.8 min</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>ACCURACY (±5m)</span>
          <span style={{ color: 'var(--color-cyan)', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>88.6%</span>
        </div>
      </div>
    </aside>
  );
};
