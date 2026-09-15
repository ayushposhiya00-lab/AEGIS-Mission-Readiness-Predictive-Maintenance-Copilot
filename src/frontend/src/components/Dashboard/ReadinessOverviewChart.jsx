import React from 'react';
import { BarChart3, Plane, Shield, Anchor, Target, ArrowRight } from 'lucide-react';

export default function ReadinessOverviewChart({ categories, onSelectCategory }) {
  const getIcon = (name) => {
    if (name.includes('Aircraft')) return Plane;
    if (name.includes('Armor')) return Shield;
    if (name.includes('Naval')) return Anchor;
    return Target;
  };

  return (
    <div className="pro-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        paddingBottom: '14px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--primary-subtle)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BarChart3 size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              Fleet Readiness by Combat Branch
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Real-time combat readiness rates vs. 80% operational benchmark
            </p>
          </div>
        </div>

        <span style={{
          fontSize: '0.74rem',
          color: 'var(--success)',
          fontWeight: 600,
          background: 'var(--success-subtle)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(16, 185, 129, 0.25)'
        }}>
          Benchmark: &ge; 80%
        </span>
      </div>

      {/* Category Progress Stacks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1, justifyContent: 'space-around' }}>
        {categories.map((cat) => {
          const Icon = getIcon(cat.category);
          const isOptimal = cat.rate >= 80;
          const barColor = isOptimal ? 'var(--success)' : 'var(--warning)';

          return (
            <div
              key={cat.category}
              onClick={() => onSelectCategory && onSelectCategory(cat.category)}
              style={{
                padding: '16px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Category info */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '4px',
                    background: 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)'
                  }}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {cat.category}
                    </span>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {cat.ready} of {cat.total} units deployed &bull; {cat.critical} grounded
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: barColor,
                    letterSpacing: '-0.02em'
                  }}>
                    {cat.rate}%
                  </span>
                </div>
              </div>

              {/* Progress Stack Bar */}
              <div className="progress-bar-bg" style={{ height: '8px', marginBottom: '8px' }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${cat.rate}%`,
                    background: `linear-gradient(90deg, #2563eb, ${barColor})`
                  }}
                />
              </div>

              {/* Bottom detail row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.74rem',
                color: 'var(--text-dim)'
              }}>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <span>🟢 {cat.ready} Ready</span>
                  <span>🟡 {cat.watch} Watch</span>
                  <span>🔴 {cat.critical} Critical</span>
                </div>
                <span style={{
                  color: 'var(--primary)',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  View Branch Fleet <ArrowRight size={12} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
