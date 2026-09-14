import React from 'react';
import PlanTable from '../components/MaintenancePlan/PlanTable';

export default function MaintenancePlanPage({ workOrders, onSelectAssetId }) {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          Maintenance &amp; Sortie Schedule
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Prioritized repair work orders generated from C-MAPSS degradation algorithms and operational criticality
        </p>
      </div>

      <PlanTable
        workOrders={workOrders}
        onSelectAssetId={onSelectAssetId}
      />
    </div>
  );
}
