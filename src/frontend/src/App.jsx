import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import AssetsPage from './pages/AssetsPage';
import AssetDetail from './components/Assets/AssetDetail';
import MaintenancePlanPage from './pages/MaintenancePlanPage';
import ChatWindow from './components/Chat/ChatWindow';
import ChatWidget from './components/Chat/ChatWidget';

import { 
  DEFENSE_SYSTEM_METRICS, 
  DEFENSE_ASSETS, 
  MAINTENANCE_WORK_ORDERS 
} from './data/mockDefenseData';
import { fetchLiveAssets, fetchLiveMetrics, fetchLiveWorkOrders, createTelemetryWebSocket } from './api/apiClient';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [scopedAsset, setScopedAsset] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isBackendLive, setIsBackendLive] = useState(false);
  const [liveStreamConnected, setLiveStreamConnected] = useState(false);

  const [assets, setAssets] = useState(DEFENSE_ASSETS);
  const [workOrders, setWorkOrders] = useState(MAINTENANCE_WORK_ORDERS);
  const [metrics, setMetrics] = useState(DEFENSE_SYSTEM_METRICS);

  // Derive live counts directly from real-time asset state — always fresh on every tick
  const liveCritical = assets.filter(a => (a.status || '').toLowerCase() === 'critical').length;
  const liveWatch    = assets.filter(a => (a.status || '').toLowerCase() === 'watch').length;
  const liveReady    = assets.filter(a => (a.status || '').toLowerCase() === 'ready').length;
  const liveTotal    = assets.length;

  // Live category breakdown derived from assets
  const liveCategoryBreakdown = ['Combat Aircraft', 'Ground Armored Fleet', 'Naval Strike Group', 'Air & Missile Defense'].map(cat => {
    const catAssets = assets.filter(a => a.category === cat);
    const cReady = catAssets.filter(a => (a.status||'').toLowerCase() === 'ready').length;
    const cWatch = catAssets.filter(a => (a.status||'').toLowerCase() === 'watch').length;
    const cCrit  = catAssets.filter(a => (a.status||'').toLowerCase() === 'critical').length;
    const cTotal = catAssets.length;
    return { category: cat, ready: cReady, watch: cWatch, critical: cCrit, total: cTotal, rate: cTotal > 0 ? Math.round((cReady / cTotal) * 100) : 100 };
  });

  // Merge live counts into metrics (keeps MTBF/downtimeSaved from backend, overrides counts)
  const liveMetrics = {
    ...metrics,
    totalAssets: liveTotal,
    missionReady: liveReady,
    readyPercentage: liveTotal > 0 ? +(liveReady / liveTotal * 100).toFixed(1) : 0,
    watchAlerts: liveWatch,
    watchPercentage: liveTotal > 0 ? +(liveWatch / liveTotal * 100).toFixed(1) : 0,
    criticalNonReady: liveCritical,
    criticalPercentage: liveTotal > 0 ? +(liveCritical / liveTotal * 100).toFixed(1) : 0,
    readinessByCategory: liveCategoryBreakdown,
  };


  // Sync with FastAPI Backend on mount and after mutations
  const loadData = async () => {
    const [assetsRes, metricsRes, ordersRes] = await Promise.all([
      fetchLiveAssets(),
      fetchLiveMetrics(),
      fetchLiveWorkOrders()
    ]);
    if (assetsRes.data) setAssets(assetsRes.data);
    if (metricsRes.data) setMetrics(metricsRes.data);
    if (ordersRes.data) setWorkOrders(ordersRes.data);
    setIsBackendLive(assetsRes.isLive);
  };

  useEffect(() => {
    loadData();

    // 1.25s Live IoT Telemetry WebSocket Stream Listener
    const wsClient = createTelemetryWebSocket(
      (data) => {
        if (data.type === 'STREAM_ESTABLISHED' || data.type === 'TELEMETRY_FULL_TICK' || data.type === 'REPAIR_COMPLETE') {
          setIsBackendLive(true);
          setLiveStreamConnected(true);

          if (data.metrics) {
            setMetrics((prev) => ({
              ...prev,
              ...data.metrics
            }));
          }

          if (data.assets) {
            const tickTime = data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            setAssets((prevAssets) => {
              return prevAssets.map((asset) => {
                const live = data.assets[asset.id];
                if (!live) return asset;

                const updatedSensors = (asset.contributingSensors || []).map((s) => {
                  const sname = (s.name || '').toLowerCase();
                  if (sname.includes('vibration')) {
                    return {
                      ...s,
                      current: `${live.vibration} mm/s`,
                      status: live.vibration > 4.0 ? 'critical' : (live.vibration > 2.5 ? 'warning' : 'nominal'),
                      delta: `${(((live.vibration - 1.8) / 1.8) * 100).toFixed(1)}%`
                    };
                  }
                  if (sname.includes('pressure') || sname.includes('hydraulic')) {
                    return {
                      ...s,
                      current: `${Math.round(live.pressure)} PSI`,
                      status: live.pressure < 2500 ? 'critical' : (live.pressure < 2800 ? 'warning' : 'nominal'),
                      delta: `${(((live.pressure - 3000) / 3000) * 100).toFixed(1)}%`
                    };
                  }
                  if (sname.includes('temp') || sname.includes('thermal') || sname.includes('egt') || sname.includes('pyrometer')) {
                    return {
                      ...s,
                      current: `${live.temp} °C`,
                      status: live.temp > 720 ? 'warning' : 'nominal'
                    };
                  }
                  return s;
                });

                const prevHist = asset.telemetryHistory || [];
                const newPoint = {
                  t: tickTime,
                  vibration: live.vibration,
                  pressure: Math.round(live.pressure),
                  temp: Math.round(live.temp)
                };
                const hist = [...prevHist.slice(-99), newPoint];

                return {
                  ...asset,
                  readinessScore: live.readinessScore,
                  predictedRUL: live.predictedRUL,
                  status: live.status,
                  isSpike: live.isSpike,
                  vibration: live.vibration,
                  pressure: live.pressure,
                  temp: live.temp,
                  contributingSensors: updatedSensors,
                  telemetryHistory: hist,
                  xaiAttribution: live.xaiAttribution || asset.xaiAttribution
                };
              });
            });

            // Keep selected asset in detail view synchronized live with sensors & XAI waterfall
            setSelectedAsset((prev) => {
              if (!prev || !data.assets[prev.id]) return prev;
              const live = data.assets[prev.id];

              const updatedSensors = (prev.contributingSensors || []).map((s) => {
                const sname = (s.name || '').toLowerCase();
                if (sname.includes('vibration')) {
                  return {
                    ...s,
                    current: `${live.vibration} mm/s`,
                    status: live.vibration > 4.0 ? 'critical' : (live.vibration > 2.5 ? 'warning' : 'nominal'),
                    delta: `${(((live.vibration - 1.8) / 1.8) * 100).toFixed(1)}%`
                  };
                }
                if (sname.includes('pressure') || sname.includes('hydraulic')) {
                  return {
                    ...s,
                    current: `${Math.round(live.pressure)} PSI`,
                    status: live.pressure < 2500 ? 'critical' : (live.pressure < 2800 ? 'warning' : 'nominal'),
                    delta: `${(((live.pressure - 3000) / 3000) * 100).toFixed(1)}%`
                  };
                }
                if (sname.includes('temp') || sname.includes('thermal') || sname.includes('egt') || sname.includes('pyrometer')) {
                  return {
                    ...s,
                    current: `${live.temp} °C`,
                    status: live.temp > 720 ? 'warning' : 'nominal'
                  };
                }
                return s;
              });

              const prevHist = prev.telemetryHistory || [];
              const newPoint = {
                t: tickTime,
                vibration: live.vibration,
                pressure: Math.round(live.pressure),
                temp: Math.round(live.temp)
              };
              const hist = [...prevHist.slice(-99), newPoint];

              return {
                ...prev,
                readinessScore: live.readinessScore,
                predictedRUL: live.predictedRUL,
                status: live.status,
                isSpike: live.isSpike,
                vibration: live.vibration,
                pressure: live.pressure,
                temp: live.temp,
                contributingSensors: updatedSensors,
                telemetryHistory: hist,
                xaiAttribution: live.xaiAttribution || prev.xaiAttribution
              };
            });
          }
        }
      },
      (status) => {
        if (status === 'connected') {
          setIsBackendLive(true);
          setLiveStreamConnected(true);
        } else if (status === 'disconnected' || status === 'error') {
          setLiveStreamConnected(false);
        }
      }
    );

    return () => {
      wsClient.close();
    };
  }, []);

  // Consult Copilot with pre-filled context
  const handleConsultCopilot = (asset) => {
    setScopedAsset(asset);
    setIsChatOpen(true);
  };

  // Filter triggered from Dashboard summary cards
  const handleFilterStatus = (status) => {
    setStatusFilter(status.toUpperCase());
    setSelectedAsset(null);
    setCurrentTab('assets');
  };

  // Dispatch an action from Asset Detail
  const handleDispatchOrder = (asset, taskId) => {
    setWorkOrders((prev) => [
      {
        id: `WO-SURGE-${Math.floor(100 + Math.random() * 900)}`,
        assetId: asset.id,
        assetName: `${asset.name}`,
        task: `Depot Task: ${asset.actionPlan.find(a => a.id === taskId)?.task || 'Urgent repair'}`,
        priority: 'critical',
        dueInHours: 12,
        assignedCrew: 'Central Defense Depot Response Unit',
        partsStatus: 'In Stock',
        status: 'Dispatched to Depot',
        estimatedDowntime: '8 hrs',
        impact: 'High (Immediate Sortie Release)'
      },
      ...prev
    ]);
  };

  return (
    <div className="app-container">
      {/* Enterprise Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setSelectedAsset(null);
          setCurrentTab(tab);
        }}
        criticalCount={liveMetrics.criticalNonReady}
        isBackendLive={isBackendLive}
        liveStreamConnected={liveStreamConnected}
        onOpenChat={() => {
          setScopedAsset(null);
          setIsChatOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* If an asset is selected, show Asset Detail view */}
        {selectedAsset ? (
          <AssetDetail
            asset={selectedAsset}
            onBack={() => setSelectedAsset(null)}
            onConsultCopilot={handleConsultCopilot}
            onDispatchOrder={handleDispatchOrder}
          />
        ) : (
          <>
            {/* TAB 1: DASHBOARD */}
            {currentTab === 'dashboard' && (
              <DashboardPage
                metrics={liveMetrics}
                assets={assets}
                onSelectAsset={(asset) => setSelectedAsset(asset)}
                onConsultCopilot={handleConsultCopilot}
                onFilterStatus={handleFilterStatus}
                onSelectCategory={(categoryName) => {
                  setCurrentTab('assets');
                }}
              />
            )}

            {/* TAB 2: FLEET ASSETS */}
            {currentTab === 'assets' && (
              <AssetsPage
                assets={assets}
                initialFilter={statusFilter}
                onSelectAsset={(asset) => setSelectedAsset(asset)}
                onConsultCopilot={handleConsultCopilot}
                onAssetAdded={(newAsset) => {
                  setAssets((prev) => [newAsset, ...prev]);
                  loadData();
                }}
                onRefreshData={loadData}
              />
            )}

            {/* TAB 3: MAINTENANCE PLAN */}
            {currentTab === 'maintenance' && (
              <MaintenancePlanPage
                workOrders={workOrders}
                onSelectAssetId={(assetId) => {
                  const matched = assets.find((a) => a.id === assetId);
                  if (matched) setSelectedAsset(matched);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Ask Copilot Button (bottom-right) */}
      <ChatWidget
        isOpen={isChatOpen}
        onClick={() => setIsChatOpen(true)}
      />

      {/* Slide-out Copilot Assistant Drawer */}
      <ChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        scopedAsset={scopedAsset}
        onSelectAssetId={(assetId) => {
          const matched = assets.find((a) => a.id === assetId);
          if (matched) {
            setSelectedAsset(matched);
            setIsChatOpen(false);
          }
        }}
        onNavigateTab={(tab) => {
          setSelectedAsset(null);
          setCurrentTab(tab);
        }}
        onWorkOrderDispatched={(newOrder) => {
          setWorkOrders((prev) => [newOrder, ...prev]);
          loadData();
        }}
      />
    </div>
  );
}
