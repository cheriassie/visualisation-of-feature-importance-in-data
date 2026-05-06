import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import type { Summary, OutputMetadata } from "../../types";
import { AXIS_STYLE, TOOLTIP_STYLE, GRID_STYLE } from "../../utils/chartStyles";
import MetricCard from "../MetricCard";
import ChartPanel from "../ChartPanel";

interface SummaryTabProps {
  summary: Summary;
  metadata?: OutputMetadata;
  targetInfo?: { target_class: string; baseline_ratio: number; target_var_profile: Record<string, number> };
}

export default function SummaryTab({ summary, metadata, targetInfo }: SummaryTabProps) {
  const missingPerColumn = Object.entries(summary.missing_counts).map(([col, count]) => ({
    name: col,
    count,
    pct: summary.missing_percentages[col] ?? 0,
  }));
  console.log('metadata', metadata);
  const uniquePerColumn = Object.entries(summary.unique_counts).map(([col, count]) => ({
    name: col,
    count,
  }));

  const qualityPct = (100 - summary.total_missing_percentage).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Rows" value={summary.total_rows.toLocaleString()} />
        <MetricCard label="Columns" value={summary.total_columns} />
        <MetricCard label="Categories" value={summary.total_categories} />
        <MetricCard label="Data Quality" value={`${qualityPct}%`} />
      </div>

      {targetInfo && (
        <div className="glass-panel">
          <h3 className="text-lg font-semibold mb-3 text-accent">
            Target: {targetInfo.target_class}
          </h3>
          <p className="text-sm mb-2 text-muted">
            Baseline ratio: <strong>{(targetInfo.baseline_ratio * 100).toFixed(2)}%</strong>
          </p>
          <div className="flex gap-4 flex-wrap">
            {Object.entries(targetInfo.target_var_profile).map(([cls, count]) => (
              <MetricCard
                key={cls}
                label={cls}
                value={count.toLocaleString()}
                valueClassName="text-lg"
                className="flex-1 min-w-[120px]"
              />
            ))}
          </div>
        </div>
      )}

      {metadata && (
        <div className="glass-panel">
          <h3 className="text-lg font-semibold mb-2 text-accent">Pipeline Info</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted">
            <div>Generated: {new Date(metadata.generated_at).toLocaleString()}</div>
            <div>Python: {metadata.python_version}</div>
            <div>Pandas: {metadata.pandas_version}</div>
            <div>ARAXAI: {metadata.araxai_version}</div>
          </div>
          <div className="mt-2 text-xs text-muted">
            Imputation: {metadata.data_preprocessing.imputation_strategy} |
            Missing before: {metadata.data_preprocessing.missing_values_before.toLocaleString()} |
            Missing after: {metadata.data_preprocessing.missing_values_after}
          </div>
        </div>
      )}

      <ChartPanel title="Missing Values per Column" height={300}>
        <BarChart data={missingPerColumn}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="name" {...AXIS_STYLE} angle={-35} textAnchor="end" height={80} />
          <YAxis {...AXIS_STYLE} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => v.toLocaleString()} />
          <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Missing Count" />
        </BarChart>
      </ChartPanel>

      <ChartPanel title="Unique Values per Column" height={300}>
        <BarChart data={uniquePerColumn}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="name" {...AXIS_STYLE} angle={-35} textAnchor="end" height={80} />
          <YAxis {...AXIS_STYLE} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Unique Values" />
        </BarChart>
      </ChartPanel>
    </div>
  );
}
