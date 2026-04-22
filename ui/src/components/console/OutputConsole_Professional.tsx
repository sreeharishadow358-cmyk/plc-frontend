/**
 * Professional Output Console
 * Features: Tabs (Instructions, JSON, Debug), Copy, Download, Export
 * Shows status messages and formatted output
 */

"use client";

import React, { useState, useRef } from 'react';
import { usePlcStore } from '@/store/plcStore';
import { INDUSTRIAL_COLORS, INDUSTRIAL_TYPOGRAPHY } from '@/constants/industrialDesign';

type TabType = 'instructions' | 'json' | 'debug';

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.1" />
      <path d="M4 10a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <line x1="7" y1="1" x2="7" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <polyline points="4,7 7,10 10,7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="1" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 8v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="10,4 7,1 4,4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="7" y1="1" x2="7" y2="8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

interface OutputConsoleProps {
  onExport?: (format: 'xml' | 'csv' | 'txt') => void;
}

export default function OutputConsole({ onExport }: OutputConsoleProps) {
  const { instructionList, ladderData, isLoading } = usePlcStore();
  const [activeTab, setActiveTab] = useState<TabType>('instructions');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'instructions', label: 'Instructions', icon: '⚙️' },
    { id: 'json', label: 'JSON Output', icon: '{ }' },
    { id: 'debug', label: 'Debug Log', icon: '🐛' },
  ];

  // Format JSON output
  const jsonOutput = ladderData ? JSON.stringify(ladderData, null, 2) : '';

  // Debug log
  const debugLog = `
[${new Date().toLocaleTimeString()}] System Ready
[${new Date().toLocaleTimeString()}] Listening for instructions...
${isLoading ? `[${new Date().toLocaleTimeString()}] Processing user input...` : ''}
${ladderData && ladderData.length > 0 ? `[${new Date().toLocaleTimeString()}] Ladder generated: ${ladderData.length} rungs` : ''}
  `.trim();

  // Get active tab content
  const getTabContent = () => {
    switch (activeTab) {
      case 'instructions':
        return instructionList || 'No instructions generated yet';
      case 'json':
        return jsonOutput || 'No JSON data available';
      case 'debug':
        return debugLog;
      default:
        return '';
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    const content = getTabContent();
    try {
      await navigator.clipboard.writeText(content);
      setCopiedTab(activeTab);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Download file
  const handleDownload = () => {
    const content = getTabContent();
    const filename = `plc_${activeTab}_${new Date().toISOString().split('T')[0]}.txt`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: INDUSTRIAL_COLORS.bg.panel,
        overflow: 'hidden',
      }}
    >
      {/* ─────────────────────────────────────────────────────── */}
      {/* TABS & CONTROLS                                        */}
      {/* ─────────────────────────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          borderBottom: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '44px',
          padding: '0 12px',
          gap: '12px',
        }}
      >
        {/* Tab Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
          }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 10px',
                border: 'none',
                background:activeTab === tab.id
                  ? INDUSTRIAL_COLORS.accent.primary
                  : 'transparent',
                color: activeTab === tab.id
                  ? INDUSTRIAL_COLORS.bg.base
                  : INDUSTRIAL_COLORS.text.secondary,
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <button
            onClick={handleCopy}
            style={{
              width: '28px',
              height: '28px',
              border: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
              background: copiedTab === activeTab
                ? INDUSTRIAL_COLORS.status.online
                : 'transparent',
              borderRadius: '3px',
              color: copiedTab === activeTab
                ? 'white'
                : INDUSTRIAL_COLORS.text.secondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 150ms ease-out',
              fontSize: '10px',
            }}
            title="Copy to clipboard"
            aria-label="Copy"
          >
            {copiedTab === activeTab ? '✓' : <CopyIcon />}
          </button>

          <button
            onClick={handleDownload}
            style={{
              width: '28px',
              height: '28px',
              border: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
              backgroundColor: 'transparent',
              borderRadius: '3px',
              color: INDUSTRIAL_COLORS.text.secondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 150ms ease-out',
            }}
            title="Download as text file"
            aria-label="Download"
          >
            <DownloadIcon />
          </button>

          <div style={{ width: '1px', height: '16px', backgroundColor: INDUSTRIAL_COLORS.ui.border }} />

          <button
            onClick={() => onExport?.('xml')}
            style={{
              padding: '6px 8px',
              border: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
              backgroundColor: 'transparent',
              borderRadius: '3px',
              color: INDUSTRIAL_COLORS.text.secondary,
              fontSize: '9px',
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Export as PLCopen XML"
            aria-label="Export XML"
          >
            <ExportIcon />
            XML
          </button>

          <button
            onClick={() => onExport?.('csv')}
            style={{
              padding: '6px 8px',
              border: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
              backgroundColor: 'transparent',
              borderRadius: '3px',
              color: INDUSTRIAL_COLORS.text.secondary,
              fontSize: '9px',
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Export for GX Works"
            aria-label="Export CSV"
          >
            <ExportIcon />
            CSV
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* OUTPUT AREA                                            */}
      {/* ─────────────────────────────────────────────────────── */}
      <div
        ref={consoleRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '12px',
          backgroundColor: INDUSTRIAL_COLORS.bg.editor,
          fontFamily: INDUSTRIAL_TYPOGRAPHY.fontFamily.mono,
          fontSize: '10px',
          color: INDUSTRIAL_COLORS.text.secondary,
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        } as React.CSSProperties}
      >
        {isLoading ? (
          <div
            style={{
              color: INDUSTRIAL_COLORS.accent.primary,
              animation: 'pulse 1s infinite',
            }}
          >
            ⏳ Processing instructions...
          </div>
        ) : getTabContent() ? (
          getTabContent()
        ) : (
          <div style={{ color: INDUSTRIAL_COLORS.text.muted }}>
            {activeTab === 'instructions' && 'No instructions generated. Write and generate logic to see output.'}
            {activeTab === 'json' && 'No JSON data available yet.'}
            {activeTab === 'debug' && 'Debug log will appear here.'}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* STATUS BAR                                             */}
      {/* ─────────────────────────────────────────────────────── */}
      <div
        style={{
          height: '24px',
          flexShrink: 0,
          borderTop: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
          backgroundColor: INDUSTRIAL_COLORS.bg.base,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '12px',
          paddingRight: '12px',
          fontSize: '9px',
          color: INDUSTRIAL_COLORS.text.muted,
          fontFamily: INDUSTRIAL_TYPOGRAPHY.fontFamily.mono,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isLoading
                ? INDUSTRIAL_COLORS.accent.primary
                : INDUSTRIAL_COLORS.status.online,
            }}
          />
          <span>
            {isLoading
              ? 'Processing...'
              : ladderData && ladderData.length > 0
                ? `Ready (${ladderData.length} rungs)`
                : 'Idle'}
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <span>
          {getTabContent().length} chars • {getTabContent().split('\n').length} lines
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* ANIMATIONS & STYLES                                   */}
      {/* ─────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        div {
          scrollbar-width: thin;
          scrollbar-color: ${INDUSTRIAL_COLORS.ui.border} ${INDUSTRIAL_COLORS.bg.editor};
        }

        div::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        div::-webkit-scrollbar-track {
          background: ${INDUSTRIAL_COLORS.bg.editor};
        }

        div::-webkit-scrollbar-thumb {
          background: ${INDUSTRIAL_COLORS.ui.border};
          border-radius: 4px;
        }

        div::-webkit-scrollbar-thumb:hover {
          background: ${INDUSTRIAL_COLORS.accent.primary};
        }
      `}</style>
    </div>
  );
}
