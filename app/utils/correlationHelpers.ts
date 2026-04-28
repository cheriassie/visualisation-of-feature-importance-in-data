import * as d3 from "d3";

export type MetricKey = "cramers_v" | "contingency_coefficient" | "tschuprows_t" | "chi2" | "p_value";

export const METRIC_LABELS: Record<MetricKey, string> = {
  cramers_v: "Cramér's V",
  contingency_coefficient: "Contingency Coefficient",
  tschuprows_t: "Tschuprow's T",
  chi2: "Chi-squared",
  p_value: "P-value",
};

const pValueScale = d3.scaleSequential(d3.interpolateReds).domain([0, 20]);
const chi2Scale = d3.scaleSequential(d3.interpolateOranges).domain([0, 50000]);
const associationScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 1]);

export function heatColor(val: number, metric: MetricKey): string {
  if (metric === "p_value")
    return pValueScale(Math.min(-Math.log10(Math.max(val, 1e-300)), 20));
  if (metric === "chi2")
    return chi2Scale(Math.min(val, 50000));
  return associationScale(Math.min(1, val));
}
