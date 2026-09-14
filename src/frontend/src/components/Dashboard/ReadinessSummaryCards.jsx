import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Layers, 
  TrendingUp, 
  ArrowRight 
} from 'lucide-react';

export default function ReadinessSummaryCards({ metrics, onFilterStatus }) {
  const cards = [
    {
      id: 'total',
      title: 'Total Tracked Assets',
      value: metrics.totalAssets,
      subtext: '100% telemetry synced',
      icon: Layers,
      color: '#3b82f6',
      status: 'all',
      badge: 'Active Fleet'
    },
    {
      id: 'ready',
      title: 'Mission-Ready Assets',
      value: metrics.missionReady,
      percentage: metrics.readyPercentage,
      subtext: `${metrics.readyPercentage}% combat ready`,
      icon: CheckCircle2,
      color: '#10b981',
      status: 'ready',
      trend: '+2.4%',
      badge: 'Operational'
    },
    {
      id: 'watch',
      title: 'Telemetry Watchlist',
      value: metrics.watchAlerts,
      percentage: metrics.watchPercentage,
      subtext: `${metrics.watchPercentage}% scheduled check`,
      icon: AlertTriangle,
      color: '#f59e0b',
      status: 'watch',
      badge: 'Advisory'
    },
    {
      id: 'critical',
      title: 'Critical Non-Ready',
      value: metrics.criticalNonReady,
      percentage: metrics.criticalPercentage,
      subtext: `${metrics.criticalPercentage}% urgent service`,
      icon: AlertCircle,
      color: '#ef4444',
      status: 'critical',
      badge: 'Grounded'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '20px',
      marginBottom: '28px'
    }}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="pro-card"
            onClick={() => onFilterStatus && onFilterStatus(card.status)}
            style={{
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {card.title}
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: `${card.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: card.color
              }}>
                <Icon size={18} />
              </div>
            </div>

            {/* Middle row: Big metric */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
              <span style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                letterSpacing: '-0.02em',
                lineHeight: 1
              }}>
                {card.value}
              </span>

              {card.trend && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontSize: '0.75rem',
                  color: 'var(--success)',
                  fontWeight: 600
                }}>
                  <TrendingUp size={13} /> {card.trend}
                </span>
              )}
            </div>

            {/* Progress bar if percentage exists */}
            {card.percentage && (
              <div className="progress-bar-bg" style={{ marginBottom: '10px' }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${card.percentage}%`,
                    background: card.color
                  }}
                />
              </div>
            )}

            {/* Bottom row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--text-dim)'
            }}>
              <span>{card.subtext}</span>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                color: 'var(--primary)',
                fontWeight: 500
              }}>
                View <ArrowRight size={12} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
