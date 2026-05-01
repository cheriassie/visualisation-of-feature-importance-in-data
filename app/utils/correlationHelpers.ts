import * as d3 from "d3";

export type MetricKey = "cramers_v" | "contingency_coefficient" | "tschuprows_t" | "chi2";

export const METRIC_LABELS: Record<MetricKey, string> = {
  cramers_v: "Cramér's V",
  contingency_coefficient: "Contingency Coefficient",
  tschuprows_t: "Tschuprow's T",
  chi2: "Chi-squared (χ²)",
};

const chi2Scale = d3.scaleSequential(d3.interpolateOranges).domain([0, 50000]);
const associationScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 1]);

export function heatColor(val: number, metric: MetricKey): string {
  if (metric === "chi2")
    return chi2Scale(Math.min(val, 50000));
  return associationScale(Math.min(1, val));
}

export function heatTextColor(bg: string): string {
  const c = d3.color(bg);
  if (!c) return "#1e293b";
  const { r, g, b } = c.rgb();
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 140 ? "#ffffff" : "#1e293b";
}
