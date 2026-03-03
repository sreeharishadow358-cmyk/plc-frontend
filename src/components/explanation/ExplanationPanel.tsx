"use client";

import { Alert } from "antd";
import { usePlcStore } from "../../store/plcStore";
import { useGenerateLogic } from "../../hooks/useGenerateLogic";

// ── Icons ─────────────────────────────────────────────────────────────────────

function SparklesIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 1L7.09 4.26L10.5 4.26L7.7 6.24L8.79 9.5L6 7.52L3.21 9.5L4.3 6.24L1.5 4.26L4.91 4.26L6 1Z"
        stroke="#a855f7" strokeWidth="1.1" strokeLinejoin="round" fill="rgba(168,85,247,0.2)" />
    </svg>
  );
}

function EmptyAIIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      {/* Head */}
      <rect x="20" y="18" width="40" height="32" rx="6" stroke="#1e3a5f" strokeWidth="2" />
      {/* Eyes */}
      <rect x="28" y="28" width="8" height="8" rx="2" fill="#a855f7" fillOpacity="0.25" stroke="#1e3a5f" strokeWidth="1.5" />
      <rect x="44" y="28" width="8" height="8" rx="2" fill="#a855f7" fillOpacity="0.25" stroke="#1e3a5f" strokeWidth="1.5" />
      {/* Mouth */}
      <line x1="30" y1="42" x2="50" y2="42" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
      {/* Antenna */}
      <line x1="40" y1="18" x2="40" y2="10" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="8" r="3" fill="#a855f7" fillOpacity="0.3" stroke="#1e3a5f" strokeWidth="1.5" />
      {/* Body */}
      <rect x="26" y="52" width="28" height="16" rx="3" stroke="#1e3a5f" strokeWidth="2" />
      {/* Body details */}
      <line x1="33" y1="58" x2="47" y2="58" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="35" y1="62" x2="45" y2="62" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" />
      {/* Arms */}
      <line x1="26" y1="56" x2="18" y2="60" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
      <line x1="54" y1="56" x2="62" y2="60" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ExplanationPanel() {
  const { explanation, errorMessage, inputText } = usePlcStore();
  const generateMutation = useGenerateLogic();

  const hasContent = !!explanation;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-panel)',
    }}>

      {/* ── Panel header ──────────────────────────────────────── */}
      <div style={{
        height: '32px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        borderBottom: '0.8px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SparklesIcon />
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: '11px',
            letterSpacing: '1.1px',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}>
            AI EXPLANATION
          </span>
        </div>

        {/* Groq / Llama badge */}
        <div style={{
          backgroundColor: 'rgba(168,85,247,0.15)',
          border: '0.8px solid rgba(168,85,247,0.3)',
          borderRadius: '9999px',
          padding: '3px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}>
          <div style={{
            width: '5px', height: '5px',
            borderRadius: '50%',
            backgroundColor: '#a855f7',
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: '#a855f7',
          }}>
            Llama 3.3
          </span>
        </div>
      </div>

      {/* ── Content area ──────────────────────────────────────── */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: hasContent || errorMessage ? 'flex-start' : 'center',
        justifyContent: hasContent || errorMessage ? 'flex-start' : 'center',
        padding: hasContent || errorMessage ? '16px' : '0',
      }}>

        {/* Error alert */}
        {errorMessage && (
          <Alert
            type="error"
            showIcon
            title={errorMessage}
            style={{ marginBottom: '12px', width: '100%' }}
          />
        )}

        {!hasContent ? (
          /* Empty state */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            textAlign: 'center',
            padding: '0 24px',
          }}>
            <EmptyAIIcon />
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              color: 'var(--text-secondary)',
            }}>
              Waiting for generation...
            </span>
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
            }}>
              AI will explain the generated logic in plain English.
            </span>
          </div>
        ) : (
          /* Explanation content */
          <div style={{ width: '100%' }}>
            {/* Section header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '12px',
            }}>
              <div style={{
                width: '3px',
                height: '14px',
                backgroundColor: '#a855f7',
                borderRadius: '2px',
              }} />
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '11px',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}>
                Logic Overview
              </span>
            </div>

            {/* Explanation text */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '0.8px solid var(--border)',
              borderRadius: '6px',
              padding: '14px',
            }}>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                margin: 0,
              }}>
                {explanation}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Action buttons ────────────────────────────────────── */}
      <div style={{
        height: '96px',
        flexShrink: 0,
        borderTop: '0.8px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
      }}>
        {/* Regenerate */}
        <button
          onClick={() => generateMutation.mutate(inputText)}
          disabled={!inputText.trim() || generateMutation.isPending}
          style={{
            flex: 1,
            border: '0.8px solid rgba(168,85,247,0.4)',
            borderRadius: '6px',
            backgroundColor: 'rgba(168,85,247,0.08)',
            color: !inputText.trim() || generateMutation.isPending ? '#475569' : '#a855f7',
            fontFamily: 'var(--font-mono)',
            fontWeight: 500,
            fontSize: '11px',
            letterSpacing: '0.88px',
            cursor: !inputText.trim() || generateMutation.isPending ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          {generateMutation.isPending ? '⠋ REGENERATING...' : '↺  REGENERATE'}
        </button>

        {/* Edit Prompt */}
        <button
          disabled
          style={{
            flex: 1,
            border: '0.8px solid var(--border)',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 500,
            fontSize: '11px',
            letterSpacing: '0.88px',
            cursor: 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          ✎  EDIT PROMPT
        </button>
      </div>

    </div>
  );
}
