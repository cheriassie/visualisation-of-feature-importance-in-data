"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell,
} from "recharts";
import type { FeatureImportance } from "../../types";
import { FEATURES, COLOR_NEUTRAL, AXIS_STYLE, TOOLTIP_STYLE, GRID_STYLE, THEME_COLORS } from "../../utils/chartStyles";
import MetricCard from "../MetricCard";
import ChartPanel from "../ChartPanel";

interface FeatureImportanceTabProps {
  featureImportance: FeatureImportance;
}

export default function FeatureImportanceTab({ featureImportance }: FeatureImportanceTabProps) {
  const featuresByImportance = useMemo(() => {
    return Object.entries(featureImportance.features)
      .map(([name, data]) => ({
        name,
        importance: data.normalized_importance,
        count: data.count,
        fill: FEATURES[name]?.color ?? COLOR_NEUTRAL,
      }))
      .sort((a, b) => b.importance - a.importance);
  }, [featureImportance]);

  const topFeaturesForRadar = useMemo(() => {
    return featuresByImportance.slice(0, 7).map((d) => ({
      feature: d.name,
      importance: d.importance,
      fullMark: 1,
    }));
  }, [featuresByImportance]);

  return (
    <div className="space-y-6">
      <MetricCard label="Total Rules Analyzed" value={featureImportance.total_rules} className="inline-block" />

      <ChartPanel title="Normalized Feature Importance" height={350}>
        <BarChart data={featuresByImportance} layout="vertical">
          <CartesianGrid {...GRID_STYLE} />
          <XAxis type="number" domain={[0, 1]} {...AXIS_STYLE} />
          <YAxis type="category" dataKey="name" width={120} {...AXIS_STYLE} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => v.toFixed(4)} />
          <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
            {featuresByImportance.map((d, i) => (
              <Cell key={i} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartPanel>

      <ChartPanel title="Feature Importance Radar" height={400}>
        <RadarChart data={topFeaturesForRadar}>
          <PolarGrid stroke="rgba(100,116,139,0.15)" />
          <PolarAngleAxis dataKey="feature" tick={{ fill: THEME_COLORS.muted, fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 1]} tick={{ fill: THEME_COLORS.muted, fontSize: 10 }} />
          <Radar
            dataKey="importance"
            stroke={THEME_COLORS.accent}
            fill={THEME_COLORS.accent}
            fillOpacity={0.3}
          />
          <Tooltip {...TOOLTIP_STYLE} />
        </RadarChart>
      </ChartPanel>

      <div className="glass-panel">
        <h3 className="text-lg font-semibold mb-3 text-accent">Rule Count per Feature</h3>
        <div className="space-y-2">
          {featuresByImportance.map((d) => {
            const feat = featureImportance.features[d.name];
            return (
              <div key={d.name} className="flex items-center gap-3 text-sm">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: d.fill }} />
                <span className="w-32">{d.name}</span>
                <span className="font-mono text-accent">{feat.count} rules</span>
                <span className="text-xs text-muted">
                  freq: {feat.frequency.toFixed(2)} | avg ratio: {feat.avg_ratio.toFixed(2)} | max: {feat.max_ratio.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
