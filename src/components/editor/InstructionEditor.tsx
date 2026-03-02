"use client";

import { useRef, useCallback } from "react";
import { App, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { usePlcStore } from "../../store/plcStore";
import { useGenerateLogic } from "../../hooks/useGenerateLogic";

const MAX_CHARS = 500;

const TEMPLATES: MenuProps["items"] = [
  {
    key: "1",
    label: "Motor Start / Stop",
    onClick: () => {/* handled via onMenuClick */ },
  },
  {
    key: "2",
    label: "Safety Interlock",
    onClick: () => { },
  },
  {
    key: "3",
    label: "Conveyor Belt",
    onClick: () => { },
  },
  {
    key: "4",
    label: "Timer Delay Coil",
    onClick: () => { },
  },
];

const TEMPLATE_VALUES: Record<string, string> = {
  "1": "Start motor on X0. Stop on X1. Emergency stop X2. Output to Y0.",
  "2": "Start signal X0. Safety interlock X1 (normally closed). Fault reset X2. Output relay Y0.",
  "3": "Conveyor start X0. Emergency stop X1. Motor output Y0. Running indicator lamp Y1.",
  "4": "Start trigger X0. After 5-second delay, activate output coil Y0. Stop on X1.",
};

function CodeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <polyline points="3.5,1.5 0,6 3.5,10.5" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <polyline points="8.5,1.5 12,6 8.5,10.5" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="4.5" y1="9" x2="7.5" y2="3" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <polyline points="2,3.5 5,6.5 8,3.5" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export default function InstructionEditor() {
  const { message } = App.useApp();
  const { inputText, setInputText, resetAll } = usePlcStore();
  const generateMutation = useGenerateLogic();
  const lineNumRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lineCount = Math.max(inputText.split("\n").length, 3);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const syncScroll = useCallback(() => {
    if (textareaRef.current && lineNumRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const handleGenerate = () => {
    if (!inputText.trim()) {
      message.warning("Please describe your automation logic first.");
      return;
    }
    generateMutation.mutate(inputText);
  };

  const handleTemplateClick: MenuProps["onClick"] = ({ key }) => {
    setInputText(TEMPLATE_VALUES[key] ?? "");
  };

  const templateItems: MenuProps["items"] = (TEMPLATES || []).map((item: any) => ({
    ...item,
    onClick: undefined,
  }));

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-panel)',
    }}>

      {/* ── Panel header ────────────────────────────────────── */}
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
          <CodeIcon />
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: '11px',
            letterSpacing: '1.1px',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}>
            INSTRUCTION INPUT
          </span>
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-muted)',
        }}>
          {inputText.length} / {MAX_CHARS}
        </span>
      </div>

      {/* ── TEMPLATES dropdown ──────────────────────────────── */}
      <div style={{ padding: '8px 12px 0', flexShrink: 0 }}>
        <Dropdown
          menu={{ items: templateItems, onClick: handleTemplateClick }}
          trigger={["click"]}
        >
          <button style={{
            height: '24px',
            padding: '0 8px',
            backgroundColor: 'var(--bg-card)',
            border: '0.8px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 500,
            fontSize: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            TEMPLATES <ChevronDownIcon />
          </button>
        </Dropdown>
      </div>

      {/* ── Code editor (line numbers + textarea) ───────────── */}
      <div style={{
        flex: 1,
        margin: '8px 12px 0',
        border: '0.8px solid var(--border)',
        borderRadius: '4px',
        overflow: 'hidden',
        display: 'flex',
        position: 'relative',
        minHeight: 0,
      }}>
        {/* Line numbers */}
        <div
          ref={lineNumRef}
          style={{
            width: '28px',
            flexShrink: 0,
            backgroundColor: 'var(--bg-card)',
            overflowY: 'hidden',
            padding: '8px 4px',
            userSelect: 'none',
          }}
        >
          {lineNumbers.map((n) => (
            <div key={n} style={{
              height: '20px',
              textAlign: 'right',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              lineHeight: '20px',
              color: 'var(--text-muted)',
              paddingRight: '4px',
            }}>
              {n}
            </div>
          ))}
        </div>

        {/* Placeholder overlay (visible when textarea is empty) */}
        {!inputText && (
          <div style={{
            position: 'absolute',
            left: '28px',
            top: '8px',
            right: 0,
            padding: '0 8px',
            pointerEvents: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            lineHeight: '20px',
            color: 'var(--text-muted)',
            opacity: 0.5,
          }}>
            <div>{`> Start motor when X0 = ON`}</div>
            <div>{`> Stop on X1 or fault Y3`}</div>
            <div>{`> Latch coil M10 after 3 sec delay`}</div>
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value.slice(0, MAX_CHARS))}
          onScroll={syncScroll}
          spellCheck={false}
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-editor)',
            color: 'var(--text-primary)',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            lineHeight: '20px',
            padding: '8px',
            minHeight: 0,
            height: '100%',
          }}
        />
      </div>

      {/* ── Action buttons ───────────────────────────────────── */}
      <div style={{
        height: '60px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px',
      }}>
        {/* GENERATE LOGIC */}
        <button
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          style={{
            flex: 1,
            height: '34px',
            border: 'none',
            borderRadius: '8px',
            background: 'linear-gradient(170deg, #06b6d4 0%, #0891b2 100%)',
            opacity: !inputText.trim() || generateMutation.isPending ? 0.5 : 1,
            cursor: !inputText.trim() || generateMutation.isPending ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: '#050d1a',
            fontFamily: 'var(--font-mono)',
            fontWeight: 500,
            fontSize: '11px',
            letterSpacing: '0.88px',
          }}
        >
          {generateMutation.isPending ? (
            <span>⠋ GENERATING...</span>
          ) : (
            <>
              <span>▶</span>
              <span>GENERATE LOGIC</span>
            </>
          )}
        </button>

        {/* CLEAR */}
        <button
          onClick={() => resetAll()}
          style={{
            height: '34px',
            padding: '0 14px',
            border: '0.8px solid var(--border)',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          ✕ CLEAR
        </button>
      </div>

    </div>
  );
}
