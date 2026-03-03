"use client";

import { usePlcStore } from "../../store/plcStore";
import type { LadderBlock } from "../../store/plcStore";

// ── Icons ────────────────────────────────────────────────────────────────────

function LadderIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="0.6" y="0.6" width="10.8" height="10.8" rx="1" stroke="#94a3b8" strokeWidth="1" />
      <line x1="4" y1="0.6" x2="4" y2="11.4" stroke="#94a3b8" strokeWidth="1" />
      <line x1="8" y1="0.6" x2="8" y2="11.4" stroke="#94a3b8" strokeWidth="1" />
      <line x1="0.6" y1="4" x2="11.4" y2="4" stroke="#94a3b8" strokeWidth="1" />
      <line x1="0.6" y1="8" x2="11.4" y2="8" stroke="#94a3b8" strokeWidth="1" />
    </svg>
  );
}

function EmptyStateIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      {/* CPU body */}
      <rect x="22" y="22" width="36" height="36" rx="2" stroke="#1e3a5f" strokeWidth="2" />
      {/* Inner core */}
      <rect x="30" y="30" width="20" height="20" rx="1" fill="#06b6d4" fillOpacity="0.1" stroke="#1e3a5f" strokeWidth="1.5" />
      <rect x="35" y="35" width="10" height="10" rx="0.5" fill="#06b6d4" fillOpacity="0.25" />
      {/* Pins left */}
      <line x1="8"  y1="32" x2="22" y2="32" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
      <line x1="8"  y1="40" x2="22" y2="40" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
      <line x1="8"  y1="48" x2="22" y2="48" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
      {/* Pins right */}
      <line x1="58" y1="32" x2="72" y2="32" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
      <line x1="58" y1="40" x2="72" y2="40" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
      <line x1="58" y1="48" x2="72" y2="48" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
      {/* Pins top */}
      <line x1="32" y1="8"  x2="32" y2="22" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="8"  x2="40" y2="22" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
      <line x1="48" y1="8"  x2="48" y2="22" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
      {/* Pins bottom */}
      <line x1="32" y1="58" x2="32" y2="72" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="58" x2="40" y2="72" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
      <line x1="48" y1="58" x2="48" y2="72" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Rung renderer ─────────────────────────────────────────────────────────────

function LadderRung({ blocks, index }: { blocks: LadderBlock[]; index: number }) {
  const contacts = blocks.filter((b) => b.type !== "coil");
  const coil = blocks.find((b) => b.type === "coil");

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Rung label */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        color: 'var(--text-muted)',
        marginBottom: '4px',
        letterSpacing: '0.5px',
      }}>
        {`Rung ${String(index).padStart(3, "0")}:`}
      </div>

      {/* Rung rail */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        height: '56px',
      }}>
        {/* Left power rail */}
        <div style={{
          width: '4px',
          height: '56px',
          backgroundColor: '#3b82f6',
          flexShrink: 0,
        }} />

        {/* Wire and elements */}
        <div style={{
          flex: 1,
          height: '2px',
          backgroundColor: 'rgba(59,130,246,0.4)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '24px',
        }}>
          {contacts.map((block, i) => (
            <div key={i} style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'var(--bg-panel)',
              padding: '0 4px',
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--text-secondary)',
                marginBottom: '2px',
                position: 'absolute',
                top: '-22px',
                whiteSpace: 'nowrap',
              }}>
                {block.label}
              </span>
              {block.type === "contact" ? (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  letterSpacing: '1px',
                }}>
                  -| |-
                </span>
              ) : (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '15px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                }}>
                  <span style={{ color: 'var(--text-primary)' }}>-|</span>
                  <span style={{ color: '#ef4444' }}>/</span>
                  <span style={{ color: 'var(--text-primary)' }}>|-</span>
                </span>
              )}
            </div>
          ))}

          {coil && (
            <div style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'var(--bg-panel)',
              padding: '0 4px',
              marginLeft: 'auto',
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--text-secondary)',
                position: 'absolute',
                top: '-22px',
                whiteSpace: 'nowrap',
              }}>
                {coil.label}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '15px',
                color: 'var(--cyan)',
                fontWeight: 600,
                letterSpacing: '1px',
              }}>
                -( )-
              </span>
            </div>
          )}
        </div>

        {/* Right power rail */}
        <div style={{
          width: '4px',
          height: '56px',
          backgroundColor: '#3b82f6',
          flexShrink: 0,
        }} />
      </div>
    </div>
  );
}

// ── Split flat block array into rungs ─────────────────────────────────────────

function toRungs(blocks: LadderBlock[]): LadderBlock[][] {
  const rungs: LadderBlock[][] = [];
  let current: LadderBlock[] = [];
  for (const b of blocks) {
    current.push(b);
    if (b.type === "coil") { rungs.push(current); current = []; }
  }
  if (current.length) rungs.push(current);
  return rungs;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LadderPreview() {
  const { ladderData } = usePlcStore();
  const hasData = ladderData.length > 0;
  const rungs = toRungs(ladderData);

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
          <LadderIcon />
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: '11px',
            letterSpacing: '1.1px',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}>
            LADDER LOGIC PREVIEW
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: hasData ? 'rgba(6,182,212,0.15)' : 'rgba(71,85,105,0.2)',
            border: `0.8px solid ${hasData ? 'rgba(6,182,212,0.35)' : 'rgba(71,85,105,0.3)'}`,
            borderRadius: '9999px',
            padding: '3px 8px',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: hasData ? 'var(--cyan)' : 'var(--text-muted)',
            }}>
              {hasData ? 'LOGIC READY' : 'AWAITING INPUT'}
            </span>
          </div>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--text-muted)',
          }}>
            {rungs.length} {rungs.length === 1 ? 'RUNG' : 'RUNGS'}
          </span>
        </div>
      </div>

      {/* ── Canvas ────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        alignItems: hasData ? 'flex-start' : 'center',
        justifyContent: hasData ? 'flex-start' : 'center',
        padding: hasData ? '24px 20px' : '0',
        minHeight: 0,
      }}>
        {!hasData ? (
          /* Empty state */
          <div style={{
            border: '0.8px solid var(--border)',
            borderRadius: '8px',
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            textAlign: 'center',
          }}>
            <EmptyStateIcon />
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              color: 'var(--text-secondary)',
            }}>
              No logic generated yet
            </span>
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}>
              Enter your automation logic ←
            </span>
          </div>
        ) : (
          /* Ladder diagram */
          <div style={{ width: '100%' }}>
            {rungs.map((rung, i) => (
              <LadderRung key={i} blocks={rung} index={i} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
