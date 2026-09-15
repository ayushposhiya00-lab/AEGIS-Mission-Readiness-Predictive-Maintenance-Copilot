// Utility to generate formatted Word (.doc) and PDF-ready Maintenance Reports

export function generateWordDoc(assets, workOrders, metrics) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const urgentAssets = assets.filter((a) => a.status === 'critical' || a.status === 'watch');

  const html = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset='utf-8'>
    <title>Defense Fleet Maintenance Action Report</title>
    <style>
      body {
        font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.45;
        color: #1f2937;
        margin: 20pt;
      }
      .header-title {
        font-size: 18pt;
        font-weight: bold;
        color: #1e3a8a;
        margin-bottom: 4pt;
        border-bottom: 2pt solid #1e3a8a;
        padding-bottom: 6pt;
      }
      .header-meta {
        font-size: 9.5pt;
        color: #64748b;
        margin-bottom: 16pt;
      }
      h2 {
        font-size: 13pt;
        color: #1e3a8a;
        border-bottom: 1pt solid #cbd5e1;
        padding-bottom: 4pt;
        margin-top: 18pt;
        margin-bottom: 8pt;
      }
      h3 {
        font-size: 11.5pt;
        color: #0f172a;
        margin-top: 12pt;
        margin-bottom: 4pt;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 10pt 0 16pt 0;
      }
      th {
        background-color: #f1f5f9;
        color: #0f172a;
        font-weight: bold;
        font-size: 9.5pt;
        border: 1pt solid #cbd5e1;
        padding: 6pt 8pt;
        text-align: left;
      }
      td {
        border: 1pt solid #cbd5e1;
        padding: 6pt 8pt;
        font-size: 9.5pt;
        vertical-align: top;
      }
      .badge-critical { color: #dc2626; font-weight: bold; }
      .badge-high { color: #d97706; font-weight: bold; }
      .badge-medium { color: #2563eb; font-weight: bold; }
      .asset-card {
        background-color: #f8fafc;
        border: 1pt solid #e2e8f0;
        border-left: 4pt solid #2563eb;
        padding: 10pt 12pt;
        margin-bottom: 14pt;
      }
      .asset-card-critical {
        border-left-color: #dc2626;
      }
      .task-list {
        margin: 6pt 0 6pt 16pt;
        padding: 0;
      }
      .task-item {
        margin-bottom: 4pt;
      }
      .signatures {
        margin-top: 30pt;
        width: 100%;
      }
      .sign-col {
        width: 50%;
        padding: 20pt 10pt 0 0;
      }
      .sign-line {
        border-top: 1pt solid #94a3b8;
        padding-top: 4pt;
        font-size: 9.5pt;
        color: #475569;
      }
    </style>
  </head>
  <body>
    <div class="header-title">DEFENSE FLEET PREDICTIVE MAINTENANCE &amp; ACTION REPORT</div>
    <div class="header-meta">
      <strong>CLASSIFICATION:</strong> RESTRICTED // OPERATIONAL DEFENSE LOGISTICS &bull; 
      <strong>DATE GENERATED:</strong> ${currentDate} &bull; 
      <strong>SYSTEM:</strong> Mission Readiness Copilot
    </div>

    <h2>1. Executive Readiness Summary</h2>
    <table>
      <tr>
        <th>Total Tracked Fleet</th>
        <th>Mission-Ready Assets</th>
        <th>Telemetry Watchlist</th>
        <th>Critical Non-Ready</th>
        <th>Mean Time Between Failures</th>
      </tr>
      <tr>
        <td><strong>${metrics.totalAssets}</strong> assets</td>
        <td><strong>${metrics.missionReady}</strong> (${metrics.readyPercentage}%)</td>
        <td><strong>${metrics.watchAlerts}</strong> (${metrics.watchPercentage}%)</td>
        <td class="badge-critical"><strong>${metrics.criticalNonReady}</strong> (${metrics.criticalPercentage}%)</td>
        <td><strong>${metrics.meanTimeBetweenFailures}</strong> (${metrics.mtbfDelta})</td>
      </tr>
    </table>

    <h2>2. Prioritized Maintenance Work Order Schedule</h2>
    <p>The following work orders have been generated based on algorithmic Remaining Useful Life (RUL) limits and must be executed in order of priority:</p>
    <table>
      <thead>
        <tr>
          <th>Priority</th>
          <th>Order ID</th>
          <th>Asset Details</th>
          <th>Specific Maintenance Task</th>
          <th>Due Time</th>
          <th>Assigned Depot / Crew</th>
          <th>Spare Parts</th>
          <th>Sortie Impact</th>
        </tr>
      </thead>
      <tbody>
        ${workOrders.map(o => `
          <tr>
            <td class="${o.priority === 'critical' ? 'badge-critical' : o.priority === 'high' ? 'badge-high' : 'badge-medium'}">
              ${o.priority.toUpperCase()}
            </td>
            <td><strong>${o.id}</strong></td>
            <td><strong>${o.assetId}</strong><br>${o.assetName}</td>
            <td>${o.task}</td>
            <td><strong>${o.dueInHours} hrs</strong></td>
            <td>${o.assignedCrew}</td>
            <td>${o.partsStatus}</td>
            <td>${o.impact}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>3. Asset-by-Asset Maintenance Instructions &amp; Action Plan</h2>
    <p>Detailed technical instructions for each vehicle, aircraft, and subsystem flagged for depot intervention:</p>

    ${urgentAssets.map(asset => `
      <div class="asset-card ${asset.status === 'critical' ? 'asset-card-critical' : ''}">
        <h3 style="margin-top:0;">
          ${asset.name} (ID: ${asset.id} &bull; Callsign: ${asset.callsign}) — 
          <span class="${asset.status === 'critical' ? 'badge-critical' : 'badge-high'}">
            ${asset.status.toUpperCase()} (${asset.readinessScore}% Readiness &bull; ${asset.predictedRUL} Days RUL)
          </span>
        </h3>
        <p><strong>Operational Location:</strong> ${asset.operationalBase} &bull; <strong>Assigned Unit:</strong> ${asset.crewAssigned} &bull; <strong>Operating Hours:</strong> ${asset.flightHours} hrs</p>
        
        <p><strong>Root Cause Failure Diagnosis:</strong><br>
        <em>"${asset.copilotAnalysis}"</em></p>

        <p><strong>Contributing Sensor Degradation Data:</strong></p>
        <ul>
          ${asset.contributingSensors.map(s => `
            <li><strong>${s.name}:</strong> Current Reading = ${s.current} (Baseline: ${s.baseline}) &bull; Delta: <span class="${s.status === 'critical' ? 'badge-critical' : 'badge-high'}">${s.delta}</span></li>
          `).join('')}
        </ul>

        <p><strong>Required Maintenance Actions (Step-by-Step):</strong></p>
        <ol class="task-list">
          ${asset.actionPlan.map(t => `
            <li class="task-item">
              <strong>${t.task}</strong><br>
              Priority: ${t.priority.toUpperCase()} &bull; Estimated Duration: ${t.eta} &bull; Assigned Crew: ${t.crew} &bull; Parts: ${t.partsAvailable ? 'In Stock' : 'Order Required'}
            </li>
          `).join('')}
        </ol>
      </div>
    `).join('')}

    <h2>4. Sign-off &amp; Authorization Block</h2>
    <table class="signatures">
      <tr>
        <td class="sign-col" style="border:none;">
          <div class="sign-line">
            <strong>Maintenance Technical Lead / Senior Engineer</strong><br>
            Name: _______________________________<br>
            Rank / ID: __________________________<br>
            Date: _______________________________
          </div>
        </td>
        <td class="sign-col" style="border:none;">
          <div class="sign-line">
            <strong>Squadron / Regimental Commander</strong><br>
            Name: _______________________________<br>
            Rank / ID: __________________________<br>
            Approval Signature: __________________
          </div>
        </td>
      </tr>
    </table>

    <div style="margin-top:30pt; font-size:8pt; color:#94a3b8; text-align:center;">
      CONFIDENTIAL &bull; HQ MAINTENANCE COMMAND &bull; GENERATED VIA MISSION READINESS COPILOT
    </div>
  </body>
  </html>
  `;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Fleet_Maintenance_Action_Report_${new Date().toISOString().split('T')[0]}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
