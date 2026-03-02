"use client";

import { useState } from "react";
import { App } from "antd";
import { usePlcStore } from "../../store/plcStore";
import { downloadFile, buildPLCopenXML, buildGXWorksLabelCSV } from "@/utils/exportUtils";

const INIT_LINES = [
  "System initialized.",
  "PLC AI Engine v2.4.1 loaded.",
  "Awaiting instruction input...",
];

export default function OutputConsole() {
  const { message } = App.useApp();
  const { instructionList, ladderData, resetAll } = usePlcStore();
  const [exportLog, setExportLog] = useState<string[]>([]);
  const [lastExport, setLastExport] = useState<string>("--");

  const ilLines = instructionList
    ? instructionList.split("\n").filter(Boolean).length
    : 0;

  const handleCopyIL = () => {
    if (!instructionList) return;
    navigator.clipboard.writeText(instructionList);
    message.success("Instruction list copied!");
  };

  const handleExportXML = () => {
    if (!ladderData.length) return;
    const xml = buildPLCopenXML(ladderData, instructionList);
    downloadFile(xml, "ladder_logic_export.xml", "application/xml");
    const t = new Date().toLocaleTimeString();
    setLastExport(t);
    setExportLog((prev) => [
      ...prev,
      "> [EXPORT] ladder_logic_export.xml saved — GX Works3 ready",
    ]);
    message.success("Exported PLCopen XML!");
  };

  const handleExportCSV = () => {
    if (!ladderData.length) return;
    const csv = buildGXWorksLabelCSV(ladderData);
    downloadFile(csv, "device_labels.csv", "text/csv");
    const t = new Date().toLocaleTimeString();
    setLastExport(t);
    setExportLog((prev) => [
      ...prev,
      "> [EXPORT] device_labels.csv saved — GX Works3 ready",
    ]);
    message.success("Exported Device Labels CSV!");
  };

  const handleClear = () => {
    resetAll();
    setExportLog([]);
    setLastExport("--");
  };

  const consoleBtn = (label: string, onClick: () => void, disabled: boolean) => (
    <button
      key={label}
      onClick={onClick}
      disabled={disabled}
      style={{
        height: '22px',
        padding: '0 8px',
        border: '0.8px solid var(--border)',
        borderRadius: '4px',
        backgroundColor: 'transparent',
        color: disabled ? '#334155' : 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        fontSize: '11px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {label}
    </button>
  );

  const exportBtn = (label: string, onClick: () => void, disabled: boolean) => (
    <button
      key={label}
      onClick={onClick}
      disabled={disabled}
      style={{
        height: '24px',
        padding: '0 12px',
        borderRadius: '9999px',
        backgroundColor: disabled ? 'var(--border)' : '#0284c7', /* Blue match for screenshot */
        color: disabled ? 'var(--text-muted)' : '#ffffff',
        border: 'none',
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        fontSize: '11px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap' as const,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: disabled ? 'none' : '0 2px 4px rgba(2, 132, 199, 0.3)',
      }}
    >
      {label}
      <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
        <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 13h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-editor)',
    }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{
        height: '32px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        backgroundColor: 'var(--bg-card)',
        borderTop: '0.8px solid #0ea5e9',
        boxShadow: '0 -1px 8px rgba(14,165,233,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '3px', backgroundColor: 'var(--green)' }} />
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: '11px',
            letterSpacing: '1.1px',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}>
            OUTPUT CONSOLE
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {consoleBtn("COPY IL", handleCopyIL, !instructionList)}
          {consoleBtn("CLEAR", handleClear, false)}
          {exportBtn("EXPORT CSV", handleExportCSV, !ladderData.length)}
          {exportBtn("EXPORT XML", handleExportXML, !ladderData.length)}
        </div>
      </div>

      {/* ── Console output ────────────────────────────────────── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 0 0',
        minHeight: 0,
      }}>
        {/* Static init messages */}
        {INIT_LINES.map((text, i) => (
          <div key={i} style={{
            height: '22px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: i % 2 === 0 ? 'rgba(128, 128, 128, 0.05)' : 'transparent',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--cyan)',
              paddingLeft: '8px',
            }}>
              {'> '}<span style={{ color: 'var(--text-primary)' }}>{text}</span>
            </span>
          </div>
        ))}

        {/* Generated instruction list */}
        {instructionList && instructionList.split("\n").filter(Boolean).map((line, i) => (
          <div key={`il-${i}`} style={{ height: '22px', display: 'flex', alignItems: 'center' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--cyan)',
              paddingLeft: '8px',
            }}>
              {'> '}<span style={{ color: 'var(--text-primary)' }}>{line}</span>
            </span>
          </div>
        ))}

        {/* Export log */}
        {exportLog.map((line, i) => (
          <div key={`exp-${i}`} style={{ height: '22px', display: 'flex', alignItems: 'center' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--green)',
              paddingLeft: '8px',
            }}>
              {line}
            </span>
          </div>
        ))}

        {/* Blinking cursor */}
        <div style={{ height: '22px', display: 'flex', alignItems: 'center' }}>
          <span className="cursor-blink" style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--cyan)',
            paddingLeft: '8px',
          }}>█</span>
        </div>
      </div>

      {/* ── Status footer ─────────────────────────────────────── */}
      <div style={{
        height: '24px',
        flexShrink: 0,
        borderTop: '0.8px solid rgba(30,58,95,0.3)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-muted)',
        }}>
          {`Scan Time: ~2.1ms | IL Lines: ${ilLines} | Last Export: ${lastExport}`}
        </span>
      </div>

    </div>
  );
}
