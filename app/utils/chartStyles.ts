/** Theme colour values mirroring CSS variables-use here for SVG/Recharts props that don't accept var() */
export const THEME_COLORS = {
  muted: "#64748b",
  accent: "#2563eb",
  foreground: "#0f172a",
} as const;

export const COLOR_NEUTRAL = "#94a3b8";
export const FATAL_COLOR = "#ef4444";

export const FEATURES: Record<string, { color: string; short?: string }> = {
  Driver_Age_Band: { color: "#60a5fa", short: "Age" },
  Driver_IMD:      { color: "#f59e0b", short: "IMD" },
  Sex:             { color: "#a78bfa" },
  Journey:         { color: "#34d399" },
  Hit_Objects_in:  { color: "#22d3ee", short: "Hit (road)" },
  Hit_Objects_off: { color: "#fb7185", short: "Hit (off)" },
  Casualties:      { color: "#facc15" },
  Severity:        { color: "#f87171" },
};

export const PIE_COLORS = [
  "#60a5fa", "#f59e0b", "#a78bfa", "#34d399",
  "#22d3ee", "#fb7185", "#facc15", "#f87171", "#94a3b8", "#e879f9",
];

export const SIGN_COLORS = ["#f39c12", "#e74c3c", "#c0392b", "#3498db"];

export const AXIS_STYLE = {
  tick: { fill: THEME_COLORS.muted, fontSize: 12 },
  axisLine: { stroke: "rgba(100,116,139,0.25)" },
  tickLine: { stroke: "rgba(100,116,139,0.15)" },
};

export const GRID_STYLE = {
  strokeDasharray: "3 3" as const,
  stroke: "rgba(100,116,139,0.12)",
};

export const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#ffffff",
    border: "1px solid rgba(100,116,139,0.2)",
    borderRadius: 8,
    color: THEME_COLORS.foreground,
    fontSize: 13,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
};
