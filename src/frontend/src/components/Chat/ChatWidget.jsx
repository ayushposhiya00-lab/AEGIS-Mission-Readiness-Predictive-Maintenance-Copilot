import React from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';

export default function ChatWidget({ onClick, isOpen }) {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      className="btn btn-primary"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 80,
        borderRadius: 'var(--radius-full)',
        padding: '10px 18px',
        boxShadow: 'var(--shadow-lg)',
        fontSize: '0.88rem',
        fontWeight: 600,
        gap: '8px'
      }}
    >
      <Sparkles size={16} />
      <span>Ask Copilot</span>
    </button>
  );
}
