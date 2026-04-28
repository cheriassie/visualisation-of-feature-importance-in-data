"use client";

import { useState } from "react";
import type { CoralTreeNode } from "../types";
import { FEATURES, COLOR_NEUTRAL } from "../utils/chartStyles";
import { boosterColor } from "../utils/treeHelpers";

export default function DrillDownBarChart({ tree }: { tree: CoralTreeNode }) {
  const [path, setPath] = useState<CoralTreeNode[]>([tree]);

  const current = path[path.length - 1];
  const children = (current.children ?? [])
    .slice()
    .sort((a, b) => (b.booster_val ?? 0) - (a.booster_val ?? 0));
  const maxVal = Math.max(1, ...children.map((c) => c.booster_val ?? 0));

  const drillInto = (child: CoralTreeNode) => {
    if (!!child.children?.length) setPath([...path, child]);
  };

  const goBack = (idx: number) => setPath(path.slice(0, idx + 1));

  return (
    <div className="glass-panel">
      <div className="flex gap-1 flex-wrap mb-4 text-sm">
        {path.map((p, i) => (
          <span key={i}>
            {i > 0 && <span className="text-muted"> › </span>}
            <button
              className="text-blue-400 hover:underline"
              onClick={() => goBack(i)}
            >
              {p.label || "Fatal"}
            </button>
          </span>
        ))}
      </div>

      {children.length === 0 ? (
        <p className="text-muted">No child nodes at this level.</p>
      ) : (
        <div className="space-y-2">
          {children.map((child) => {
            const bv = child.booster_val ?? 0;
            const pct = (bv / maxVal) * 100;
            const col = boosterColor(child);
            const hasKids = !!child.children?.length;
            const sym = child.booster_way === "x" ? "×" : child.booster_way === "/" ? "÷" : "";

            return (
              <div
                key={child.id}
                className={`flex items-center gap-3 cursor-pointer group${!hasKids ? " opacity-70" : ""}`}
                onClick={() => drillInto(child)}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    background: FEATURES[child.feature_name ?? ""]?.color ?? COLOR_NEUTRAL,
                  }}
                />

                <span className="w-48 text-sm truncate" title={child.label}>
                  {child.feature_value ?? child.label}
                </span>

                <div className="flex-1 h-6 rounded overflow-hidden bg-black/[0.04]">
                  <div
                    className="h-full rounded transition-all"
                    style={{ width: `${pct}%`, background: col }}
                  />
                </div>

                <span className="text-sm font-mono w-20 text-right" style={{ color: col }}>
                  {sym}{bv.toFixed(2)}
                </span>

                {hasKids && (
                  <span className="text-xs text-blue-400 group-hover:translate-x-1 transition-transform">
                    ▸
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
