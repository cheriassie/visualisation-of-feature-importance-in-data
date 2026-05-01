"use client";

import { useState, useMemo } from "react";
import type { ChordData, CoralTreeNode, FeatureImportance } from "../../types";
import { FEATURES, COLOR_NEUTRAL } from "../../utils/chartStyles";
import { sortPairs, networkDensity } from "../../utils/chordHelpers";
import ChordDiagram from "../ChordDiagram";
import CoralPlotV2 from "../CoralPlotV2";
import DrillDownBarChart from "../DrillDownBarChart";
import MetricCard from "../MetricCard";

type SubView = "overview" | "chord" | "coral" | "drilldown" | "matrix" | "pairs";

interface ChordVisualizationTabProps {
  chordData?: ChordData;
  coralTree?: CoralTreeNode;
  coralRuleCount?: number;
  featureImportance?: FeatureImportance;
  targetInfo?: { target_class: string; baseline_ratio: number; target_var_profile: Record<string, number> };
}

const SUB_VIEWS: { key: SubView; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "chord", label: "Chord Network" },
  { key: "coral", label: "Coral Tree" },
  { key: "drilldown", label: "Drill-Down" },
  { key: "matrix", label: "Matrix" },
  { key: "pairs", label: "Pairs" },
];

const PAIR_SORT_BUTTONS: { key: "value" | "source" | "target"; label: string }[] = [
  { key: "value", label: "By Count" },
  { key: "source", label: "By Source" },
  { key: "target", label: "By Target" },
];

function RangeControl({ label, min, max, step, value, display, onChange }: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  display?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-xs block mb-1 text-muted">
        {label}: {display ?? value}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
    </div>
  );
}

export default function ChordVisualizationTab({
  chordData,
  coralTree,
  coralRuleCount,
  featureImportance,
  targetInfo,
}: ChordVisualizationTabProps) {
  const [view, setView] = useState<SubView>("coral");
  const [maxDepth, setMaxDepth] = useState(3); // deeper trees hit layout limits fast
  const [topN, setTopN] = useState(5); // more than 5 features per node overloads the radial render
  const [minBoosterVal, setMinBoosterVal] = useState(0);
  const [maxValuesPerAttr, setMaxValuesPerAttr] = useState(5);
  const [minSupport, setMinSupport] = useState(0);
  const [maxConnections, setMaxConnections] = useState(50);
  const [minRelStrength, setMinRelStrength] = useState(0);
  const [pairSortKey, setPairSortKey] = useState<"value" | "source" | "target">("value");

  const sortedPairs = useMemo(
    () => (chordData ? sortPairs(chordData.pairs, pairSortKey) : []),
    [chordData, pairSortKey],
  );

  const nFeatures = chordData?.features?.length ?? 0;
  const totalConnections = chordData?.pairs?.reduce((s, p) => s + p.value, 0) ?? 0;
  const density = networkDensity(chordData?.pairs?.length ?? 0, nFeatures);
  const strongestPair = chordData?.pairs?.[0];

  function renderSubView() {
    switch (view) {
      case "overview":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Features" value={nFeatures} />
              <MetricCard label="Total Co-occurrences" value={totalConnections} />
              <MetricCard label="Network Density" value={density} />
              <MetricCard label="Coral Rules" value={coralRuleCount ?? 0} />
            </div>
            {strongestPair && (
              <div className="glass-panel">
                <h3 className="text-lg font-semibold mb-2 text-accent">Strongest Pair</h3>
                <p className="text-sm">
                  <strong>{strongestPair.source}</strong> ↔ <strong>{strongestPair.target}</strong>
                  {" — "}
                  <span className="font-mono text-accent">{strongestPair.value} co-occurrences</span>
                </p>
              </div>
            )}
            {targetInfo && (
              <div className="glass-panel">
                <p className="text-sm text-muted">
                  Target: <strong className="text-red-500">{targetInfo.target_class}</strong>
                  {" | "}Baseline: <strong>{(targetInfo.baseline_ratio * 100).toFixed(2)}%</strong>
                </p>
              </div>
            )}
          </div>
        );

      case "chord":
        if (!chordData) return null;
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted">The chord diagram shows how often features appear together in association rules. Thicker ribbons mean more co-occurrences. Use the sliders to filter out weak or rare connections.</p>
            <div className="glass-panel flex gap-6 flex-wrap items-end">
              <RangeControl label="Max Connections" min={1} max={100} value={maxConnections} onChange={setMaxConnections} />
              <RangeControl label="Min Relative Strength" min={0} max={1} step={0.01} value={minRelStrength} display={minRelStrength.toFixed(2)} onChange={setMinRelStrength} />
            </div>
            <ChordDiagram data={chordData} maxConnections={maxConnections} minRelativeStrength={minRelStrength} />
          </div>
        );

      case "coral":
        if (!coralTree) return null;
        return (
          <div className="space-y-4">
            <div className="glass-panel flex gap-6 flex-wrap items-end">
              <RangeControl label="Max Depth" min={1} max={5} value={maxDepth} onChange={setMaxDepth} />
              <RangeControl label="Top N Features" min={1} max={40} value={topN} onChange={setTopN} />
              <RangeControl label="Min Booster" min={0} max={10} step={0.5} value={minBoosterVal} display={minBoosterVal.toFixed(1)} onChange={setMinBoosterVal} />
              <RangeControl label="Max Values/Attr" min={1} max={15} value={maxValuesPerAttr} onChange={setMaxValuesPerAttr} />
              <RangeControl label="Min Support" min={0} max={1000} step={10} value={minSupport} onChange={setMinSupport} />
            </div>
            <div className="glass-panel text-xs space-y-3 text-muted">
              <p className="text-fg text-sm mb-2">The coral plot shows association rules as a radial tree. The target class (Fatal) sits at the centre. Each branch is a rule condition — the further from the centre, the deeper the rule. Line colour shows whether a condition increases or decreases fatal risk, and how strongly.</p>
              <div className="flex gap-5 flex-wrap items-center">
                <span className="font-semibold text-fg">Node colour = feature</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" /> Fatal (centre)
                </div>
                {Object.entries(FEATURES).map(([f, { color, short }]) => (
                  <div key={f} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: color }} /> {short ?? f}
                  </div>
                ))}
              </div>
              <div className="flex gap-5 flex-wrap items-center">
                <span className="font-semibold text-fg">Line colour = direction &amp; strength</span>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-[22px] h-[3px] rounded-sm" style={{background: "#f39c12"}} /> Weak increase (×)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-[22px] h-[3px] rounded-sm" style={{background: "#c0392b"}} /> Strong increase (×)
                </div>
                <div className="flex items-center gap-1.5">
                  <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke="#93c5fd" strokeWidth="3" strokeDasharray="4,3" /></svg> Weak decrease (÷)
                </div>
                <div className="flex items-center gap-1.5">
                  <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke="#1d4ed8" strokeWidth="3" strokeDasharray="4,3" /></svg> Strong decrease (÷)
                </div>
              </div>
              <div className="flex gap-5 flex-wrap items-center">
                <span className="font-semibold text-fg">Reading the plot</span>
                <span>Each ring = one level deeper in the rule</span>
                <span>Thicker line = more records support this rule</span>
                <span>Dashed line = decreases fatal risk</span>
                <span>Solid line = increases fatal risk</span>
              </div>
            </div>
            <CoralPlotV2
              tree={coralTree}
              featureImportance={featureImportance}
              maxDepth={maxDepth}
              topN={topN}
              minBoosterVal={minBoosterVal}
              maxValuesPerAttr={maxValuesPerAttr}
              minSupport={minSupport}
            />
          </div>
        );

      case "drilldown":
        return coralTree ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">Click any bar to drill into its child conditions. The breadcrumb at the top lets you go back. Bar colour shows the direction — warm colours mean the condition increases fatal risk (×), cool blue means it decreases it (÷). The number on the right is the booster value.</p>
            <DrillDownBarChart tree={coralTree} />
          </div>
        ) : null;

      case "matrix":
        if (!chordData) return null;
        return (
          <div className="glass-panel overflow-x-auto">
            <h3 className="text-lg font-semibold mb-3 text-accent">Co-occurrence Matrix</h3>
            <p className="text-sm text-muted mb-3">Each cell shows how many rules contain both the row feature and the column feature. Higher values (darker blue) mean those two features are often found together in the mined rules.</p>
            <table className="heatmap-table">
              <thead>
                <tr>
                  <th />
                  {chordData.features.map((f) => <th key={f}>{f}</th>)}
                </tr>
              </thead>
              <tbody>
                {chordData.features.map((row, i) => (
                  <tr key={row}>
                    <th className="text-right">{row}</th>
                    {chordData.features.map((_, j) => {
                      const v = chordData.matrix[i][j];
                      const alpha = Math.min(0.7, v / 50);
                      return (
                        <td
                          key={j}
                          style={{
                            background: v > 0 ? `rgba(37,99,235,${alpha})` : "transparent",
                            color: alpha > 0.4 ? "#fff" : "inherit",
                          }}
                        >
                          {v}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "pairs":
        if (!chordData) return null;
        return (
          <div className="glass-panel">
            <h3 className="text-lg font-semibold mb-3 text-accent">Ranked Feature Pairs</h3>
            <p className="text-sm text-muted mb-3">A flat list of all feature pairs sorted by how often they co-occur. You can re-sort by source or target name to find specific features faster.</p>
            <div className="flex gap-3 mb-3">
              {PAIR_SORT_BUTTONS.map(({ key, label }) => (
                <button
                  key={key}
                  className={`btn ${pairSortKey === key ? "active" : ""}`}
                  onClick={() => setPairSortKey(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {sortedPairs.map((p, i) => (
                <div key={i} className="flex items-center gap-3 text-sm py-1">
                  <span className="w-6 text-right font-mono text-xs text-muted">{i + 1}</span>
                  <span className="w-3 h-3 rounded-full" style={{ background: FEATURES[p.source]?.color ?? COLOR_NEUTRAL }} />
                  <span>{p.source}</span>
                  <span className="text-muted">↔</span>
                  <span className="w-3 h-3 rounded-full" style={{ background: FEATURES[p.target]?.color ?? COLOR_NEUTRAL }} />
                  <span>{p.target}</span>
                  <span className="font-mono ml-auto text-accent">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {SUB_VIEWS.map((b) => (
          <button
            key={b.key}
            className={`btn ${view === b.key ? "active" : ""}`}
            onClick={() => setView(b.key)}
          >
            {b.label}
          </button>
        ))}
      </div>

      {renderSubView()}

      {!chordData && !coralTree && (
        <p className="text-muted">No chord or coral data available. Run the Python pipeline first.</p>
      )}
    </div>
  );
}
