import React from 'react';
import { Bot, User, ArrowRight, Wrench, Zap, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function MessageBubble({ message, onSelectAssetId, onNavigateTab }) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  if (isSystem) {
    return (
      <div style={{
        padding: '8px 12px',
        background: 'var(--primary-subtle)',
        border: '1px solid rgba(37, 99, 235, 0.25)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.75rem',
        color: '#93c5fd',
        textAlign: 'center'
      }}>
        {message.text}
      </div>
    );
  }

  const action = message.actionTaken;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      maxWidth: '85%',
      alignSelf: isUser ? 'flex-end' : 'flex-start'
    }}>
      {/* Sender info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '4px',
        fontSize: '0.72rem',
        color: 'var(--text-dim)'
      }}>
        {isUser ? <User size={12} /> : <Bot size={12} color="var(--primary)" />}
        <span>{isUser ? 'You' : 'Copilot AI'}</span>
        <span>&bull; {message.time}</span>
      </div>

      {/* Bubble container */}
      <div style={{
        background: isUser ? 'var(--primary)' : 'var(--bg-surface-elevated)',
        color: isUser ? '#ffffff' : 'var(--text-main)',
        border: '1px solid ' + (isUser ? 'var(--primary)' : 'var(--border-subtle)'),
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.84rem',
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap'
      }}>
        {message.text}

        {/* Tactical Action Card: Work Order Dispatched */}
        {action && action.type === 'WORK_ORDER_DISPATCHED' && (
          <div style={{
            marginTop: '12px',
            padding: '12px 14px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 700, fontSize: '0.84rem' }}>
                <Wrench size={15} />
                <span>{action.title}</span>
              </div>
              <span className="badge badge-critical" style={{ fontSize: '0.66rem', padding: '2px 6px' }}>
                PERSISTED TO DB
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginBottom: '10px', lineHeight: 1.5 }}>
              <div>• <strong>Asset:</strong> {action.order?.assetName} ({action.order?.assetId})</div>
              <div>• <strong>Task:</strong> {action.order?.task}</div>
              <div>• <strong>Assigned Unit:</strong> {action.order?.assignedCrew}</div>
              <div>• <strong>Status:</strong> {action.order?.status} &bull; Due in {action.order?.dueInHours}h</div>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab('maintenance')}
              className="btn btn-sm"
              style={{
                background: 'rgba(16, 185, 129, 0.22)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                color: '#10b981',
                fontSize: '0.75rem',
                padding: '4px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span>View in Maintenance Plan</span>
              <ArrowRight size={12} />
            </button>
          </div>
        )}

        {/* Tactical Action Card: Mission Stress Simulation */}
        {action && action.type === 'MISSION_STRESS_SIMULATION' && (
          <div style={{
            marginTop: '12px',
            padding: '12px 14px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 700, fontSize: '0.84rem', marginBottom: '8px' }}>
              <Zap size={15} />
              <span>{action.title}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              <div>• <strong>Envelope:</strong> {action.result?.ambientTemp} &bull; {action.result?.missionDuration}</div>
              <div>• <strong>Survivability:</strong> <strong style={{ color: action.result?.projectedSurvivability?.includes('PASS') ? '#10b981' : '#ef4444' }}>{action.result?.projectedSurvivability}</strong></div>
              <div>• <strong>Thermal Stress:</strong> {action.result?.thermalDegradation}</div>
            </div>
          </div>
        )}

        {/* Tactical Action Card: XAI Feature Attribution Breakdown */}
        {action && action.type === 'XAI_EXPLANATION' && (
          <div style={{
            marginTop: '12px',
            padding: '12px 14px',
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontWeight: 700, fontSize: '0.84rem', marginBottom: '8px' }}>
              <Cpu size={15} />
              <span>{action.title}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginBottom: '8px' }}>
              {action.explanation?.attributions?.slice(0, 3).map((attr, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                  <span>{attr.feature}:</span>
                  <strong style={{ color: attr.direction === 'risk_increase' ? '#f87171' : '#34d399' }}>
                    {attr.contributionPct}% ({attr.current})
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Asset shortcuts if any */}
        {message.highlightAssetIds && message.highlightAssetIds.length > 0 && (
          <div style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid ' + (isUser ? 'rgba(255,255,255,0.2)' : 'var(--border-subtle)'),
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '0.72rem', color: isUser ? '#dbeafe' : 'var(--text-muted)' }}>
              Linked Assets:
            </span>
            {message.highlightAssetIds.map((id) => (
              <button
                key={id}
                onClick={() => onSelectAssetId && onSelectAssetId(id)}
                style={{
                  background: isUser ? 'rgba(255,255,255,0.2)' : 'var(--bg-surface)',
                  border: '1px solid ' + (isUser ? 'rgba(255,255,255,0.3)' : 'var(--border-medium)'),
                  color: isUser ? '#ffffff' : 'var(--primary)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{id}</span>
                <ArrowRight size={10} />
              </button>
            ))}
          </div>
        )}

        {/* Engine source tag for bot */}
        {!isUser && message.source && (
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{
              fontSize: '0.66rem',
              color: 'var(--text-dim)',
              fontStyle: 'italic',
              opacity: 0.8
            }}>
              via {message.source.includes('react_agent') ? '⚡ ReAct Autonomous Agent (Tool Execution)' : message.source.includes('groq') ? '⚡ Groq (Llama 3.3 70B)' : message.source === 'local_rag' ? '🤖 Defense RAG Engine' : message.source}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
