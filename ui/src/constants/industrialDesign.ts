/**
 * Industrial Design System
 * Professional theme for PLC engineering IDE
 * Inspired by: VS Code, GX Works3, TIA Portal
 */

export const INDUSTRIAL_COLORS = {
  // Dark industrial background
  bg: {
    base: '#0f172a',        // Main background
    panel: '#1a2332',       // Panel background
    editor: '#111827',      // Editor background
    elevated: '#202d42',    // Elevated surface
    hover: '#2d3e52',       // Hover state
  },

  // Text colors
  text: {
    primary: '#e2e8f0',     // Main text
    secondary: '#94a3b8',   // Secondary text
    muted: '#64748b',       // Muted text
    error: '#ff6b6b',       // Error text
    success: '#51cf66',     // Success text
  },

  // Accent colors - industrial cyan/electric blue
  accent: {
    primary: '#06b6d4',     // Cyan
    secondary: '#0ea5e9',   // Sky blue
    warning: '#f59e0b',     // Amber
    danger: '#ef4444',      // Red
    success: '#10b981',     // Green
  },

  // UI elements
  ui: {
    border: '#334155',      // Subtle border
    divider: '#1e293b',     // Divider line
    focus: '#06b6d4',       // Focus ring
    shadow: 'rgba(0,0,0,0.3)',
  },

  // Status indicators
  status: {
    online: '#10b981',      // Green
    offline: '#7c3aed',     // Violet
    warning: '#f59e0b',     // Amber
    error: '#ef4444',       // Red
  },
} as const;

export const INDUSTRIAL_TYPOGRAPHY = {
  fontFamily: {
    brand: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"Fira Code", "Courier New", monospace',
    ui: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  size: {
    xs: '11px',
    sm: '12px',
    base: '13px',
    lg: '14px',
    xl: '16px',
    '2xl': '18px',
    '3xl': '24px',
  },
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const INDUSTRIAL_SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
} as const;

export const INDUSTRIAL_RADIUS = {
  xs: '2px',
  sm: '4px',
  md: '6px',
  lg: '8px',
} as const;

// Panel sizing
export const PANEL_SIZES = {
  left: {
    min: 200,
    default: 320,
    max: 500,
  },
  right: {
    min: 250,
    default: 360,
    max: 600,
  },
  bottom: {
    min: 100,
    default: 240,
    max: 500,
  },
  divider: 4,
} as const;

// Z-index layers
export const Z_INDEX = {
  base: 0,
  panel: 10,
  toolbar: 20,
  modal: 100,
  tooltip: 1000,
} as const;

// Transitions
export const TRANSITIONS = {
  fast: '100ms ease-out',
  normal: '200ms ease-out',
  slow: '300ms ease-out',
} as const;

// CSS classes for industrial theme
export const CSS_VARS = `
  :root {
    /* Colors */
    --bg-base: ${INDUSTRIAL_COLORS.bg.base};
    --bg-panel: ${INDUSTRIAL_COLORS.bg.panel};
    --bg-editor: ${INDUSTRIAL_COLORS.bg.editor};
    --bg-elevated: ${INDUSTRIAL_COLORS.bg.elevated};
    --bg-hover: ${INDUSTRIAL_COLORS.bg.hover};

    --text-primary: ${INDUSTRIAL_COLORS.text.primary};
    --text-secondary: ${INDUSTRIAL_COLORS.text.secondary};
    --text-muted: ${INDUSTRIAL_COLORS.text.muted};

    --cyan: ${INDUSTRIAL_COLORS.accent.primary};
    --blue: ${INDUSTRIAL_COLORS.accent.secondary};
    --amber: ${INDUSTRIAL_COLORS.accent.warning};
    --red: ${INDUSTRIAL_COLORS.accent.danger};
    --green: ${INDUSTRIAL_COLORS.status.online};

    --border: ${INDUSTRIAL_COLORS.ui.border};
    --divider: ${INDUSTRIAL_COLORS.ui.divider};
    --shadow: ${INDUSTRIAL_COLORS.ui.shadow};

    /* Typography */
    --font-brand: ${INDUSTRIAL_TYPOGRAPHY.fontFamily.brand};
    --font-mono: ${INDUSTRIAL_TYPOGRAPHY.fontFamily.mono};
    --font-ui: ${INDUSTRIAL_TYPOGRAPHY.fontFamily.ui};

    /* Spacing */
    --spacing-xs: ${INDUSTRIAL_SPACING.xs};
    --spacing-sm: ${INDUSTRIAL_SPACING.sm};
    --spacing-md: ${INDUSTRIAL_SPACING.md};
    --spacing-lg: ${INDUSTRIAL_SPACING.lg};
  }
`;
