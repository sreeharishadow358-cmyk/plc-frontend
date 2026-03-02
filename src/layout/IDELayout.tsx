"use client";

import InstructionEditor from '../components/editor/InstructionEditor';
import LadderPreview from '../components/ladder/LadderPreview';
import ExplanationPanel from '../components/explanation/ExplanationPanel';
import OutputConsole from '../components/console/OutputConsole';
import { useThemeStore } from '../store/themeStore';

// ── Inline SVG icons ─────────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="1" stroke="white" strokeWidth="1.4" />
      <rect x="5.5" y="5.5" width="3" height="3" fill="white" rx="0.5" />
      <line x1="0" y1="7" x2="3" y2="7" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="11" y1="7" x2="14" y2="7" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="7" y1="0" x2="7" y2="3" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="7" y1="11" x2="7" y2="14" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="2" stroke="#94a3b8" strokeWidth="1.3" />
      <path d="M7 1v1.5M7 11.5V13M13 7h-1.5M2.5 7H1M11.24 2.76l-1.06 1.06M3.82 10.18l-1.06 1.06M11.24 11.24l-1.06-1.06M3.82 3.82L2.76 2.76"
        stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M12 7.5A5 5 0 1 1 6.5 2a3.5 3.5 0 0 0 5.5 5.5z"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7 1v1.5M7 11.5V13M13 7h-1.5M2.5 7H1M11.24 2.76l-1.06 1.06M3.82 10.18l-1.06 1.06M11.24 11.24l-1.06-1.06M3.82 3.82L2.76 2.76"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

const S = {
  monoSm: {
    fontFamily: "var(--font-mono)",
    fontSize: '11px' as const,
  },
  monoXs: {
    fontFamily: "var(--font-mono)",
    fontSize: '10px' as const,
  },
  divider: {
    width: '1px',
    height: '20px',
    backgroundColor: '#1e3a5f',
    flexShrink: 0 as const,
  },
  iconBtn: {
    width: '26px',
    height: '26px',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    background: 'none',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    padding: 0,
  },
} as const;

export default function IDELayout() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-base)',
      overflow: 'hidden',
    }}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <header style={{
        height: '52px',
        flexShrink: 0,
        backgroundColor: 'var(--bg-card)',
        borderBottom: '0.8px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
      }}>
        {/* Left: logo + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '28px', height: '28px',
            backgroundColor: 'var(--cyan)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <LogoIcon />
          </div>

          <span style={{
            fontFamily: 'var(--font-brand)',
            fontWeight: 700,
            fontSize: '16px',
            color: 'white',
            whiteSpace: 'nowrap',
          }}>
            PLC·AI
          </span>

          <div style={S.divider} />

          <div style={{
            backgroundColor: 'var(--bg-panel)',
            border: '0.8px solid var(--border)',
            borderRadius: '9999px',
            padding: '3px 8px',
          }}>
            <span style={{ ...S.monoSm, color: 'var(--text-secondary)' }}>
              MITSUBISHI GX3 / IL
            </span>
          </div>
        </div>

        {/* Center: workspace path */}
        <span style={{ ...S.monoSm, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          / workspace / ladder_gen_001
        </span>

        {/* Right: status indicators + icon buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--green)' }} />
            <span style={{ ...S.monoSm, color: 'var(--green)', whiteSpace: 'nowrap' }}>AI Engine Online</span>
          </div>

          <div style={S.divider} />

          <span style={{ ...S.monoSm, color: 'var(--cyan)', whiteSpace: 'nowrap' }}>MEM: 2.4MB</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '3px', backgroundColor: 'var(--green)' }} />
            <span style={{ ...S.monoSm, color: 'var(--green)', whiteSpace: 'nowrap' }}>GX Works3 CONNECTED</span>
          </div>

          <div style={S.divider} />

          <button style={S.iconBtn} title="Settings" aria-label="Settings">
            <SettingsIcon />
          </button>
          <button
            style={{ ...S.iconBtn, color: 'var(--text-secondary)' }}
            onClick={toggleTheme}
            title="Toggle Theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      {/* ── MAIN PANELS ─────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left: Instruction Editor */}
        <div style={{ width: '306px', flexShrink: 0, overflow: 'hidden', backgroundColor: 'var(--bg-panel)' }}>
          <InstructionEditor />
        </div>

        <div style={{ width: '1px', flexShrink: 0, backgroundColor: 'var(--border)' }} />

        {/* Center: Ladder Preview + Output Console */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ flex: 65, overflow: 'hidden', minHeight: 0, backgroundColor: 'var(--bg-panel)' }}>
            <LadderPreview />
          </div>
          <div style={{ height: '1px', flexShrink: 0, backgroundColor: 'var(--border)' }} />
          <div style={{ flex: 35, overflow: 'hidden', minHeight: 0, backgroundColor: 'var(--bg-editor)' }}>
            <OutputConsole />
          </div>
        </div>

        <div style={{ width: '1px', flexShrink: 0, backgroundColor: 'var(--border)' }} />

        {/* Right: AI Explanation */}
        <div style={{ width: '459px', flexShrink: 0, overflow: 'hidden', backgroundColor: 'var(--bg-panel)' }}>
          <ExplanationPanel />
        </div>
      </div>

      {/* ── FOOTER STATUS BAR ───────────────────────────────── */}
      <footer style={{
        height: '28px',
        flexShrink: 0,
        backgroundColor: 'var(--bg-card)',
        borderTop: '0.8px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '2.5px', backgroundColor: 'var(--green)' }} />
            <span style={{ ...S.monoXs, color: 'var(--green)' }}>SYSTEM READY</span>
          </div>
          <span style={{ ...S.monoXs, color: 'var(--border)' }}>|</span>
          <span style={{ ...S.monoXs, color: 'var(--text-muted)' }}>PLCopen XML v2.0</span>
          <span style={{ ...S.monoXs, color: 'var(--border)' }}>|</span>
          <span style={{ ...S.monoXs, color: 'var(--text-muted)' }}>GX Works 3 Compatible</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ ...S.monoXs, color: 'var(--cyan)' }}>CPU: FX5U-32MT</span>
          <span style={{ ...S.monoXs, color: 'var(--border)' }}>|</span>
          <span style={{ ...S.monoXs, color: 'var(--text-muted)' }}>Line 1, Col 0</span>
          <span style={{ ...S.monoXs, color: 'var(--border)' }}>|</span>
          <span style={{ ...S.monoXs, color: 'var(--text-muted)' }}>UTF-8</span>
        </div>
      </footer>

    </div>
  );
}
