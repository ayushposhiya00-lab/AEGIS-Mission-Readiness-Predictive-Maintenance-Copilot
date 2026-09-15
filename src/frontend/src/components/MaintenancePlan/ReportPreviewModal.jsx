import React from 'react';
import { X, Printer, FileText, Download, CheckCircle2, ShieldAlert } from 'lucide-react';
import { generateWordDoc } from '../../utils/reportGenerator';

export default function ReportPreviewModal({ isOpen, onClose, assets, workOrders, metrics }) {
  if (!isOpen) return null;

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const urgentAssets = assets.filter((a) => a.status === 'critical' || a.status === 'watch');

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadWord = () => {
    generateWordDoc(assets, workOrders, metrics);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="pro-card" style={{
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#ffffff',
        color: '#0f172a',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Modal Action Header (Non-printable) */}
        <div className="no-print" style={{
          padding: '16px 24px',
          background: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1e293b'
        }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: '#ffffff' }}>
              Maintenance Action Plan Report Generator
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
              Export formal technical report in PDF or Microsoft Word format
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrintPdf}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} />
              <span>Save as PDF / Print</span>
            </button>

            <button
              onClick={handleDownloadWord}
              className="btn btn-secondary btn-sm"
              style={{
                background: '#1e293b',
                color: '#ffffff',
                borderColor: '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FileText size={15} color="#38bdf8" />
              <span>Download Word (.doc)</span>
            </button>

            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              style={{ padding: '6px', color: '#94a3b8' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Paper Area */}
        <div className="printable-report" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '40px 48px',
          background: '#ffffff',
          color: '#1e293b',
          fontFamily: 'Calibri, Arial, sans-serif',
          lineHeight: 1.5
        }}>
          {/* Document Title Header */}
          <div style={{ borderBottom: '2px solid #1e3a8a', paddingBottom: '12px', marginBottom: '20px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              RESTRICTED // DEFENSE TECHNICAL LOGISTICS REPORT
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e3a8a', margin: '6px 0 4px 0' }}>
              DEFENSE FLEET PREDICTIVE MAINTENANCE &amp; ACTION REPORT
            </h1>
            <div style={{ fontSize: '0.82rem', color: '#475569' }}>
              <strong>Date:</strong> {currentDate} &bull; 
              <strong> System:</strong> Mission Readiness Copilot &bull; 
              <strong> Authorization:</strong> Central Maintenance Command
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <h2 style={{ fontSize: '1.15rem', color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginTop: '24px' }}>
            1. Executive Fleet Readiness Summary
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '12px 0 20px 0', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left' }}>Total Assets</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left' }}>Mission-Ready</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left' }}>Telemetry Watchlist</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left' }}>Critical Grounded</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left' }}>MTBF</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}><strong>{metrics.totalAssets}</strong> units</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px', color: '#15803d' }}>
                  <strong>{metrics.missionReady}</strong> ({metrics.readyPercentage}%)
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px', color: '#b45309' }}>
                  <strong>{metrics.watchAlerts}</strong> ({metrics.watchPercentage}%)
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px', color: '#dc2626' }}>
                  <strong>{metrics.criticalNonReady}</strong> ({metrics.criticalPercentage}%)
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>
                  <strong>{metrics.meanTimeBetweenFailures}</strong> ({metrics.mtbfDelta})
                </td>
              </tr>
            </tbody>
          </table>

          {/* Section 2: Work Orders Queue */}
          <h2 style={{ fontSize: '1.15rem', color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginTop: '24px' }}>
            2. Prioritized Maintenance Work Orders
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '12px 0 24px 0', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left' }}>Priority</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left' }}>Order ID</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left' }}>Asset Details</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left' }}>Maintenance Task</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left' }}>Due In</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left' }}>Assigned Crew</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left' }}>Spare Parts</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left' }}>Sortie Impact</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((o) => (
                <tr key={o.id}>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontWeight: 700, color: o.priority === 'critical' ? '#dc2626' : '#b45309' }}>
                    {o.priority.toUpperCase()}
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}><strong>{o.id}</strong></td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}><strong>{o.assetId}</strong><br />{o.assetName}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>{o.task}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontWeight: 600 }}>{o.dueInHours} hrs</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>{o.assignedCrew}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>{o.partsStatus}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>{o.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Section 3: Asset-by-Asset Deep Dive */}
          <h2 style={{ fontSize: '1.15rem', color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginTop: '28px' }}>
            3. Detailed Asset-by-Asset Technical Action Plans
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#475569', marginBottom: '16px' }}>
            Technical root-cause diagnosis, sensor failure data, and step-by-step required maintenance actions for each asset:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {urgentAssets.map((asset) => (
              <div
                key={asset.id}
                style={{
                  border: '1px solid #cbd5e1',
                  borderLeft: asset.status === 'critical' ? '4px solid #dc2626' : '4px solid #b45309',
                  background: '#f8fafc',
                  padding: '16px 20px',
                  borderRadius: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                    {asset.name} ({asset.id} &bull; Callsign: {asset.callsign})
                  </h3>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: asset.status === 'critical' ? '#dc2626' : '#b45309'
                  }}>
                    STATUS: {asset.status.toUpperCase()} &bull; {asset.readinessScore}% READINESS &bull; {asset.predictedRUL} DAYS RUL
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '10px' }}>
                  <strong>Base:</strong> {asset.operationalBase} &bull; 
                  <strong> Assigned Unit:</strong> {asset.crewAssigned} &bull; 
                  <strong> Operating Hours:</strong> {asset.flightHours} hrs
                </div>

                <div style={{ fontSize: '0.85rem', background: '#ffffff', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '10px' }}>
                  <strong style={{ color: '#1e3a8a' }}>AI Copilot Diagnostic Finding:</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#334155', fontStyle: 'italic' }}>
                    "{asset.copilotAnalysis}"
                  </p>
                </div>

                <div style={{ fontSize: '0.82rem', marginBottom: '10px' }}>
                  <strong style={{ color: '#0f172a' }}>Contributing Sensor Degradation:</strong>
                  <ul style={{ margin: '4px 0 0 18px', padding: 0, color: '#334155' }}>
                    {asset.contributingSensors.map((s, i) => (
                      <li key={i} style={{ marginBottom: '2px' }}>
                        <strong>{s.name}:</strong> Current Reading = {s.current} (Baseline: {s.baseline}) &bull; Delta: <strong style={{ color: s.status === 'critical' ? '#dc2626' : '#b45309' }}>{s.delta}</strong>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ fontSize: '0.82rem' }}>
                  <strong style={{ color: '#0f172a' }}>Required Maintenance Tasks (Execution Checklist):</strong>
                  <ol style={{ margin: '4px 0 0 18px', padding: 0, color: '#334155' }}>
                    {asset.actionPlan.map((t) => (
                      <li key={t.id} style={{ marginBottom: '4px' }}>
                        <strong>{t.task}</strong> &mdash; 
                        Priority: <em>{t.priority.toUpperCase()}</em> &bull; 
                        Est. Duration: {t.eta} &bull; 
                        Crew: {t.crew} &bull; 
                        Spares: {t.partsAvailable ? '✅ In Stock' : '⚠️ Order Required'}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>

          {/* Section 4: Sign-off Block */}
          <div style={{ marginTop: '36px', paddingTop: '20px', borderTop: '1px solid #cbd5e1' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '20px' }}>
              4. Technical Verification &amp; Commander Authorization
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '8px', fontSize: '0.82rem', color: '#475569' }}>
                <strong>Chief Maintenance Engineer / Depot Lead</strong><br />
                Signature: ____________________________________<br />
                Rank &amp; ID: ____________________________________<br />
                Date: ________________________________________
              </div>

              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '8px', fontSize: '0.82rem', color: '#475569' }}>
                <strong>Squadron / Regimental Operations Commander</strong><br />
                Signature: ____________________________________<br />
                Rank &amp; ID: ____________________________________<br />
                Date: ________________________________________
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
