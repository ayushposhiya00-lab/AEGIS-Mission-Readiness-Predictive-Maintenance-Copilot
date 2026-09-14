// API Client connecting to FastAPI backend (http://127.0.0.1:8000)
// Falls back to local dataset if backend is offline

import { DEFENSE_ASSETS, DEFENSE_SYSTEM_METRICS, MAINTENANCE_WORK_ORDERS } from '../data/mockDefenseData';

const BACKEND_URL = 'http://127.0.0.1:8000';

export async function fetchLiveAssets() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/assets`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { data, isLive: true };
  } catch (err) {
    // Fallback to local data
    return { data: DEFENSE_ASSETS, isLive: false };
  }
}

export async function fetchLiveMetrics() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/metrics`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { data, isLive: true };
  } catch (err) {
    return { data: DEFENSE_SYSTEM_METRICS, isLive: false };
  }
}

export async function fetchLiveWorkOrders() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/work-orders`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { data, isLive: true };
  } catch (err) {
    return { data: MAINTENANCE_WORK_ORDERS, isLive: false };
  }
}

// Register a new defense asset with live ML scoring
export async function registerNewAsset(assetPayload) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assetPayload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to register asset`);
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error('Error in registerNewAsset:', err);
    return { success: false, error: err.message };
  }
}

// Upload a batch telemetry CSV (up to 5,000+ rows) for vectorized ML scoring
export async function uploadTelemetryCsv(file, modelType = 'auto') {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_type', modelType);

    const res = await fetch(`${BACKEND_URL}/api/upload-csv`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || `HTTP ${res.status}: Upload failed`);
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error('Error in uploadTelemetryCsv:', err);
    return { success: false, error: err.message };
  }
}

// Fetch historical batch ingestion runs from SQLite
export async function fetchBatches() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/batches`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    return [];
  }
}

// Fetch single batch detail
export async function fetchBatchDetail(batchId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/batches/${batchId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
}

// URL to download instant sample 5,000-row telemetry CSV
export function getSampleCsvDownloadUrl(model = 'armor', rows = 5000) {
  return `${BACKEND_URL}/api/sample-csv?model=${model}&rows=${rows}`;
}

// Send user query to Copilot Backend (Groq LPU LLM / Local RAG Engine)
export async function sendCopilotChat({ message, scopedAssetId = null, apiKey = null, history = [] }) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        scopedAssetId,
        apiKey: apiKey || localStorage.getItem('defense_groq_api_key') || null,
        history
      })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error('Chat error:', err);
    throw err;
  }
}

// Fetch chat engine status (whether Groq or Local RAG is active)
export async function fetchChatStatus() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/chat/status`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

// Save Groq or Gemini API key to backend and localStorage
export async function saveChatApiKey(apiKey, provider = 'groq') {
  try {
    localStorage.setItem('defense_groq_api_key', apiKey);
    const res = await fetch(`${BACKEND_URL}/api/chat/set-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, provider })
    });
    return await res.json();
  } catch (err) {
    console.error('Error saving API key:', err);
    return { status: 'local_only', message: 'Key saved in browser memory.' };
  }
}

// Fetch Explainable AI (XAI) feature attribution for an asset
export async function fetchAssetExplanation(assetId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/assets/${assetId}/explain`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching XAI explanation:', err);
    return null;
  }
}

// Inject synthetic telemetry anomaly over REST / WebSocket
export async function injectTelemetryAnomaly({ asset_id = 'A-317', sensor = 'vibration', spike_value = 5.45, duration_seconds = 45 }) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/telemetry/inject-anomaly`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id, sensor, spike_value, duration_seconds })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error injecting anomaly:', err);
    return { status: 'error', message: err.message };
  }
}

// Reset active telemetry anomaly
export async function resetTelemetryAnomaly(asset_id = null) {
  try {
    const url = asset_id ? `${BACKEND_URL}/api/telemetry/reset-anomaly?asset_id=${asset_id}` : `${BACKEND_URL}/api/telemetry/reset-anomaly`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error resetting anomaly:', err);
    return { status: 'error', message: err.message };
  }
}

// Engineer confirms repair complete — resets asset to nominal, drift resumes in 10-13s
export async function confirmRepairComplete(asset_id) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/telemetry/complete-repair/${asset_id}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error confirming repair:', err);
    return { status: 'error', message: err.message };
  }
}

// Real-time WebSocket connection to /ws/telemetry
export function createTelemetryWebSocket(onMessage, onStatusChange) {
  const wsUrl = BACKEND_URL.replace(/^http/, 'ws') + '/ws/telemetry';
  let ws = null;
  let reconnectTimer = null;
  let isClosedManually = false;

  function connect() {
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (onStatusChange) onStatusChange('connected');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (onMessage) onMessage(payload);
        } catch (e) {
          console.error('WebSocket JSON parse error:', e);
        }
      };

      ws.onerror = (err) => {
        if (onStatusChange) onStatusChange('error');
      };

      ws.onclose = () => {
        if (onStatusChange) onStatusChange('disconnected');
        if (!isClosedManually) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      if (onStatusChange) onStatusChange('error');
    }
  }

  connect();

  return {
    send: (data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      }
    },
    close: () => {
      isClosedManually = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    }
  };
}


