"use client";

import { useState } from "react";
import type { CorrelationMatrices } from "../../types";
import { type MetricKey, METRIC_LABELS, heatColor } from "../../utils/correlationHelpers";

interface CorrelationsTabProps {
  correlations: CorrelationMatrices;
}

export default function CorrelationsTab({ correlations }: CorrelationsTabProps) {
  const [metric, setMetric] = useState<MetricKey>("cramers_v");
  const matrix = correlations.matrices[metric];
  const columns = Object.keys(matrix);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">This heatmap shows how strongly each pair of features is related. Pick a metric from the dropdown — Cramér&#39;s V is a good default (0 = no association, 1 = perfect). Chi-squared shows the raw test statistic, and the p-value tells you if the result is statistically significant (smaller = more significant).</p>
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
                  return (
                    <td
                      key={col}
                      style={{
                        background: heatColor(val, metric),
                        color: "#1e293b",
                        fontWeight: row === col ? 700 : 400,
                      }}
                      title={`${row} × ${col}: ${typeof val === "number" ? val.toFixed(4) : val}`}
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
              <span className="text-xs text-muted">
                p={p.p_value < 0.001 ? p.p_value.toExponential(2) : p.p_value.toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
