'use client';

/**
 * ResizablePanelDivider Component
 * Draggable divider for panel resizing
 */

import React from 'react';
import { INDUSTRIAL_COLORS } from '@/constants/industrialDesign';

interface ResizablePanelDividerProps {
  direction: 'vertical' | 'horizontal';
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging?: boolean;
}

export function ResizablePanelDivider({
  direction,
  onMouseDown,
  isDragging = false,
}: ResizablePanelDividerProps) {
  const isVertical = direction === 'vertical';

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        width: isVertical ? '4px' : '100%',
        height: isVertical ? '100%' : '4px',
        backgroundColor: isDragging 
          ? INDUSTRIAL_COLORS.accent.primary 
          : INDUSTRIAL_COLORS.ui.divider,
        cursor: isVertical ? 'col-resize' : 'row-resize',
        transition: isDragging ? 'none' : 'background-color 200ms ease-out',
        zIndex: 20,
        flexShrink: 0,
      } as React.CSSProperties}
    />
  );
}

/**
 * StatusBar Component
 * Bottom status indicator
 */

interface StatusBarProps {
  status: 'online' | 'offline' | 'processing' | 'warning' | 'error';
  message: string;
  timestamp?: string;
}

export function StatusBar({ status, message, timestamp }: StatusBarProps) {
  const statusColors: Record<string, string> = {
    online: INDUSTRIAL_COLORS.status.online,
    offline: INDUSTRIAL_COLORS.status.offline,
    processing: INDUSTRIAL_COLORS.accent.primary,
    warning: INDUSTRIAL_COLORS.status.warning,
    error: INDUSTRIAL_COLORS.status.error,
  };

  return (
    <div
      style={{
        height: '24px',
        backgroundColor: INDUSTRIAL_COLORS.bg.panel,
        borderTop: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '12px',
        paddingRight: '12px',
        gap: '8px',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        color: INDUSTRIAL_COLORS.text.secondary,
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: statusColors[status],
          flexShrink: 0,
        }}
      />
      <span>{message}</span>
      {timestamp && (
        <>
          <div style={{ flex: 1 }} />
          <span style={{ color: INDUSTRIAL_COLORS.text.muted }}>
            {timestamp}
          </span>
        </>
      )}
    </div>
  );
}

/**
 * LoadingOverlay Component
 * Processing indicator with step tracking
 */

interface LoadingOverlayProps {
  visible: boolean;
  currentStep?: string;
  steps?: string[];
  progress?: number;
}

export function LoadingOverlay({
  visible,
  currentStep = 'Processing...',
  steps = [],
  progress = 0,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        style={{
          backgroundColor: INDUSTRIAL_COLORS.bg.elevated,
          borderRadius: '8px',
          border: `1px solid ${INDUSTRIAL_COLORS.ui.border}`,
          padding: '32px 48px',
          maxWidth: '400px',
          textAlign: 'center',
        }}
      >
        {/* Animated spinner */}
        <div
          style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 20px',
            border: `3px solid ${INDUSTRIAL_COLORS.ui.border}`,
            borderTopColor: INDUSTRIAL_COLORS.accent.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />

        <div style={{ color: INDUSTRIAL_COLORS.text.primary, marginBottom: '8px' }}>
          {currentStep}
        </div>

        {progress > 0 && (
          <div
            style={{
              height: '4px',
              backgroundColor: INDUSTRIAL_COLORS.ui.border,
              borderRadius: '2px',
              marginTop: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: INDUSTRIAL_COLORS.accent.primary,
                width: `${progress}%`,
                transition: 'width 200ms ease-out',
              }}
            />
          </div>
        )}

        {steps.length > 0 && (
          <div style={{ marginTop: '16px', textAlign: 'left' }}>
            {steps.map((step, i) => (
              <div
                key={i}
                style={{
                  fontSize: '11px',
                  color: step === currentStep 
                    ? INDUSTRIAL_COLORS.accent.primary 
                    : INDUSTRIAL_COLORS.text.muted,
                  marginTop: i > 0 ? '4px' : 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: step === currentStep 
                      ? INDUSTRIAL_COLORS.accent.primary 
                      : INDUSTRIAL_COLORS.ui.border,
                  }}
                />
                {step}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * ErrorBox Component
 * Inline error display
 */

interface ErrorBoxProps {
  title: string;
  message: string;
  details?: string;
  onRetry?: () => void;
}

export function ErrorBox({ title, message, details, onRetry }: ErrorBoxProps) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        border: `1px solid ${INDUSTRIAL_COLORS.accent.danger}`,
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: INDUSTRIAL_COLORS.accent.danger,
            flexShrink: 0,
            marginTop: '2px',
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: '12px',
              color: INDUSTRIAL_COLORS.accent.danger,
              marginBottom: '4px',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: INDUSTRIAL_COLORS.text.secondary,
              marginBottom: details ? '8px' : 0,
            }}
          >
            {message}
          </div>
          {details && (
            <div
              style={{
                fontSize: '10px',
                color: INDUSTRIAL_COLORS.text.muted,
                fontFamily: 'var(--font-mono)',
                backgroundColor: INDUSTRIAL_COLORS.bg.base,
                padding: '6px',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '100px',
              }}
            >
              {details}
            </div>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                fontSize: '10px',
                backgroundColor: INDUSTRIAL_COLORS.accent.danger,
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
