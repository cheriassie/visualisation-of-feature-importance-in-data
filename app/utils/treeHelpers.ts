import * as d3 from "d3";
import type { TreeNode, CoralTreeNode, Rule } from "../types";
import { FEATURES, COLOR_NEUTRAL } from "./chartStyles";

export function flattenNode(node: TreeNode, depth = 0): Array<{ node: TreeNode; depth: number }> {
  const result: Array<{ node: TreeNode; depth: number }> = [{ node, depth }];
  for (const child of node.children ?? []) {
    result.push(...flattenNode(child, depth + 1));
  }
  return result;
}

export function filterTree(
  node: CoralTreeNode,
  opts: {
    maxDepth: number;
    minBoosterVal: number;
    minSupport: number;
    maxValuesPerAttr: number;
    topN: number;
    importanceMap: Record<string, number>;
  },
  ancestorSigs: Set<string> = new Set(),
  currentDepth = 0,
): CoralTreeNode {
  if (currentDepth >= opts.maxDepth) return { ...node, children: [] };

  let kids = (node.children ?? []).slice();

  kids = kids.filter((c) => (c.booster_val ?? 0) >= opts.minBoosterVal);
  kids = kids.filter((c) => c.support == null || c.support >= opts.minSupport);

  const byFeature: Record<string, CoralTreeNode[]> = {};
  for (const c of kids) {
    const fn = c.feature_name ?? "_";
    if (!byFeature[fn]) byFeature[fn] = [];
    byFeature[fn].push(c);
  }
  kids = [];
  for (const fn of Object.keys(byFeature)) {
    const sorted = byFeature[fn].sort((a, b) => (b.booster_val ?? 0) - (a.booster_val ?? 0));
    kids.push(...sorted.slice(0, opts.maxValuesPerAttr));
  }

  kids.sort((a, b) => {
    const ia = opts.importanceMap[a.feature_name ?? ""] ?? 0;
    const ib = opts.importanceMap[b.feature_name ?? ""] ?? 0;
    if (ib !== ia) return ib - ia;
    return (b.booster_val ?? 0) - (a.booster_val ?? 0);
  });

  kids = kids.filter((c) => {
    const sig = `${c.feature_name}::${c.feature_value}`;
    return !ancestorSigs.has(sig);
  });

  kids = kids.slice(0, opts.topN);

  const nextSigs = new Set(ancestorSigs);
  if (node.feature_name) nextSigs.add(`${node.feature_name}::${node.feature_value}`);

  return { ...node, children: kids.map((c) => filterTree(c, opts, nextSigs, currentDepth + 1)) };
}

const increaseScale = d3.scaleThreshold<number, string>()
  .domain([2, 5, 10])
  .range(["#f39c12", "#e67e22", "#e74c3c", "#c0392b"]);

const decreaseScale = d3.scaleThreshold<number, string>()
  .domain([3, 5])
  .range(["#3498db", "#27ae60", "#16a085"]);

export function boosterColor(node: CoralTreeNode): string {
  const bv = node.booster_val ?? 0;
  if (node.booster_way === "x") return increaseScale(bv);
  if (node.booster_way === "/") return decreaseScale(bv);
  return COLOR_NEUTRAL;
}

export function lineWidth(node: CoralTreeNode): number {
  if (node.support != null && node.support > 0) {
    return Math.min(7.4, Math.max(2.2, Math.log(node.support + 1) * 1.1));
  }
  const bv = node.booster_val ?? 1;
  return Math.min(6, Math.max(2, bv * 0.8));
}

export function nodeLabel(node: CoralTreeNode, depth: number): string {
  const short = FEATURES[node.feature_name ?? ""]?.short ?? node.feature_name ?? "";
  const val = node.feature_value ?? "";
  const raw = short ? `${short}: ${val}` : node.label;
  const limit = depth <= 1 ? 28 : 22;
  return raw.length > limit ? raw.slice(0, limit) + "…" : raw;
}

export function filterRulesByQuery(rules: Rule[], query: string): Rule[] {
  if (!query.trim()) return rules;
  const q = query.toLowerCase();

  const matchesNode = (n: TreeNode): boolean => {
    if (n.label.toLowerCase().includes(q)) return true;
    return (n.children ?? []).some(matchesNode);
  };

  return rules.filter((r) => r.title.toLowerCase().includes(q) || matchesNode(r.root));
}
