import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, Eye, MessageSquare, ChevronRight, PlusCircle, UploadCloud } from 'lucide-react';
import RegisterAssetModal from './RegisterAssetModal';
import UploadCsvModal from './UploadCsvModal';

export default function AssetTable({ assets, onSelectAsset, onConsultCopilot, initialFilter, onAssetAdded, onRefreshData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState((initialFilter || 'ALL').toUpperCase());
  const [sortBy, setSortBy] = useState('urgency'); // 'urgency', 'readiness', 'name'
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Sync when parent changes the filter (e.g. clicking a dashboard summary card)
  useEffect(() => {
    if (initialFilter) setStatusFilter(initialFilter.toUpperCase());
  }, [initialFilter]);

  // Filter — case-insensitive status match so 'critical' from backend matches 'CRITICAL' filter
  const filtered = assets.filter((asset) => {
    const matchSearch =
      asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.callsign.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.operationalBase.toLowerCase().includes(searchTerm.toLowerCase());

    const matchType = typeFilter === 'ALL' || asset.type === typeFilter;
    const matchStatus = statusFilter === 'ALL' || (asset.status || '').toUpperCase() === statusFilter;

    return matchSearch && matchType && matchStatus;
  });


  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'urgency') return a.predictedRUL - b.predictedRUL;
    if (sortBy === 'readiness') return a.readinessScore - b.readinessScore;
    return a.id.localeCompare(b.id);
  });

  return (
    <div className="pro-card" style={{ padding: '24px' }}>
      {/* Top Header & Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
            Fleet Asset Inventory
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Showing {sorted.length} of {assets.length} combat assets monitored in real-time
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Search box */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              placeholder="Search by ID, name, base..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                padding: '8px 12px 8px 36px',
                fontSize: '0.82rem',
                outline: 'none',
                width: '240px'
              }}
            />
          </div>

          {/* Sort selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                padding: '6px 10px',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="urgency">Urgency (Lowest RUL)</option>
              <option value="readiness">Readiness Score</option>
              <option value="name">Asset ID</option>
            </select>
          </div>

          {/* Action Buttons */}
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <PlusCircle size={14} />
            <span>Register Asset</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <UploadCloud size={14} />
            <span>Upload Telemetry CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* Type tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'Aircraft', 'Ground Armor', 'Naval', 'Air Defense'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                background: typeFilter === t ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                color: typeFilter === t ? '#ffffff' : 'var(--text-muted)',
                border: '1px solid ' + (typeFilter === t ? 'var(--primary)' : 'var(--border-subtle)'),
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {t === 'ALL' ? 'All Types' : t}
            </button>
          ))}
        </div>

        {/* Status tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'ALL', label: 'All Status' },
            { id: 'CRITICAL', label: 'Critical Non-Ready' },
            { id: 'WATCH', label: 'Watchlist' },
            { id: 'READY', label: 'Mission-Ready' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              style={{
                background: statusFilter === s.id ? 'var(--bg-surface-hover)' : 'transparent',
                color: statusFilter === s.id ? 'var(--text-main)' : 'var(--text-muted)',
                border: '1px solid ' + (statusFilter === s.id ? 'var(--border-strong)' : 'var(--border-subtle)'),
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="pro-table">
          <thead>
            <tr>
              <th>Asset ID &amp; Callsign</th>
              <th>Platform Details</th>
              <th>Branch / Type</th>
              <th>Readiness Score</th>
              <th>Predicted Failure (RUL)</th>
              <th>Operational Base</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((asset) => {
              const isCrit = asset.status === 'critical';
              const isWarn = asset.status === 'watch';
              const badgeClass = isCrit ? 'badge-critical' : isWarn ? 'badge-watch' : 'badge-ready';
              const barColor = isCrit ? 'var(--danger)' : isWarn ? 'var(--warning)' : 'var(--success)';

              return (
                <tr key={asset.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{asset.id}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        [{asset.callsign}]
                      </span>
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{asset.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{asset.crewAssigned}</div>
                  </td>

                  <td>
                    <span style={{ color: 'var(--text-muted)' }}>{asset.type}</span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="progress-bar-bg" style={{ width: '80px', height: '6px' }}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${asset.readinessScore}%`,
                            background: barColor
                          }}
                        />
                      </div>
                      <span className={`badge ${badgeClass}`}>
                        <span className="badge-dot"></span>
                        {asset.readinessScore}%
                      </span>
                    </div>
                  </td>

                  <td>
                    <span style={{
                      fontWeight: 600,
                      color: isCrit ? 'var(--danger)' : isWarn ? 'var(--warning)' : 'var(--text-main)'
                    }}>
                      {asset.predictedRUL} days
                    </span>
                  </td>

                  <td>
                    <span style={{ color: 'var(--text-muted)' }}>{asset.operationalBase}</span>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => onConsultCopilot && onConsultCopilot(asset)}
                        className="btn btn-ghost btn-sm"
                        title="Analyze with Copilot"
                      >
                        <MessageSquare size={13} />
                        <span>Copilot</span>
                      </button>

                      <button
                        onClick={() => onSelectAsset && onSelectAsset(asset)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Eye size={13} />
                        <span>View Details</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Dynamic Asset Registration Modal */}
      <RegisterAssetModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onAssetRegistered={(newAsset) => {
          if (onAssetAdded) onAssetAdded(newAsset);
        }}
      />

      {/* High-Speed Batch CSV Telemetry Ingestion Modal */}
      <UploadCsvModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onBatchUploaded={() => {
          if (onRefreshData) onRefreshData();
        }}
      />
    </div>
  );
}
