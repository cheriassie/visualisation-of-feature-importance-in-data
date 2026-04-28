"use client";

import { useState } from "react";
import type { TreeNode } from "../types";

export default function NodeRow({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = !!node.children?.length;

  const directionBadge = () => {
    if (node.correlation === "positive")
      return <span className="chip text-red-500 border-red-500/20">× Increases</span>;
    if (node.correlation === "negative")
      return <span className="chip text-blue-400 border-blue-400/20">÷ Decreases</span>;
    return null;
  };

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div
        className="flex items-center gap-2 py-1 px-2 rounded hover:bg-black/5 cursor-pointer text-sm"
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          <span className="w-4 text-center text-xs text-muted">
            {expanded ? "▾" : "▸"}
          </span>
        ) : (
          <span className="w-4" />
        )}

        <span className="font-medium">{node.label}</span>

        {node.booster_val != null && (
          <span className="text-xs font-mono text-accent">
            {node.booster_way === "x" ? "×" : node.booster_way === "/" ? "÷" : ""}
            {node.booster_val.toFixed(2)}
          </span>
        )}

        {directionBadge()}

        {node.sign && (
          <span className="text-xs text-green-400">{node.sign}</span>
        )}

        {node.target_ratio != null && (
          <span className="text-xs text-muted">
            ratio: {node.target_ratio.toFixed(4)}
          </span>
        )}
      </div>

      {expanded &&
        hasChildren &&
        node.children!.map((child, i) => (
          <NodeRow key={child.id || i} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}
