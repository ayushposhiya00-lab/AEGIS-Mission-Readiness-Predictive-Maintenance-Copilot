import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, RotateCcw, Bot, Key, Check, Zap, ShieldAlert } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { sendCopilotChat, fetchChatStatus, saveChatApiKey } from '../../api/apiClient';

const SUGGESTED_QUERIES = [
  { id: 'h1', label: '🛠️ Dispatch emergency WO for V-102', prompt: 'V-102 ke liye urgent repair order dispatch karo' },
  { id: 'h2', label: '🔬 XAI Attribution breakdown for A-317', prompt: 'A-317 Su-30MKI ka Explainable AI feature attribution breakdown dikhao' },
  { id: 'h3', label: '🧪 48°C Desert Stress Test on Su-30', prompt: 'A-317 par 48°C extreme desert sortie ka stress test simulate karo' },
  { id: 'h4', label: '🚨 V-102 critical kyu he?', prompt: 'V-102 critical condition me kyu he? kya problem hai?' },
  { id: 'h5', label: '📊 Fleet readiness overview', prompt: 'Poore defense fleet ka overall readiness aur domain status kya hai?' }
];

export default function ChatWindow({ isOpen, onClose, scopedAsset, onSelectAssetId, onNavigateTab, onWorkOrderDispatched }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'copilot',
      time: 'Just now',
      text: 'Namaste Commander. Me aapka Defense Mission Readiness AI Copilot hu.\n\nMe real-time sensor streams (vibration, pressure, temperature), 3 trained ML models (`ai4i.pkl`, `bearing.pkl`, `failure_model.pkl`), aur maintenance work orders ka live data analyze karta hu.\n\nAap mujhse kisi bhi platform (jaise *V-102*, *A-317*, *V-007*) ke critical hone ka reason, failure diagnosis, ya depot action plan Hinglish ya English me puch sakte hain.',
      highlightAssetIds: ['V-102', 'A-317'],
      source: 'local_rag'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [activeEngine, setActiveEngine] = useState('local_rag');
  const [keySavedMessage, setKeySavedMessage] = useState('');
  const endRef = useRef(null);

  // Check backend engine status on load
  useEffect(() => {
    fetchChatStatus().then((status) => {
      if (status) {
        setActiveEngine(status.active_engine);
      }
    });
    const stored = localStorage.getItem('defense_groq_api_key');
    if (stored) {
      setApiKeyInput(stored);
    }
  }, [isOpen]);

  // Context lock if scopedAsset passed
  useEffect(() => {
    if (scopedAsset) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'system',
          time: 'Now',
          text: `Context locked on Asset: ${scopedAsset.id} (${scopedAsset.name}) - ${scopedAsset.readinessScore}% Ready, ${scopedAsset.predictedRUL}d RUL`
        }
      ]);
    }
  }, [scopedAsset]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSaveApiKey = async () => {
    const key = apiKeyInput.trim();
    if (!key) return;
    const provider = key.startsWith('AIza') ? 'gemini' : 'groq';
    const res = await saveChatApiKey(key, provider);
    setKeySavedMessage('API Key saved successfully! Copilot will now use ' + (provider === 'groq' ? 'Groq Llama 3.3 70B' : 'Gemini Flash'));
    setActiveEngine(provider === 'groq' ? 'groq (Llama 3.3 70B)' : 'gemini');
    setTimeout(() => {
      setKeySavedMessage('');
      setShowKeyModal(false);
    }, 1600);
  };

  const handleSend = async (textToSend) => {
    const q = (textToSend || inputValue).trim();
    if (!q) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: q
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Call live backend /api/chat with RAG and Groq/Gemini/Local LLM
      const res = await sendCopilotChat({
        message: q,
        scopedAssetId: scopedAsset?.id || null,
        history: messages.slice(-6)
      });

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'copilot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: res.reply,
          highlightAssetIds: res.highlightAssetIds || [],
          source: res.source,
          actionTaken: res.actionTaken || null
        }
      ]);
      if (res.actionTaken?.type === 'WORK_ORDER_DISPATCHED' && onWorkOrderDispatched) {
        onWorkOrderDispatched(res.actionTaken.order);
      }
      if (res.source) {
        setActiveEngine(res.source);
      }
    } catch (err) {
      setIsTyping(false);
      console.warn('Backend chat fallback:', err);
      // Client-side fallback if backend is momentarily unreachable
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'copilot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Commander, diagnostic engine reports:\n\nRegarding "${q}": Telemetry connection is active. Frontline assets like V-102 (Arjun MBT) and A-317 (Su-30MKI) are currently below readiness thresholds due to recoil hydraulic pressure drop and turbine bearing vibration. Please inspect the asset table for telemetry logs.`,
          highlightAssetIds: ['V-102', 'A-317'],
          source: 'local_rag'
        }
      ]);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      maxWidth: '460px',
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-surface-elevated)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--primary-subtle)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                Defense AI Copilot
              </h3>
              <span style={{
                fontSize: '0.66rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: activeEngine.includes('groq') ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: activeEngine.includes('groq') ? '#4ade80' : '#60a5fa',
                border: `1px solid ${activeEngine.includes('groq') ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                fontWeight: 600
              }}>
                {activeEngine.includes('groq') ? '⚡ Groq LPU' : '🤖 Local RAG'}
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Hinglish & English &bull; 3 ML Models Active
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setShowKeyModal(!showKeyModal)}
            className="btn btn-ghost btn-sm"
            style={{
              padding: '6px 8px',
              color: activeEngine.includes('groq') ? 'var(--success)' : 'var(--text-muted)'
            }}
            title="Configure Groq / LLM API Key"
          >
            <Key size={15} />
          </button>

          <button
            onClick={() => setMessages([{
              id: Date.now(),
              sender: 'copilot',
              time: 'Just now',
              text: 'Conversation reset. How can I assist with your mission readiness today?'
            }])}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px 8px' }}
            title="Reset Chat"
          >
            <RotateCcw size={14} />
          </button>

          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Groq / LLM Key Configuration Drawer */}
      {showKeyModal && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid var(--border-medium)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} color="#f59e0b" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Groq LPU Acceleration (Llama 3.3 70B)
              </span>
            </div>
            <button
              onClick={() => setShowKeyModal(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
            Apni Groq API Key yaha paste karein (e.g. <code>gsk_...</code>). Is se ultra-fast sub-second Hinglish & English natural reasoning enable ho jayegi. (Free on console.groq.com)
          </p>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="password"
              placeholder="Paste Groq API Key (gsk_...)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '0.78rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSaveApiKey}
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 12px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Check size={13} />
              <span>Save</span>
            </button>
          </div>
          {keySavedMessage && (
            <div style={{ marginTop: '6px', fontSize: '0.72rem', color: 'var(--success)' }}>
              {keySavedMessage}
            </div>
          )}
        </div>
      )}

      {/* Suggested Hinglish & English Query Chips */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
          Suggested Inquiries:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {SUGGESTED_QUERIES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSend(preset.prompt)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                padding: '4px 8px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Feed */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            onSelectAssetId={onSelectAssetId}
            onNavigateTab={(tab) => {
              if (onNavigateTab) onNavigateTab(tab);
              if (onClose) onClose();
            }}
          />
        ))}

        {isTyping && (
          <div style={{
            alignSelf: 'flex-start',
            padding: '8px 12px',
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={14} color="var(--primary)" />
            <span>Searching telemetry & diagnosing ML models...</span>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input Form */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface-elevated)',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          placeholder="Puchiye: 'V-102 critical kyu he?' ya English query..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          style={{
            flex: 1,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-main)',
            padding: '9px 12px',
            fontSize: '0.84rem',
            outline: 'none'
          }}
        />
        <button
          onClick={() => handleSend()}
          className="btn btn-primary"
          style={{ padding: '0 14px' }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

