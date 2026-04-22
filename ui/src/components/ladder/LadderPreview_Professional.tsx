/**
 * Professional Ladder Logic Workspace
 * Features: Grid background, zoom, pan, rung numbering, visual connections
 * Real engineering-grade ladder diagram rendering
 */

"use client";

import React, { useState, useRef } from 'react';
import { usePlcStore } from '@/store/plcStore';
import { useZoomControl, usePanControl } from '@/hooks/useIDE';
import { INDUSTRIAL_COLORS, INDUSTRIAL_TYPOGRAPHY } from '@/constants/industrialDesign';
import type { LadderBlock, LadderRung } from '../../types/ladder';

const GRID_SIZE = 20;
const RUNG_HEIGHT = 60;
const BLOCK_WIDTH = 40;
const BLOCK_HEIGHT = 30;

function ZoomIcon({ type }: { type: 'in' | 'out' | 'reset' }) {
  if (type === 'in') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.1" />
        <line x1="8" y1="8" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        <line x1="5" y1="2" x2="5" y2="8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        <line x1="2" y1="5" x2="8" y2="5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    );
  } else if (type === 'out') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.1" />
        <line x1="8" y1="8" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        <line x1="2" y1="5" x2="8" y2="5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.1" />
      <line x1="8" y1="8" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M3 5h4M5 3v4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function GridBG({ zoom }: { zoom: number }) {
  const scaledGridSize = GRID_SIZE * zoom;
  
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  );
}

function LadderBlockRenderer({
  block,
  onClick,
}: {
  block: LadderBlock;
  onClick?: (blockId: string) => void;
}) {
  const blockTypeSymbols: Record<string, string> = {
    contact: '─┤├─',
    contact_nc: '─┤/├─',
    coil: '─( )─',
    timer: '─[T]─',
    counter: '─[C]─',
  };

  return (
    <div
      style={{
        width: `${BLOCK_WIDTH}px`,
        height: `${BLOCK_HEIGHT}px`,
        border: `1.5px solid ${INDUSTRIAL_COLORS.accent.primary}`,
        borderRadius: '3px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: INDUSTRIAL_COLORS.bg.editor,
        padding: '4px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 150ms ease-out',
        background: `linear-gradient(135deg, 
          ${INDUSTRIAL_COLORS.bg.panel}, 
          ${INDUSTRIAL_COLORS.bg.editor})`,
        boxShadow: `inset 0 1px 0 ${INDUSTRIAL_COLORS.ui.border}`,
      }}
      title={`${block.type} - ${block.label}`}
      onClick={() => onClick?.(block.id)}
    >
      <div
        style={{
          fontSize: '9px',
          fontFamily: INDUSTRIAL_TYPOGRAPHY.fontFamily.mono,
          color: INDUSTRIAL_COLORS.accent.primary,
          fontWeight: 600,
          textAlign: 'center',
        }}
      >
        {blockTypeSymbols[block.type] || '─[?]─'}
      </div>
      <div
        style={{
          fontSize: '8px',
          color: INDUSTRIAL_COLORS.text.secondary,
          marginTop: '2px',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {block.label}
      </div>
    </div>
  );
}

function RungRenderer({
  rung,
  index,
  onBlockClick,
}: {
  rung: LadderRung;
  index: number;
  onBlockClick?: (blockId: string) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: `${RUNG_HEIGHT}px`,
        padding: '0 12px 0 40px',
        borderBottom: `1px dashed ${INDUSTRIAL_COLORS.ui.border}`,
        position: 'relative',
        gap: '2px',
      }}
    >
      {/* Rung Number */}
      <div
        style={{
          position: 'absolute',
          left: '6px',
          fontSize: '10px',
          color: INDUSTRIAL_COLORS.text.muted,
          fontFamily: INDUSTRIAL_TYPOGRAPHY.fontFamily.mono,
          fontWeight: 600,
          minWidth: '20px',
          textAlign: 'right',
        }}
      >
        {String(index).padStart(2, '0')}
      </div>

      {/* Blocks */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {rung.blocks.map((block, i) => (
          <React.Fragment key={i}>
            <LadderBlockRenderer block={block} onClick={onBlockClick} />
            {i < rung.blocks.length - 1 && (
              <div
                style={{
                  width: '8px',
                  height: '1.5px',
                  backgroundColor: INDUSTRIAL_COLORS.accent.primary,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Connection Line */}
      <div
        style={{
          flex: 1,
          height: '1.5px',
          backgroundColor: INDUSTRIAL_COLORS.accent.primary,
          marginLeft: '4px',
        }}
      />
    </div>
  );
}

interface LadderPreviewProps {
  onBlockClick?: (blockId: string) => void;
}

export default function LadderPreview({ onBlockClick }: LadderPreviewProps) {
  const { ladderData } = usePlcStore();
  const { zoom, zoomIn, zoomOut, resetZoom } = useZoomControl({ initialZoom: 1 });
  const { pan, handleMouseMove, isPanning } = usePanControl();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoveredRung, setHoveredRung] = useState<number | null>(null);

  // Detect if there's any ladder data
  const hasLadder = ladderData && ladderData.length > 0;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: INDUSTRIAL_COLORS.bg.editor,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ─────────────────────────────────────────────────────── */}
      {/* TOOLBAR                                                */}
      {/* ─────────────────────────────────────────────────────── */}
      <div
        style={{
          height: '40px',
          flexShrink: 0,
          backgroundColor: INDUSTRIAL_COLORS.bg.panel,
          borderBottom: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '12px',
          paddingRight: '12px',
          gap: '8px',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 600, color: INDUSTRIAL_COLORS.text.primary }}>
          🔲 Ladder Workspace
        </div>

        <div style={{ flex: 1 }} />

        {/* Zoom Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px',
            backgroundColor: INDUSTRIAL_COLORS.bg.base,
            borderRadius: '4px',
            border: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
          }}
        >
          <button
            onClick={zoomOut}
            style={{
              width: '28px',
              height: '28px',
              border: 'none',
              background: 'transparent',
              color: INDUSTRIAL_COLORS.text.secondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '3px',
              transition: 'all 100ms ease-out',
            }}
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomIcon type="out" />
          </button>

          <div
            style={{
              fontSize: '11px',
              color: INDUSTRIAL_COLORS.text.secondary,
              fontFamily: INDUSTRIAL_TYPOGRAPHY.fontFamily.mono,
              minWidth: '32px',
              textAlign: 'center',
            }}
          >
            {Math.round(zoom * 100)}%
          </div>

          <button
            onClick={zoomIn}
            style={{
              width: '28px',
              height: '28px',
              border: 'none',
              background: 'transparent',
              color: INDUSTRIAL_COLORS.text.secondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '3px',
              transition: 'all 100ms ease-out',
            }}
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIcon type="in" />
          </button>

          <div style={{ width: '1px', height: '20px', backgroundColor: INDUSTRIAL_COLORS.ui.border }} />

          <button
            onClick={resetZoom}
            style={{
              width: '28px',
              height: '28px',
              border: 'none',
              background: 'transparent',
              color: INDUSTRIAL_COLORS.text.secondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '3px',
              fontSize: '10px',
              transition: 'all 100ms ease-out',
            }}
            title="Reset zoom"
            aria-label="Reset zoom"
          >
            100%
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* CANVAS                                                 */}
      {/* ─────────────────────────────────────────────────────── */}
      <div
        ref={canvasRef}
        style={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
          backgroundColor: INDUSTRIAL_COLORS.bg.editor,
          cursor: isPanning ? 'grabbing' : 'auto',
        }}
        onMouseMove={handleMouseMove}
      >
        {/* Grid Background */}
        <GridBG zoom={zoom} />

        {/* Empty State */}
        {!hasLadder && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
              ⚡
            </div>
            <div style={{ color: INDUSTRIAL_COLORS.text.secondary, marginBottom: '8px' }}>
              No ladder logic generated yet
            </div>
            <div style={{ fontSize: '12px', color: INDUSTRIAL_COLORS.text.muted }}>
              Write instructions in the editor and click Generate
            </div>
          </div>
        )}

        {/* Ladder Diagram */}
        {hasLadder && (
          <div
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: '0 0',
              position: 'relative',
              zIndex: 3,
            }}
          >
            {/* Power Rails */}
            <div
              style={{
                width: '20px',
                height: `${ladderData.length * RUNG_HEIGHT}px`,
                position: 'absolute',
                left: '12px',
                top: '0',
                borderLeft: `2px solid ${INDUSTRIAL_COLORS.accent.primary}`,
                borderRight: `2px solid ${INDUSTRIAL_COLORS.accent.primary}`,
              }}
            />

            {/* Rungs */}
            <div style={{ marginLeft: '20px' }}>
              {ladderData.map((rung, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredRung(i)}
                  onMouseLeave={() => setHoveredRung(null)}
                  style={{
                    opacity: hoveredRung === null || hoveredRung === i ? 1 : 0.6,
                    transition: 'opacity 150ms ease-out',
                  }}
                >
                  <RungRenderer rung={rung} index={i + 1} onBlockClick={onBlockClick} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* STATISTIC BAR                                          */}
      {/* ─────────────────────────────────────────────────────── */}
      {hasLadder && (
        <div
          style={{
            height: '24px',
            flexShrink: 0,
            backgroundColor: INDUSTRIAL_COLORS.bg.panel,
            borderTop: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '12px',
            paddingRight: '12px',
            fontSize: '10px',
            color: INDUSTRIAL_COLORS.text.muted,
            fontFamily: INDUSTRIAL_TYPOGRAPHY.fontFamily.mono,
            gap: '16px',
          }}
        >
          <span>Rungs: {ladderData.length}</span>
          <span>
            Blocks: {ladderData.reduce((acc, r) => acc + r.blocks.length, 0)}
          </span>
          <span>
            Inputs: {ladderData.reduce((acc, r) => 
              acc + r.blocks.filter(b => b.type.startsWith('X')).length, 0
            )}
          </span>
          <span>
            Outputs: {ladderData.reduce((acc, r) => 
              acc + r.blocks.filter(b => b.type === 'coil').length, 0
            )}
          </span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────── */}
      {/* HELP TEXT                                              */}
      {/* ─────────────────────────────────────────────────────── */}
      <div
        style={{
          height: '22px',
          flexShrink: 0,
          backgroundColor: INDUSTRIAL_COLORS.bg.base,
          borderTop: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '12px',
          fontSize: '9px',
          color: INDUSTRIAL_COLORS.text.muted,
        }}
      >
        💡 Tip: Use scroll wheel to zoom • Middle-click to pan
      </div>
    </div>
  );
}
