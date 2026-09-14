import React from 'react';
import AssetTable from '../components/Assets/AssetTable';

export default function AssetsPage({ 
  assets, 
  onSelectAsset, 
  onConsultCopilot, 
  initialFilter,
  onAssetAdded,
  onRefreshData
}) {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          Defense Fleet Inventory
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Real-time health, remaining useful life predictions, and operational status for all deployed assets
        </p>
      </div>

      <AssetTable
        assets={assets}
        onSelectAsset={onSelectAsset}
        onConsultCopilot={onConsultCopilot}
        initialFilter={initialFilter}
        onAssetAdded={onAssetAdded}
        onRefreshData={onRefreshData}
      />
    </div>
  );
}
