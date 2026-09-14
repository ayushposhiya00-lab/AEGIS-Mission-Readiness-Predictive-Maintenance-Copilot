import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  History,
  RotateCcw,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { 
  injectTelemetryAnomaly, 
  resetTelemetryAnomaly, 
  createTelemetryWebSocket 
} from '../../api/apiClient';

export default function SensorTrendChart({ telemetryHistory: initialHistory, assetId, assetName }) {
  const [selectedMetric, setSelectedMetric] = useState('vibration');
  const [history, setHistory] = useState(initialHistory || []);
  const [viewWindow, setViewWindow] = useState(8); // Default 8 points (clean steps like user image)
  const [panOffset, setPanOffset] = useState(0); // 0 = live tail, >0 = history rewind offset
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [activeAnomaly, setActiveAnomaly] = useState(null);
  const [isInjecting, setIsInjecting] = useState(false);

  const wsRef = useRef(null);

  // Sync initial history from parent stream
  useEffect(() => {
    if (initialHistory && initialHistory.length > 0) {
      setHistory(initialHistory);
    }
  }, [initialHistory]);

  // Metric configurations
  const metricsConfig = {
    vibration: {
      label: 'HPT Bearing Vibration',
      sublabel: 'NASA IMS Bearing Model',
      unit: 'mm/s',
      precision: 2,
      baseVal: 1.80,
      threshold: 3.50,
      thresholdLabel: 'MIL-SPEC Threshold: 3.50 mm/s',
      lineColor: '#06b6d4', // Vibrant Cyan (like user reference image)
      anomalySpike: 5.45
    },
    pressure: {
      label: 'Hydraulic Line Pressure',
      sublabel: 'Actuation & Recoil Hydraulic System',
      unit: 'PSI',
      precision: 0,
      baseVal: 3000,
      threshold: 2700,
      thresholdLabel: 'Min Safe Limit: 2700 PSI',
      lineColor: '#3b82f6', // Electric Blue
      anomalySpike: 2420
    },
    temp: {
      label: 'Exhaust Gas Temperature (EGT)',
      sublabel: 'Turbofan Thermodynamic Core',
      unit: '°C',
      precision: 1,
      baseVal: 680,
      threshold: 720,
      thresholdLabel: 'Max Continuous Temp: 720 °C',
      lineColor: '#10b981', // Emerald Green
      anomalySpike: 785
    }
  };

  const conf = metricsConfig[selectedMetric];

  // 2.0s Real-time IoT WebSocket listener
  useEffect(() => {
    wsRef.current = createTelemetryWebSocket(
      (payload) => {
        if (payload.type === 'TELEMETRY_FULL_TICK' || payload.type === 'TELEMETRY_TICK') {
          const aid = (assetId || 'A-317').toUpperCase();
          const assetTelemetry = payload.assets?.[aid];
          if (assetTelemetry) {
            setHistory((prev) => {
              const prevPoints = prev || [];
              const timeLabel = payload.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const nextPoint = {
                t: timeLabel,
                vibration: assetTelemetry.vibration,
                pressure: Math.round(assetTelemetry.pressure),
                temp: Math.round(assetTelemetry.temp)
              };
              // Keep up to 100 history points so user can pan back in time
              return [...prevPoints.slice(-99), nextPoint];
            });

            if (assetTelemetry.isSpike && !activeAnomaly) {
              setActiveAnomaly({
                sensor: assetTelemetry.activeAnomaly || 'vibration',
                value: assetTelemetry[assetTelemetry.activeAnomaly || 'vibration']
              });
            }
          }
        } else if (payload.type === 'ANOMALY_TRIGGERED') {
          setActiveAnomaly({
            sensor: payload.sensor,
            value: payload.spike_value
          });
        } else if (payload.type === 'ANOMALY_RESET') {
          setActiveAnomaly(null);
        }
      }
    );

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [assetId]);

  // Base fallback points if no history exists yet
  const allPoints = (history && history.length > 0)
    ? history
    : [
        { t: '14:00:00', vibration: 1.80, pressure: 2980, temp: 678 },
        { t: '14:01:15', vibration: 2.20, pressure: 2940, temp: 686 },
        { t: '14:02:30', vibration: 2.20, pressure: 2940, temp: 686 },
        { t: '14:03:45', vibration: 3.40, pressure: 2860, temp: 708 },
        { t: '14:05:00', vibration: 2.65, pressure: 2920, temp: 694 },
        { t: '14:06:15', vibration: 3.85, pressure: 2810, temp: 720 },
        { t: '14:07:30', vibration: 4.82, pressure: 2640, temp: 742 }
      ];

  const totalPoints = allPoints.length;
  const windowSize = Math.min(viewWindow, totalPoints);
  const maxPan = Math.max(0, totalPoints - windowSize);
  const currentPan = Math.min(panOffset, maxPan);
  const isLive = currentPan === 0;

  // Window slicing: if isLive, takes the last windowSize points. If rewound, offsets backwards.
  const displayPoints = isLive
    ? allPoints.slice(-windowSize)
    : allPoints.slice(totalPoints - windowSize - currentPan, totalPoints - currentPan);

  // Compact SVG Coordinate Geometry & Canvas dimensions
  const width = 720;
  const height = 185;   // Sleek, compact height
  const originX = 54;   // Left margin for vertical Y-axis & numbers
  const originY = 142;  // Bottom margin for horizontal X-axis & slanted labels
  const topY = 18;      // Top extremity of Y-axis line before arrowhead
  const plotWidth = 620;// Plot width across
  const rightX = originX + plotWidth; // Right extremity of X-axis line before arrowhead
  const plotHeight = originY - topY - 8;

  // Dynamic Y-axis scale auto-framing
  const values = displayPoints.map((item) => {
    const v = Number(item[selectedMetric] !== undefined ? item[selectedMetric] : conf.baseVal);
    return isNaN(v) ? conf.baseVal : v;
  });
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const dataSpan = dataMax - dataMin;

  const minSpan = selectedMetric === 'vibration' ? 1.0 : (selectedMetric === 'pressure' ? 140 : 30);
  const effectiveSpan = Math.max(dataSpan, minSpan);
  const pad = effectiveSpan * 0.22;

  const stepUnit = selectedMetric === 'vibration' ? 0.5 : (selectedMetric === 'pressure' ? 50 : 10);
  const rawFloor = Math.max(0, dataMin - pad);
  const rawCeil = dataMax + pad;

  const minVal = Number((Math.floor(rawFloor / stepUnit) * stepUnit).toFixed(conf.precision));
  const maxVal = Number((Math.ceil(rawCeil / stepUnit) * stepUnit).toFixed(conf.precision));
  const range = Math.max(0.1, maxVal - minVal);

  const getY = (val) => {
    const norm = Math.max(0, Math.min(1, (val - minVal) / range));
    return originY - (norm * plotHeight);
  };

  const getX = (idx, total) => {
    if (total <= 1) return originX + 25;
    const startX = originX + 28;
    const endX = rightX - 25;
    return startX + (idx / (total - 1)) * (endX - startX);
  };

  // Compute coordinate points for the line
  const coordinates = displayPoints.map((item, idx) => {
    const rawVal = Number(item[selectedMetric] !== undefined ? item[selectedMetric] : conf.baseVal);
    const x = getX(idx, displayPoints.length);
    const y = getY(rawVal);
    return {
      x,
      y,
      val: rawVal,
      t: item.t || `T-${idx}`
    };
  });

  // Polyline path (straight connected segments like user reference image)
  const linePath = coordinates.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    return `${acc} L ${pt.x},${pt.y}`;
  }, '');

  // Subtle translucent fill below the line
  const areaPath = coordinates.length > 0
    ? `${linePath} L ${coordinates[coordinates.length - 1].x},${originY} L ${coordinates[0].x},${originY} Z`
    : '';

  // Latest point & active readings
  const liveLatestPt = allPoints.length > 0 ? allPoints[allPoints.length - 1] : null;
  const liveVal = liveLatestPt ? Number(liveLatestPt[selectedMetric] ?? conf.baseVal) : conf.baseVal;
  
  const currentViewLatest = coordinates.length > 0 ? coordinates[coordinates.length - 1] : null;
  const currentViewFirst = coordinates.length > 0 ? coordinates[0] : null;
  const viewDelta = currentViewLatest && currentViewFirst ? (currentViewLatest.val - currentViewFirst.val) : 0;
  const isRising = viewDelta >= 0;

  // Active hover point
  const activePoint = hoveredIndex !== null && coordinates[hoveredIndex] ? coordinates[hoveredIndex] : currentViewLatest;

  // Y-axis division steps (4 ticks for compact height)
  const ySteps = 4;
  const yTicks = Array.from({ length: ySteps + 1 }, (_, i) => {
    const val = minVal + (i / ySteps) * range;
    const y = getY(val);
    return { val, y };
  });

  // Anomaly injector
  const handleInject = async () => {
    setIsInjecting(true);
    await injectTelemetryAnomaly({
      asset_id: assetId || 'A-317',
      sensor: selectedMetric,
      spike_value: conf.anomalySpike,
      duration_seconds: 45
    });
    setActiveAnomaly({ sensor: selectedMetric, value: conf.anomalySpike });
    setTimeout(() => setIsInjecting(false), 600);
  };

  return (
    <div style={{
      background: '#0c1322',
      border: '1px solid #1e293b',
      borderRadius: '10px',
      padding: '14px 18px',
      boxShadow: '0 6px 24px rgba(0, 0, 0, 0.4)',
      position: 'relative'
    }}>
      {/* Top Header & Metric Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '10px'
      }}>
        {/* Left: Metric Title & Current Live Reading */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: conf.lineColor,
                boxShadow: `0 0 8px ${conf.lineColor}`
              }}></div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                {conf.label}
              </h3>
              <span style={{
                fontSize: '0.68rem',
                color: '#94a3b8',
                background: '#1e293b',
                padding: '1px 6px',
                borderRadius: '4px'
              }}>
                {conf.sublabel}
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '2px 0 0 0' }}>
              {assetName || 'Sukhoi Su-30MKI'} ({assetId || 'A-317'}) &bull; Live Telemetry IoT Stream (2.0s)
            </p>
          </div>

          {/* Current Reading Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid #334155',
            padding: '4px 10px',
            borderRadius: '6px'
          }}>
            <span style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: conf.lineColor,
              fontFamily: 'Consolas, monospace'
            }}>
              {liveVal.toFixed(conf.precision)} {conf.unit}
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: isRising ? '#f87171' : '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}>
              {isRising ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {viewDelta >= 0 ? '+' : ''}{viewDelta.toFixed(conf.precision)}
            </span>
          </div>
        </div>

        {/* Right: Metric Selector Pills & Anomaly Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Metric Selector Pills */}
          <div style={{
            display: 'flex',
            background: '#070c16',
            border: '1px solid #334155',
            borderRadius: '5px',
            padding: '2px'
          }}>
            {Object.entries(metricsConfig).map(([key, item]) => (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                style={{
                  padding: '3px 9px',
                  border: 'none',
                  borderRadius: '3px',
                  background: selectedMetric === key ? conf.lineColor : 'transparent',
                  color: selectedMetric === key ? '#090d16' : '#94a3b8',
                  fontWeight: selectedMetric === key ? 700 : 500,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {key === 'vibration' ? 'Vibration' : key === 'pressure' ? 'Pressure' : 'Temperature'}
              </button>
            ))}
          </div>

          {/* Anomaly Injector Button */}
          <button
            onClick={handleInject}
            disabled={isInjecting}
            style={{
              padding: '4px 9px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '5px',
              color: '#f87171',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: isInjecting ? 'not-allowed' : 'pointer'
            }}
            title="Inject real-time sensor anomaly spike"
          >
            <Zap size={12} color="#f87171" />
            <span>{isInjecting ? 'Spiking...' : '⚡ Spike'}</span>
          </button>
        </div>
      </div>

      {/* Slim Status / Inspection Callout Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '5px 10px',
        background: isLive ? 'rgba(15, 23, 42, 0.6)' : 'rgba(245, 158, 11, 0.12)',
        border: isLive ? '1px solid #1e293b' : '1px solid rgba(245, 158, 11, 0.35)',
        borderRadius: '5px',
        marginBottom: '8px',
        fontSize: '0.74rem',
        color: '#cbd5e1'
      }}>
        <div>
          {isLive ? (
            <span>Sample: <strong style={{ color: '#ffffff' }}>{activePoint?.t}</strong> &bull; Value: <strong style={{ color: conf.lineColor }}>{activePoint?.val.toFixed(conf.precision)} {conf.unit}</strong></span>
          ) : (
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>
              ⏪ Viewing History: <strong>{displayPoints[0]?.t}</strong> &rarr; <strong>{displayPoints[displayPoints.length - 1]?.t}</strong> ({displayPoints.length} points | -{currentPan * 2}s offset)
            </span>
          )}
        </div>
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          color: activePoint && activePoint.val >= conf.threshold ? '#f87171' : '#34d399'
        }}>
          {activePoint && activePoint.val >= conf.threshold ? '⚠️ Threshold Exceeded' : '✅ Nominal Operating State'}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SVG COORDINATE LINE GRAPH WITH ARROW AXES & RING NODES    */}
      {/* ========================================================= */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', minWidth: '580px', display: 'block' }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            {/* Area Fill Gradient */}
            <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={conf.lineColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={conf.lineColor} stopOpacity="0.0" />
            </linearGradient>

            {/* Line Glow Filter */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Square Grid Lines */}
          {/* Horizontal Grid Lines */}
          {yTicks.map((tick, i) => (
            <line
              key={`h-grid-${i}`}
              x1={originX}
              y1={tick.y}
              x2={rightX}
              y2={tick.y}
              stroke="#1e293b"
              strokeWidth="1"
            />
          ))}

          {/* Vertical Grid Lines */}
          {coordinates.map((pt, i) => (
            <line
              key={`v-grid-${i}`}
              x1={pt.x}
              y1={topY}
              x2={pt.x}
              y2={originY}
              stroke="#1e293b"
              strokeWidth="1"
            />
          ))}

          {/* MIL-SPEC Threshold Guide Line (if within visible range) */}
          {conf.threshold >= minVal && conf.threshold <= maxVal && (
            <g>
              <line
                x1={originX}
                y1={getY(conf.threshold)}
                x2={rightX}
                y2={getY(conf.threshold)}
                stroke="#ef4444"
                strokeWidth="1.2"
                strokeDasharray="4,4"
                opacity="0.85"
              />
              <text
                x={rightX - 8}
                y={getY(conf.threshold) - 4}
                textAnchor="end"
                fill="#ef4444"
                fontSize="8.5"
                fontWeight="600"
                fontFamily="Consolas, monospace"
              >
                {conf.thresholdLabel}
              </text>
            </g>
          )}

          {/* Translucent Area Under Curve */}
          <path d={areaPath} fill="url(#lineAreaGrad)" />

          {/* Main Thick Trend Line */}
          <path
            d={linePath}
            fill="none"
            stroke={conf.lineColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#softGlow)"
          />

          {/* Prominent Circular Ring Markers / Nodes at each data point (⭕-style) */}
          {coordinates.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            const isLatest = isLive && i === coordinates.length - 1;

            return (
              <g
                key={`node-${i}`}
                onMouseEnter={() => setHoveredIndex(i)}
                style={{ cursor: 'pointer' }}
              >
                {/* Radar ping ring for the latest real-time point */}
                {isLatest && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="12"
                    fill="none"
                    stroke={conf.lineColor}
                    strokeWidth="1.2"
                    opacity="0.6"
                  >
                    <animate attributeName="r" values="6;15;6" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Outer Ring Node: Hollow center with thick border */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 7.5 : 5.5}
                  fill="#0c1322"
                  stroke={conf.lineColor}
                  strokeWidth={isHovered ? 4 : 3}
                />

                {/* Inner Dot for hovered or latest point */}
                {(isHovered || isLatest) && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="2"
                    fill="#ffffff"
                  />
                )}
              </g>
            );
          })}

          {/* ========================================================= */}
          {/* BOLD AXIS LINES WITH ARROWHEADS (MATCHING USER REFERENCE) */}
          {/* ========================================================= */}

          {/* VERTICAL Y-AXIS (Bold line pointing UP with arrowhead) */}
          <line
            x1={originX}
            y1={originY}
            x2={originX}
            y2={topY}
            stroke="#94a3b8"
            strokeWidth="2.5"
            strokeLinecap="square"
          />
          {/* Sharp Polygon Arrowhead pointing UP ▲ */}
          <polygon
            points={`${originX},${topY - 11} ${originX - 5},${topY + 2} ${originX + 5},${topY + 2}`}
            fill="#94a3b8"
          />

          {/* HORIZONTAL X-AXIS (Bold line pointing RIGHT with arrowhead) */}
          <line
            x1={originX}
            y1={originY}
            x2={rightX}
            y2={originY}
            stroke="#94a3b8"
            strokeWidth="2.5"
            strokeLinecap="square"
          />
          {/* Sharp Polygon Arrowhead pointing RIGHT ► */}
          <polygon
            points={`${rightX + 11},${originY} ${rightX - 2},${originY - 5} ${rightX - 2},${originY + 5}`}
            fill="#94a3b8"
          />

          {/* Y-Axis Tick Marks & Labels */}
          {yTicks.map((tick, i) => (
            <g key={`ytick-${i}`}>
              <line
                x1={originX - 5}
                y1={tick.y}
                x2={originX}
                y2={tick.y}
                stroke="#94a3b8"
                strokeWidth="1.2"
              />
              <text
                x={originX - 8}
                y={tick.y + 3.5}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="9"
                fontWeight="600"
                fontFamily="Consolas, monospace"
              >
                {tick.val.toFixed(conf.precision)}
              </text>
            </g>
          ))}

          {/* X-Axis Tick Marks & Angled Labels (Slanted 35°) */}
          {coordinates.map((pt, i) => (
            <g key={`xtick-${i}`}>
              <line
                x1={pt.x}
                y1={originY}
                x2={pt.x}
                y2={originY + 5}
                stroke="#94a3b8"
                strokeWidth="1.2"
              />
              <text
                x={pt.x - 3}
                y={originY + 15}
                transform={`rotate(35, ${pt.x - 3}, ${originY + 15})`}
                textAnchor="start"
                fill="#94a3b8"
                fontSize="8.5"
                fontWeight="600"
                fontFamily="Consolas, monospace"
              >
                {pt.t}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* ========================================================= */}
      {/* TIMELINE SCRUBBER & HISTORY TRAVEL CONTROLS               */}
      {/* ========================================================= */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '8px',
        padding: '6px 12px',
        background: '#070d18',
        borderRadius: '6px',
        border: '1px solid #1e293b'
      }}>
        {/* Left: Window Size Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Window:</span>
          {[8, 16, 25].map((w) => (
            <button
              key={w}
              onClick={() => { setViewWindow(w); setPanOffset(0); }}
              style={{
                padding: '2px 7px',
                fontSize: '0.7rem',
                borderRadius: '3px',
                border: viewWindow === w ? '1px solid #3b82f6' : '1px solid #334155',
                background: viewWindow === w ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: viewWindow === w ? '#60a5fa' : '#94a3b8',
                cursor: 'pointer',
                fontWeight: viewWindow === w ? 700 : 500
              }}
            >
              {w} pts
            </button>
          ))}
        </div>

        {/* Center: Timeline Scrubber / Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px', maxWidth: '380px' }}>
          <button
            onClick={() => setPanOffset((p) => Math.min(maxPan, p + 1))}
            disabled={currentPan >= maxPan}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              borderRadius: '4px',
              color: currentPan >= maxPan ? '#475569' : '#94a3b8',
              fontSize: '0.7rem',
              padding: '2px 6px',
              cursor: currentPan >= maxPan ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}
            title="Step 1 tick backward in history"
          >
            <ArrowLeft size={11} /> -2s
          </button>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <input
              type="range"
              min="0"
              max={maxPan}
              value={maxPan - currentPan}
              onChange={(e) => setPanOffset(maxPan - Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: isLive ? '#10b981' : '#f59e0b',
                cursor: 'pointer',
                height: '4px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.64rem', color: '#64748b' }}>
              <span>⏪ History ({totalPoints} ticks)</span>
              <span style={{ color: isLive ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                {isLive ? '🟢 LIVE TAIL' : `⏪ -${currentPan * 2}s ago`}
              </span>
            </div>
          </div>

          <button
            onClick={() => setPanOffset((p) => Math.max(0, p - 1))}
            disabled={isLive}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              borderRadius: '4px',
              color: isLive ? '#475569' : '#94a3b8',
              fontSize: '0.7rem',
              padding: '2px 6px',
              cursor: isLive ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}
            title="Step 1 tick forward"
          >
            +2s <ArrowRight size={11} />
          </button>
        </div>

        {/* Right: Jump to Live button */}
        <div>
          {!isLive ? (
            <button
              onClick={() => setPanOffset(0)}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                color: '#34d399',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RotateCcw size={11} />
              <span>Jump to Live</span>
            </button>
          ) : (
            <span style={{
              fontSize: '0.7rem',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
              Live (2.0s)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
