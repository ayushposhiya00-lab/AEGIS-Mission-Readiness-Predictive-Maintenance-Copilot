import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  MessageSquare, 
  CheckCircle2, 
  Wrench, 
  Sparkles,
  AlertTriangle,
  Send,
  Check,
  Printer,
  FileText,
  Layers,
  ShieldAlert,
  Cpu,
  BarChart3
} from 'lucide-react';
import SensorTrendChart from './SensorTrendChart';
import { fetchAssetExplanation } from '../../api/apiClient';

export default function AssetDetail({ asset, onBack, onConsultCopilot, onDispatchOrder, onAnomalyInjected }) {
  if (!asset) return null;

  const [dispatchedTasks, setDispatchedTasks] = useState({});
  const [xaiData, setXaiData] = useState(asset.xaiAttribution || null);
  const [loadingXai, setLoadingXai] = useState(false);

  useEffect(() => {
    if (asset?.xaiAttribution) {
      setXaiData(asset.xaiAttribution);
    } else if (asset?.id && !xaiData) {
      setLoadingXai(true);
      fetchAssetExplanation(asset.id).then((data) => {
        if (data) setXaiData(data);
        setLoadingXai(false);
      }).catch(() => setLoadingXai(false));
    }
  }, [asset?.id, asset?.xaiAttribution]);

  const activeXai = asset?.xaiAttribution || xaiData;

  const isCrit = asset.status === 'critical';
  const isWarn = asset.status === 'watch';
  const badgeClass = isCrit ? 'badge-critical' : isWarn ? 'badge-watch' : 'badge-ready';
  const barColor = isCrit ? 'var(--danger)' : isWarn ? 'var(--warning)' : 'var(--success)';

  const handleDispatch = (taskId) => {
    setDispatchedTasks((prev) => ({ ...prev, [taskId]: true }));
    if (onDispatchOrder) {
      onDispatchOrder(asset, taskId);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back button & Asset Header */}
      <div className="pro-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={onBack}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={15} />
              <span>Back to Fleet</span>
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  {asset.name} ({asset.id})
                </h1>
                <span className={`badge ${badgeClass}`}>
                  <span className="badge-dot"></span>
                  {asset.status === 'critical' ? 'Critical Non-Ready' : asset.status === 'watch' ? 'Advisory Watch' : 'Mission-Ready'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Callsign: <strong>{asset.callsign}</strong> &bull; Base: {asset.operationalBase} &bull; Crew: {asset.crewAssigned}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.print()}
              className="btn btn-secondary btn-sm"
              title="Print or Save Asset Diagnostic Card to PDF"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={14} />
              <span>Print / PDF Card</span>
            </button>

            <button
              onClick={() => onConsultCopilot && onConsultCopilot(asset)}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <MessageSquare size={14} />
              <span>Ask Copilot</span>
            </button>
          </div>
        </div>

        {/* High-level status bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Readiness Score</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <div className="progress-bar-bg" style={{ width: '80px' }}>
                <div className="progress-bar-fill" style={{ width: `${asset.readinessScore}%`, background: barColor }} />
              </div>
              <strong style={{ fontSize: '1.1rem', color: barColor }}>{asset.readinessScore}%</strong>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Predicted RUL</div>
            <div style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: isCrit ? 'var(--danger)' : isWarn ? 'var(--warning)' : 'var(--success)',
              marginTop: '4px'
            }}>
              {asset.predictedRUL} days to failure
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Flight / Operating Hours</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
              {asset.flightHours} hrs
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Next Scheduled Service</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
              {asset.nextScheduledService}
            </div>
          </div>
        </div>
      </div>

      {/* Root Cause Explanation from Copilot */}
      <div className="pro-card" style={{
        padding: '20px 24px',
        borderLeft: '4px solid var(--primary)',
        background: 'linear-gradient(to right, rgba(37, 99, 235, 0.05), var(--bg-surface))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles size={16} color="var(--primary)" />
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
            Root Cause Diagnosis (Generated by Copilot)
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 500, marginLeft: 'auto' }}>
            ML Model Confidence: 94.6%
          </span>
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          "{asset.copilotAnalysis}"
        </p>
      </div>

      {/* Sensor Trend Chart with Live Stream & Anomaly Injection */}
      <SensorTrendChart 
        telemetryHistory={asset.telemetryHistory} 
        assetId={asset.id}
        assetName={asset.name}
        onAnomalyInjected={onAnomalyInjected}
      />

      {/* NEW: Explainable AI (XAI) Feature Attribution Waterfall */}
      <div className="pro-card" style={{ padding: '22px 24px', border: '1px solid var(--border-medium)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <Cpu size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Explainable AI (XAI) &bull; Sensor Attribution Waterfall
                </h3>
                <span className="badge badge-ready" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  Model Interpretability
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {activeXai?.model || asset.mlModelApplied} &bull; Local Marginal Sensitivity Engine
              </p>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Baseline Ref: MIL-STD Nominal Calibration
          </div>
        </div>

        {/* Plain language summary callout */}
        <div style={{
          padding: '12px 14px',
          background: 'var(--bg-surface-elevated)',
          borderLeft: '3px solid var(--warning)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.82rem',
          color: 'var(--text-main)',
          marginBottom: '20px',
          lineHeight: 1.5
        }}>
          <strong>Commander Insight:</strong> {activeXai?.summary || `Sensors contributing to ${asset.readinessScore}% readiness score.`}
        </div>

        {/* Feature Contribution Waterfall Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {activeXai?.attributions?.map((attr, idx) => {
            const isRisk = attr.direction === 'risk_increase';
            const barFillColor = isRisk ? 'var(--danger)' : 'var(--success)';
            const deltaColor = isRisk ? 'var(--danger)' : 'var(--success)';

            return (
              <div key={idx} style={{
                background: 'var(--bg-surface-elevated)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {attr.feature}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: attr.severity === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: attr.severity === 'critical' ? 'var(--danger)' : 'var(--warning)',
                      fontWeight: 600
                    }}>
                      {attr.severity.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Current: <strong>{attr.current}</strong> (Baseline: {attr.baseline})
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: deltaColor }}>
                      {attr.delta}
                    </span>
                    <span style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: isRisk ? '#f87171' : '#34d399',
                      minWidth: '65px',
                      textAlign: 'right'
                    }}>
                      {attr.contributionPct}% {isRisk ? 'Risk' : 'Safe'}
                    </span>
                  </div>
                </div>

                {/* Horizontal Bar */}
                <div style={{
                  height: '8px',
                  background: 'var(--border-subtle)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${Math.min(100, Math.max(8, attr.contributionPct))}%`,
                    height: '100%',
                    background: barFillColor,
                    borderRadius: '4px',
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contributing Sensor Breakdown */}
      <div className="pro-card" style={{ padding: '20px 24px' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '14px' }}>
          Key Contributing Sensors
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {asset.contributingSensors.map((sensor, idx) => {
            const isSensCrit = sensor.status === 'critical';
            const isSensWarn = sensor.status === 'warning';
            const sColor = isSensCrit ? 'var(--danger)' : isSensWarn ? 'var(--warning)' : 'var(--success)';

            return (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {sensor.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '1.15rem', color: 'var(--text-main)' }}>
                    {sensor.current}
                  </strong>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: sColor }}>
                    {sensor.delta}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Baseline: {sensor.baseline}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two columns: Service History + Recommended Maintenance Plan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Service History */}
        <div className="pro-card" style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px' }}>
            Recent Service &amp; Inspection History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {asset.serviceHistory.map((log, i) => (
              <div key={i} style={{ borderLeft: '2px solid var(--border-medium)', paddingLeft: '12px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {log.date} &bull; Inspector: {log.inspector}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', marginTop: '2px' }}>
                  {log.event}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Maintenance Plan */}
        <div className="pro-card" style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px' }}>
            Recommended Maintenance Plan
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {asset.actionPlan.map((action) => {
              const isDispatched = dispatchedTasks[action.id];
              return (
                <div
                  key={action.id}
                  style={{
                    padding: '12px',
                    background: isDispatched ? 'var(--success-subtle)' : 'var(--bg-surface-elevated)',
                    border: '1px solid ' + (isDispatched ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'),
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)' }}>
                      {action.task}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Priority: <strong>{action.priority.toUpperCase()}</strong> &bull; Estimated: {action.eta} &bull; {action.crew}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDispatch(action.id)}
                    disabled={isDispatched}
                    className={`btn btn-sm ${isDispatched ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {isDispatched ? (
                      <>
                        <Check size={13} color="var(--success)" />
                        <span style={{ color: 'var(--success)' }}>Dispatched</span>
                      </>
                    ) : (
                      <span>Dispatch</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
