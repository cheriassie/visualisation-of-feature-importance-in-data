"use client";

import { useState } from "react";
import type { Rule } from "../../types";
import { flattenNode } from "../../utils/treeHelpers";

interface RawCalculationsTabProps {
  rules: Rule[];
}

export default function RawCalculationsTab({ rules }: RawCalculationsTabProps) {
  const [selectedRule, setSelectedRule] = useState(0);

  if (rules.length === 0) {
    return <p className="text-muted">No rules available.</p>;
  }

  const rule = rules[selectedRule];
  const nodes = flattenNode(rule.root);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center flex-wrap">
        <label className="text-sm text-muted">Rule:</label>
        <select
          value={selectedRule}
          onChange={(e) => setSelectedRule(Number(e.target.value))}
        >
          {rules.map((r, i) => (
            <option key={r.id} value={i}>{r.title}</option>
          ))}
        </select>
      </div>

      <div className="glass-panel overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3 text-accent">
          {rule.title} — Node Details
        </h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {["Depth", "ID", "Label", "Booster", "Way", "Target Ratio", "Correlation", "Sign", "Base", "Ratio Subset"].map((h) => (
                <th
                  key={h}
                  className="text-left py-2 px-3 border-b border-slate-300/50 text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nodes.map(({ node: n, depth }, i) => (
              <tr key={i} className="hover:bg-black/5">
                <td className="py-1 px-3 font-mono text-xs">{depth}</td>
                <td className="py-1 px-3 font-mono text-xs">{n.id}</td>
                <td className="py-1 px-3" style={{ paddingLeft: depth * 16 + 12 }}>{n.label}</td>
                <td className="py-1 px-3 font-mono">{n.booster_val?.toFixed(3) ?? "—"}</td>
                <td className="py-1 px-3">{n.booster_way === "x" ? "×" : n.booster_way === "/" ? "÷" : "—"}</td>
                <td className="py-1 px-3 font-mono">{n.target_ratio?.toFixed(4) ?? "—"}</td>
                <td className="py-1 px-3">
                  {n.correlation === "positive" && <span className="text-red-500">Positive</span>}
                  {n.correlation === "negative" && <span className="text-blue-400">Negative</span>}
                  {!n.correlation && "—"}
                </td>
                <td className="py-1 px-3 text-green-400">{n.sign ?? "—"}</td>
                <td className="py-1 px-3 font-mono">{n.base?.toFixed(3) ?? "—"}</td>
                <td className="py-1 px-3 font-mono">{n.ratio_subset?.toFixed(3) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
