import React from 'react';
import { 
  ShieldCheck, 
  Layers, 
  Wrench, 
  MessageSquare, 
  Bell, 
  Search, 
  BarChart3, 
  User,
  Settings
} from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab, criticalCount, onOpenChat, isBackendLive, liveStreamConnected }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'assets', label: 'Fleet Assets', icon: Layers },
    { id: 'maintenance', label: 'Maintenance Plan', icon: Wrench },
  ];

  return (
    <header style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: '1480px',
        margin: '0 auto',
        padding: '0 32px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Left: Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div 
            onClick={() => setCurrentTab('dashboard')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              cursor: 'pointer' 
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                letterSpacing: '-0.01em',
              }}>
                Mission Readiness Copilot
              </div>
              <div style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
              }}>
                Defense Predictive Intelligence Platform
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', gap: '4px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                    border: '1px solid ' + (isActive ? 'var(--border-medium)' : 'transparent'),
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={16} color={isActive ? 'var(--primary)' : 'currentColor'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions, Copilot trigger, Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* System status pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            background: liveStreamConnected ? 'rgba(16, 185, 129, 0.12)' : (isBackendLive ? 'var(--success-subtle)' : 'rgba(245, 158, 11, 0.12)'),
            borderRadius: 'var(--radius-full)',
            border: `1px solid ${liveStreamConnected ? 'rgba(16, 185, 129, 0.4)' : (isBackendLive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.3)')}`,
            fontSize: '0.75rem',
            color: liveStreamConnected ? '#34d399' : (isBackendLive ? '#34d399' : '#fbbf24'),
            fontWeight: 600,
            letterSpacing: '0.02em'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: liveStreamConnected ? '#10b981' : (isBackendLive ? 'var(--success)' : '#f59e0b'),
              boxShadow: liveStreamConnected ? '0 0 8px #10b981' : 'none'
            }}></span>
            <span>{liveStreamConnected ? '🟢 LIVE IOT STREAM (2.0s)' : (isBackendLive ? '🟢 Live ML Backend (:8000)' : '🟡 Telemetry Active (Local)')}</span>
          </div>

          {/* Ask Copilot Button */}
          <button
            onClick={onOpenChat}
            className="btn btn-primary btn-sm"
          >
            <MessageSquare size={14} />
            <span>Ask Copilot</span>
          </button>

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-ghost btn-sm" 
              style={{ padding: '8px', borderRadius: '50%' }}
              title="Notifications"
            >
              <Bell size={18} />
              {criticalCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--danger)',
                }}></span>
              )}
            </button>
          </div>
          
          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            
            <div style={{ display: 'none', md: 'block' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', lineHeight: 1.2 }}>
                Ops Commander
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                HQ Logistics Wing
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
