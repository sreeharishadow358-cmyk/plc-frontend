/**
 * Professional Explanation Panel
 * Sections: Summary, Step-by-step logic, Device mapping, Safety warnings
 * Shows input highlights, output highlights, and safety elements
 */

"use client";

import React, { useMemo } from 'react';
import { usePlcStore } from '@/store/plcStore';
import { INDUSTRIAL_COLORS, INDUSTRIAL_TYPOGRAPHY } from '@/constants/industrialDesign';

interface SafetyIssue {
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  code?: string;
}

function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1L1 12h12L7 1z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <line x1="7" y1="5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="7" cy="10" r="0.7" fill="currentColor" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.1" />
      <line x1="7" y1="4" x2="7" y2="7" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="7" cy="10" r="0.7" fill="currentColor" />
    </svg>
  );
}

export default function ExplanationPanel() {
  const { explanation, isLoading, ladderData, errorMessage } = usePlcStore();

  // Parse safety issues from ladder data
  const safetyIssues = useMemo((): SafetyIssue[] => {
    const issues: SafetyIssue[] = [];

    if (!ladderData || ladderData.length === 0) {
      return issues;
    }

    // Check for duplicate coils
    const coils = new Set<string>();
    const duplicateCoils = new Set<string>();

    ladderData.forEach(rung => {
      rung.blocks.forEach(block => {
        if (block.type === 'coil') {
          if (coils.has(block.label)) {
            duplicateCoils.add(block.label);
          }
          coils.add(block.label);
        }
      });
    });

    duplicateCoils.forEach(coil => {
      issues.push({
        type: 'error',
        title: 'Duplicate Coil Detected',
        message: `Output coil "${coil}" appears in multiple rungs. This may cause logic errors.`,
        code: coil,
      });
    });

    // Check for missing emergency stop
    const hasEmergencyStop = ladderData.some(rung =>
      rung.blocks.some(block => block.label?.includes('X') && block.type === 'contact_nc')
    );

    if (!hasEmergencyStop) {
      issues.push({
        type: 'warning',
        title: 'No Emergency Stop Detected',
        message: 'For safety-critical applications, consider adding an emergency stop (NC contact).',
      });
    }

    // Check for unreachable blocks
    if (ladderData.length > 0 && ladderData[0].blocks.length === 0) {
      issues.push({
        type: 'warning',
        title: 'Empty Rung Detected',
        message: 'The first rung contains no logic blocks. This rung will not execute.',
      });
    }

    return issues;
  }, [ladderData]);

  // Parse explanation sections
  const explanationSections = useMemo(() => {
    if (!explanation) return null;

    const lines = explanation.split('\n').filter(line => line.trim());
    const sections = {
      summary: lines.slice(0, 2).join('\n'),
      details: lines.slice(2),
    };

    return sections;
  }, [explanation]);

  // Extract device mapping
  const deviceMapping = useMemo(() => {
    const devices = {
      inputs: new Set<string>(),
      outputs: new Set<string>(),
      internals: new Set<string>(),
    };

    ladderData?.forEach(rung => {
      rung.blocks.forEach(block => {
        const match = block.label?.match(/^([XYM])(\d+)/);
        if (match) {
          const type = match[1];
          if (type === 'X') devices.inputs.add(block.label);
          else if (type === 'Y') devices.outputs.add(block.label);
          else if (type === 'M') devices.internals.add(block.label);
        }
      });
    });

    return {
      inputs: Array.from(devices.inputs),
      outputs: Array.from(devices.outputs),
      internals: Array.from(devices.internals),
    };
  }, [ladderData]);

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
      {/* HEADER                                                 */}
      {/* ─────────────────────────────────────────────────────── */}
      <div
        style={{
          height: '48px',
          flexShrink: 0,
          borderBottom: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: INDUSTRIAL_COLORS.text.primary,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          📖 Explanation & Analysis
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* CONTENT                                                */}
      {/* ─────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {isLoading && (
          <div
            style={{
              padding: '16px',
              backgroundColor: INDUSTRIAL_COLORS.bg.elevated,
              borderRadius: '6px',
              border: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
              textAlign: 'center',
              color: INDUSTRIAL_COLORS.text.secondary,
              fontSize: '12px',
            }}
          >
            ⏳ Analyzing logic...
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '6px',
              border: `1px solid ${INDUSTRIAL_COLORS.accent.danger}`,
              fontSize: '12px',
              color: INDUSTRIAL_COLORS.accent.danger,
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Safety Issues Section */}
        {safetyIssues.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: INDUSTRIAL_COLORS.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              🔒 Safety Analysis
            </div>

            {safetyIssues.map((issue, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 10px',
                  backgroundColor: issue.type === 'error'
                    ? 'rgba(239, 68, 68, 0.1)'
                    : issue.type === 'warning'
                      ? 'rgba(245, 158, 11, 0.1)'
                      : 'rgba(6, 182, 212, 0.1)',
                  borderLeft: `3px solid ${
                    issue.type === 'error'
                      ? INDUSTRIAL_COLORS.accent.danger
                      : issue.type === 'warning'
                        ? INDUSTRIAL_COLORS.status.warning
                        : INDUSTRIAL_COLORS.accent.primary
                  }`,
                  borderRadius: '4px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                  }}
                >
                  <div
                    style={{
                      color: issue.type === 'error'
                        ? INDUSTRIAL_COLORS.accent.danger
                        : issue.type === 'warning'
                          ? INDUSTRIAL_COLORS.status.warning
                          : INDUSTRIAL_COLORS.accent.primary,
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {issue.type === 'error' && <WarningIcon />}
                    {issue.type === 'warning' && <WarningIcon />}
                    {issue.type === 'info' && <InfoIcon />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: INDUSTRIAL_COLORS.text.primary,
                        marginBottom: '2px',
                      }}
                    >
                      {issue.title}
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: INDUSTRIAL_COLORS.text.secondary,
                      }}
                    >
                      {issue.message}
                    </div>
                    {issue.code && (
                      <div
                        style={{
                          fontSize: '9px',
                          fontFamily: INDUSTRIAL_TYPOGRAPHY.fontFamily.mono,
                          color: INDUSTRIAL_COLORS.text.muted,
                          marginTop: '4px',
                          backgroundColor: INDUSTRIAL_COLORS.bg.base,
                          padding: '4px 6px',
                          borderRadius: '3px',
                        }}
                      >
                        Code: {issue.code}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Logic Summary */}
        {explanationSections && (
          <>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: INDUSTRIAL_COLORS.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginTop: '8px',
              }}
            >
              📋 Logic Summary
            </div>

            <div
              style={{
                padding: '10px',
                backgroundColor: INDUSTRIAL_COLORS.bg.elevated,
                borderRadius: '4px',
                border: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
              }}
            >
              {explanationSections.summary.split('\n').map((line, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '11px',
                    color: INDUSTRIAL_COLORS.text.secondary,
                    lineHeight: '1.5',
                  }}
                >
                  {line}
                </div>
              ))}
            </div>

            {/* Detailed Steps */}
            {explanationSections.details.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: INDUSTRIAL_COLORS.text.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  🔗 Step-by-Step Execution
                </div>

                <div
                  style={{
                    padding: '10px',
                    backgroundColor: INDUSTRIAL_COLORS.bg.elevated,
                    borderRadius: '4px',
                    border: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
                  }}
                >
                  {explanationSections.details.map((line, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: '10px',
                        color: INDUSTRIAL_COLORS.text.secondary,
                        lineHeight: '1.6',
                        marginBottom: i < explanationSections.details.length - 1 ? '6px' : 0,
                        paddingLeft: '16px',
                        position: 'relative',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: '4px',
                          color: INDUSTRIAL_COLORS.accent.primary,
                        }}
                      >
                        →
                      </span>
                      {line}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Device Mapping */}
        {(deviceMapping.inputs.length > 0 ||
          deviceMapping.outputs.length > 0 ||
          deviceMapping.internals.length > 0) && (
          <>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: INDUSTRIAL_COLORS.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              🔌 Device Mapping
            </div>

            {deviceMapping.inputs.length > 0 && (
              <div
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  borderRadius: '4px',
                  border: `1px solid rgba(16, 185, 129, 0.2)`,
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: INDUSTRIAL_COLORS.status.online,
                    marginBottom: '4px',
                  }}
                >
                  📥 Inputs (X)
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: INDUSTRIAL_TYPOGRAPHY.fontFamily.mono,
                    color: INDUSTRIAL_COLORS.text.secondary,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}
                >
                  {deviceMapping.inputs.map(dev => (
                    <span
                      key={dev}
                      style={{
                        backgroundColor: INDUSTRIAL_COLORS.bg.base,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        border: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
                      }}
                    >
                      {dev}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {deviceMapping.outputs.length > 0 && (
              <div
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'rgba(6, 182, 212, 0.05)',
                  borderRadius: '4px',
                  border: `1px solid rgba(6, 182, 212, 0.2)`,
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: INDUSTRIAL_COLORS.accent.primary,
                    marginBottom: '4px',
                  }}
                >
                  📤 Outputs (Y)
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: INDUSTRIAL_TYPOGRAPHY.fontFamily.mono,
                    color: INDUSTRIAL_COLORS.text.secondary,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}
                >
                  {deviceMapping.outputs.map(dev => (
                    <span
                      key={dev}
                      style={{
                        backgroundColor: INDUSTRIAL_COLORS.bg.base,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        border: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
                      }}
                    >
                      {dev}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {deviceMapping.internals.length > 0 && (
              <div
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'rgba(156, 163, 175, 0.05)',
                  borderRadius: '4px',
                  border: `1px solid rgba(156, 163, 175, 0.2)`,
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: INDUSTRIAL_COLORS.text.secondary,
                    marginBottom: '4px',
                  }}
                >
                  🔗 Internal Relays (M)
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: INDUSTRIAL_TYPOGRAPHY.fontFamily.mono,
                    color: INDUSTRIAL_COLORS.text.muted,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}
                >
                  {deviceMapping.internals.map(dev => (
                    <span
                      key={dev}
                      style={{
                        backgroundColor: INDUSTRIAL_COLORS.bg.base,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        border: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
                      }}
                    >
                      {dev}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!explanation && !isLoading && (
          <div
            style={{
              textAlign: 'center',
              color: INDUSTRIAL_COLORS.text.muted,
              fontSize: '12px',
              padding: '20px',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📖</div>
            No explanation available yet
          </div>
        )}
      </div>
    </div>
  );
}
