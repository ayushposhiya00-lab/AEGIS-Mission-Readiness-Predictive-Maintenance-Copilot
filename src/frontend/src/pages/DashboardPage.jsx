import React from 'react';
import ReadinessSummaryCards from '../components/Dashboard/ReadinessSummaryCards';
import CriticalAlertsList from '../components/Dashboard/CriticalAlertsList';
import ReadinessOverviewChart from '../components/Dashboard/ReadinessOverviewChart';

export default function DashboardPage({ 
  metrics, 
  assets, 
  onSelectAsset, 
  onConsultCopilot, 
  onFilterStatus,
  onSelectCategory 
}) {
  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          Mission Readiness Overview
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Fleet-wide operational health telemetry and predictive maintenance intelligence
        </p>
      </div>

      {/* Top 4 Summary Cards */}
      <ReadinessSummaryCards
        metrics={metrics}
        onFilterStatus={onFilterStatus}
      />

      {/* Two Column Layout: Critical Attention Needed & Asset Readiness Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '24px'
      }}>
        {/* Left: Critical Attention Needed */}
        <CriticalAlertsList
          assets={assets}
          onSelectAsset={onSelectAsset}
          onConsultCopilot={onConsultCopilot}
        />

        {/* Right: Asset Readiness Breakdown */}
        <ReadinessOverviewChart
          categories={metrics.readinessByCategory}
          onSelectCategory={onSelectCategory}
        />
      </div>
    </div>
  );
}
