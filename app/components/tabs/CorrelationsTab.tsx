"use client";

import { useState } from "react";
import type { CorrelationMatrices } from "../../types";
import { type MetricKey, METRIC_LABELS, heatColor, heatTextColor } from "../../utils/correlationHelpers";

interface CorrelationsTabProps {
  correlations: CorrelationMatrices;
}

export default function CorrelationsTab({ correlations }: CorrelationsTabProps) {
  const [metric, setMetric] = useState<MetricKey>("cramers_v");
  const matrix = correlations.matrices[metric];
  const columns = Object.keys(matrix);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">This heatmap shows how strongly each pair of features is statistically associated. Pick a metric from the dropdown — Cramér&#39;s V is a good default (0 = no association, 1 = perfect). Chi-squared (χ²) shows the raw test statistic — higher values mean stronger deviation from independence. With ~539k records in this dataset, all p-values are effectively zero (every association is statistically significant), so p-value is not shown as a separate metric — hover over any chi-squared cell to see it in the tooltip.</p>
      <div className="flex gap-3 items-center flex-wrap">
        <label className="text-sm text-muted">Metric:</label>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as MetricKey)}
        >
          {Object.entries(METRIC_LABELS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
      </div>

      <div className="glass-panel overflow-x-auto">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th />
              {columns.map((c) => (
                <th key={c} className="[writing-mode:vertical-lr] min-w-10">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {columns.map((row) => (
              <tr key={row}>
                <th className="text-right pr-2">{row}</th>
                {columns.map((col) => {
                  const val = matrix[row]?.[col] ?? 0;
                  const bg = heatColor(val, metric);
                  const pVal = correlations.matrices.p_value?.[row]?.[col];
                  const chi2Val = correlations.matrices.chi2?.[row]?.[col];
                  let tooltip = `${row} × ${col}: ${typeof val === "number" ? val.toFixed(4) : val}`;
                  if (metric === "chi2" && pVal != null) {
                    tooltip += `\np-value: ${pVal === 0 ? "≈ 0" : pVal < 0.001 ? pVal.toExponential(2) : pVal.toFixed(4)}`;
                  } else if (metric !== "chi2" && chi2Val != null) {
                    tooltip += `\nχ²: ${chi2Val.toFixed(0)}`;
                  }
                  return (
                    <td
                      key={col}
                      style={{
                        background: bg,
                        color: heatTextColor(bg),
                        fontWeight: row === col ? 700 : 400,
                      }}
                      title={tooltip}
                    >
                      {typeof val === "number" ? (metric === "chi2" ? val.toFixed(0) : val.toFixed(3)) : val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-panel">
        <h3 className="text-lg font-semibold mb-3 text-accent">
          Top Correlated Pairs (Cramér&apos;s V)
        </h3>
        <div className="space-y-1">
          {correlations.top_pairs.slice(0, 15).map((p, i) => (
            <div key={i} className="flex items-center gap-3 text-sm py-1">
              <span className="w-6 text-right font-mono text-xs text-muted">
                {i + 1}
              </span>
              <span className="font-medium">{p.col1} ↔ {p.col2}</span>
              <span className="font-mono text-accent">
                {p.cramers_v.toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
