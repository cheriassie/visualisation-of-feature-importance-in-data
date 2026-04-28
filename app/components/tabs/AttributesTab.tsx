"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import type { Attributes } from "../../types";
import { AXIS_STYLE, TOOLTIP_STYLE, GRID_STYLE, PIE_COLORS } from "../../utils/chartStyles";
import MetricCard from "../MetricCard";
import ChartPanel from "../ChartPanel";

interface AttributesTabProps {
  attributes: Attributes;
}

export default function AttributesTab({ attributes }: AttributesTabProps) {
  const columns = Object.keys(attributes);
  const [selected, setSelected] = useState(columns[0] ?? "");
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");

  const attr = attributes[selected];
  const valueCounts = useMemo(() => {
    if (!attr) return [];
    return Object.entries(attr.value_counts).map(([val, count]) => ({
      name: val,
      count,
      pct: attr.value_counts_percentage[val] ?? 0,
    }));
  }, [attr]);

  if (!attr) return <p className="text-muted">No attribute data.</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center flex-wrap">
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {columns.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button className="btn" onClick={() => setChartType(chartType === "bar" ? "pie" : "bar")}>
          {chartType === "bar" ? "Show Pie" : "Show Bar"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Most Frequent"
          value={attr.most_frequent.value ?? "—"}
          valueClassName="text-base"
          sub={`${attr.most_frequent.count.toLocaleString()} (${attr.most_frequent.percentage}%)`}
        />
        <MetricCard
          label="Least Frequent"
          value={attr.least_frequent.value ?? "—"}
          valueClassName="text-base"
          sub={`${attr.least_frequent.count.toLocaleString()} (${attr.least_frequent.percentage}%)`}
        />
        <MetricCard
          label="Missing"
          value={attr.missing_count.toLocaleString()}
          valueClassName="text-base"
          sub={`${attr.missing_percentage}%`}
        />
        <MetricCard
          label="Unique Values"
          value={attr.unique_count}
          valueClassName="text-base"
        />
      </div>

      <ChartPanel title={`${selected} — ${chartType === "bar" ? "Value Distribution" : "Value Split"}`} height={350}>
        {chartType === "bar" ? (
          <BarChart data={valueCounts}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="name" {...AXIS_STYLE} angle={-35} textAnchor="end" height={100} />
            <YAxis {...AXIS_STYLE} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => v.toLocaleString()} />
            <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <PieChart>
            <Pie
              data={valueCounts}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={140}
              label={({ name, pct }) => `${name} (${pct}%)`}
              labelLine={false}
            >
              {valueCounts.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...TOOLTIP_STYLE} />
          </PieChart>
        )}
      </ChartPanel>
    </div>
  );
}
