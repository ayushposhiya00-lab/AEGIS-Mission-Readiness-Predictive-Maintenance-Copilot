import React from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  ChevronRight,
  ShieldAlert 
} from 'lucide-react';

export default function CriticalAlertsList({ assets, onSelectAsset, onConsultCopilot }) {
  const urgentAssets = assets
    .filter((a) => a.status === 'critical' || a.status === 'watch')
    .sort((a, b) => a.predictedRUL - b.predictedRUL);

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
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--danger-subtle)',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldAlert size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              Critical Attention Needed
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Assets requiring maintenance before next scheduled sortie
            </p>
          </div>
        </div>

        <span className="badge badge-critical">
          <span className="badge-dot"></span>
          {urgentAssets.length} Assets Flagged
        </span>
      </div>

      {/* List */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px', 
        flex: 1,
        maxHeight: '440px',
        overflowY: 'auto',
        paddingRight: '6px'
      }}>
        {urgentAssets.map((asset) => {
          const isCritical = asset.status === 'critical';
          return (
            <div
              key={asset.id}
              style={{
                padding: '14px 16px',
                background: isCritical ? 'rgba(239, 68, 68, 0.04)' : 'rgba(245, 158, 11, 0.03)',
                border: '1px solid ' + (isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'),
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                transition: 'background 0.15s ease'
              }}
            >
              {/* Left Details */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className={`badge ${isCritical ? 'badge-critical' : 'badge-watch'}`}>
                    <span className="badge-dot"></span>
                    {asset.status.toUpperCase()}
                  </span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    {asset.id} &bull; {asset.name}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    ({asset.callsign})
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {asset.failureRiskDescription}
                </div>
              </div>

              {/* Right: Days to failure & Inspect button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: isCritical ? 'var(--danger)' : 'var(--warning)',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}>
                  <Clock size={15} />
                  <span>{asset.predictedRUL} days left</span>
                </div>

                <button
                  onClick={() => onSelectAsset && onSelectAsset(asset)}
                  className="btn btn-secondary btn-sm"
                >
                  <span>Inspect</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
