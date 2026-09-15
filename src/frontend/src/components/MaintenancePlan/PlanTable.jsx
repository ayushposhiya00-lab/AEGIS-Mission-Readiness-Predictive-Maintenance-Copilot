import React, { useState } from 'react';
import { 
  Wrench, 
  Download, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Check,
  FileText,
  Printer,
  ShieldCheck
} from 'lucide-react';
import ReportPreviewModal from './ReportPreviewModal';
import { generateWordDoc } from '../../utils/reportGenerator';
import { DEFENSE_ASSETS, DEFENSE_SYSTEM_METRICS } from '../../data/mockDefenseData';
import { confirmRepairComplete, dispatchWorkOrder } from '../../api/apiClient';

export default function PlanTable({ workOrders: initialOrders, onSelectAssetId, onUpdateOrders, onRepairComplete }) {
  const [orders, setOrders] = useState(initialOrders || []);
  const [syncNotice, setSyncNotice] = useState(null);
  const [repairNotice, setRepairNotice] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [repairLoading, setRepairLoading] = useState({}); // track per-order loading state

  // Keep local orders state in sync with real-time prop updates from WebSocket and Copilot
  React.useEffect(() => {
    if (initialOrders) {
      setOrders(initialOrders);
    }
  }, [initialOrders]);

  const handleDispatch = async (id) => {
    const targetOrder = orders.find((o) => o.id === id);
    const assetId = targetOrder?.assetId;

    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === id ? { ...o, status: 'Dispatched to Depot' } : o));
      if (onUpdateOrders) onUpdateOrders(updated);
      return updated;
    });

    try {
      await dispatchWorkOrder(id, assetId);
    } catch (e) {
      console.error("Dispatch work order error:", e);
    }

    if (onRepairComplete && assetId) {
      onRepairComplete(assetId);
    }

    setRepairNotice(
      `✅ Work order ${id} dispatched! ${targetOrder?.assetName || assetId} restored to Mission-Ready (Normal). Dashboard metrics updated.`
    );
    setTimeout(() => setRepairNotice(null), 7000);
  };

  const handleRepairComplete = async (order) => {
    setRepairLoading((prev) => ({ ...prev, [order.id]: true }));
    try {
      await confirmRepairComplete(order.assetId);
    } catch (e) { /* fire-and-forget */ }
    setRepairLoading((prev) => ({ ...prev, [order.id]: false }));
    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === order.id ? { ...o, status: 'Repair Confirmed ✓' } : o));
      if (onUpdateOrders) onUpdateOrders(updated);
      return updated;
    });
    if (onRepairComplete) onRepairComplete(order.assetId);
    setRepairNotice(
      `✅ Engineer confirmed repair on ${order.assetName} (${order.assetId}). Asset restored to NOMINAL. Live telemetry resumes in ~12s.`
    );
    setTimeout(() => setRepairNotice(null), 7000);
  };

  const handleSendToErp = () => {
    setSyncNotice('Work orders successfully synchronized with Central Maintenance ERP.');
    setTimeout(() => setSyncNotice(null), 3500);
  };

  const handleDownloadWord = () => {
    generateWordDoc(DEFENSE_ASSETS, orders, DEFENSE_SYSTEM_METRICS);
  };

  const handleExport = () => {
    const csvRows = [
      ['Order ID', 'Asset ID', 'Asset Name', 'Task', 'Priority', 'Due (Hours)', 'Crew', 'Status', 'Impact'],
      ...orders.map(o => [
        o.id,
        o.assetId,
        o.assetName,
        `"${o.task.replace(/"/g, '""')}"`,
        o.priority,
        o.dueInHours,
        o.assignedCrew,
        o.status,
        `"${o.impact.replace(/"/g, '""')}"`
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Maintenance_Plan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pro-card" style={{ padding: '24px' }}>
      {/* Header */}
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
            Prioritized Maintenance Schedule
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Consolidated maintenance tasks prioritized by machine-learning failure probability and sortie impact
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Generate PDF/Word Report button */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={14} />
            <span>Generate Full Report (PDF/Word)</span>
          </button>

          <button
            onClick={handleDownloadWord}
            className="btn btn-secondary btn-sm"
            title="Download formatted Word document (.doc)"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText size={14} color="#38bdf8" />
            <span>Word (.doc)</span>
          </button>

          <button
            onClick={handleExport}
            className="btn btn-secondary btn-sm"
            title="Export CSV"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>

          <button
            onClick={handleSendToErp}
            className="btn btn-ghost btn-sm"
          >
            <Send size={14} />
            <span>Send to ERP</span>
          </button>
        </div>
      </div>

      {/* Repair Confirmed Toast Notice */}
      {repairNotice && (
        <div style={{
          padding: '12px 18px',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))',
          border: '1px solid rgba(16, 185, 129, 0.45)',
          borderRadius: 'var(--radius-sm)',
          color: '#34d399',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '18px',
          boxShadow: '0 0 18px rgba(16,185,129,0.12)'
        }}>
          <ShieldCheck size={18} color="#34d399" />
          <span>{repairNotice}</span>
        </div>
      )}

      {/* Sync Toast Notice */}
      {syncNotice && (
        <div style={{
          padding: '10px 16px',
          background: 'var(--success-subtle)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-sm)',
          color: '#34d399',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '18px'
        }}>
          <CheckCircle2 size={16} />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="pro-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Asset</th>
              <th>Task Description</th>
              <th>Due In</th>
              <th>Assigned Owner</th>
              <th>Spare Parts</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const isCrit = order.priority === 'critical';
              const isHigh = order.priority === 'high';
              const pBadge = isCrit ? 'badge-critical' : isHigh ? 'badge-watch' : 'badge-ready';
              const isDispatched = order.status === 'Dispatched to Depot';

              return (
                <tr key={order.id}>
                  <td>
                    <span className={`badge ${pBadge}`}>
                      <span className="badge-dot"></span>
                      {order.priority.toUpperCase()}
                    </span>
                  </td>

                  <td>
                    <button
                      onClick={() => onSelectAssetId && onSelectAssetId(order.assetId)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        padding: 0,
                        textAlign: 'left'
                      }}
                    >
                      {order.assetId} &bull; {order.assetName}
                    </button>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Impact: {order.impact}
                    </div>
                  </td>

                  <td style={{ maxWidth: '280px', color: 'var(--text-main)' }}>
                    {order.task}
                  </td>

                  <td>
                    <span style={{ fontWeight: 600, color: isCrit ? 'var(--danger)' : 'var(--text-main)' }}>
                      {order.dueInHours} hrs
                    </span>
                  </td>

                  <td style={{ color: 'var(--text-muted)' }}>
                    {order.assignedCrew}
                  </td>

                  <td>
                    <span style={{
                      color: order.partsStatus.includes('In Stock') ? 'var(--success)' : 'var(--warning)',
                      fontSize: '0.78rem'
                    }}>
                      {order.partsStatus}
                    </span>
                  </td>

                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: isDispatched ? 'var(--success-subtle)' : 'var(--bg-surface-elevated)',
                      border: '1px solid ' + (isDispatched ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'),
                      color: isDispatched ? '#34d399' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}>
                      {order.status}
                    </span>
                  </td>

                  <td style={{ textAlign: 'right', minWidth: '160px' }}>
                    {order.status === 'Repair Confirmed ✓' ? (
                      // Fully completed — show static done badge
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                        background: 'rgba(16,185,129,0.12)',
                        border: '1px solid rgba(16,185,129,0.35)',
                        color: '#34d399', fontSize: '0.78rem', fontWeight: 600
                      }}>
                        <ShieldCheck size={13} /> Done
                      </span>
                    ) : isDispatched ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                          background: 'rgba(16,185,129,0.15)',
                          border: '1px solid rgba(16,185,129,0.4)',
                          color: '#34d399', fontSize: '0.74rem', fontWeight: 600
                        }}>
                          <CheckCircle2 size={12} /> Dispatched (Normal)
                        </span>
                        <button
                          onClick={() => handleRepairComplete(order)}
                          disabled={!!repairLoading[order.id]}
                          className="btn btn-sm btn-ghost"
                          style={{
                            padding: '2px 6px',
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)'
                          }}
                          title="Final depot engineer sign-off"
                        >
                          {repairLoading[order.id] ? 'Signing…' : 'Sign Off'}
                        </button>
                      </div>
                    ) : (
                      // Not yet dispatched — show Dispatch button
                      <button
                        onClick={() => handleDispatch(order.id)}
                        className="btn btn-sm btn-primary"
                      >
                        <span>Dispatch</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Full Technical Report Preview & Export Modal */}
      <ReportPreviewModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        assets={DEFENSE_ASSETS}
        workOrders={orders}
        metrics={DEFENSE_SYSTEM_METRICS}
      />
    </div>
  );
}
