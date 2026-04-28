"use client";

import { useRef, useEffect, useMemo } from "react";
import * as d3 from "d3";
import type { CoralTreeNode, FeatureImportance } from "../types";
import { FEATURES, COLOR_NEUTRAL, FATAL_COLOR } from "../utils/chartStyles";
import { boosterColor, filterTree, lineWidth, nodeLabel } from "../utils/treeHelpers";
import { createD3Tooltip } from "../utils/d3helpers";

interface CoralPlotV2Props {
  tree: CoralTreeNode;
  featureImportance?: FeatureImportance;
  maxDepth?: number;
  topN?: number;
  minBoosterVal?: number;
  maxValuesPerAttr?: number;
  minSupport?: number;
}

const NODE_RADIUS = { root: 14, depth1: 10.5, default: 8.6 } as const;

export default function CoralPlotV2({
  tree,
  featureImportance,
  maxDepth = 3,
  topN = 15,
  minBoosterVal = 0,
  maxValuesPerAttr = 5,
  minSupport = 0,
}: CoralPlotV2Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const importanceMap = useMemo(() => {
    if (!featureImportance) return {};
    const m: Record<string, number> = {};
    for (const [k, v] of Object.entries(featureImportance.features)) {
      m[k] = v.normalized_importance;
    }
    return m;
  }, [featureImportance]);

  const filtered = useMemo(
    () =>
      filterTree(tree, {
        maxDepth,
        minBoosterVal,
        minSupport,
        maxValuesPerAttr,
        topN,
        importanceMap,
      }),
    [tree, maxDepth, minBoosterVal, minSupport, maxValuesPerAttr, topN, importanceMap],
  );

  const resetZoom = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(400)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 900;
    const height = svgRef.current.clientHeight || 900;
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.min(cx, cy) - 60;

    const g = svg.append("g");
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (e) => g.attr("transform", e.transform));
    (svg as d3.Selection<SVGSVGElement, unknown, null, undefined>).call(zoom);
    zoomRef.current = zoom;

    const root = d3.hierarchy<CoralTreeNode>(filtered, (d) =>
      d.children.length ? d.children : null,
    );
    const treeRoot = d3.tree<CoralTreeNode>().size([2 * Math.PI, maxRadius])(root);

    const radialPoint = (angle: number, radius: number): [number, number] => [
      cx + radius * Math.cos(angle - Math.PI / 2),
      cy + radius * Math.sin(angle - Math.PI / 2),
    ];

    const ringSpacing = maxRadius / (treeRoot.height || 1);
    const tooltip = createD3Tooltip().style("max-width", "320px");
    const curveGen = d3.line<[number, number]>().curve(d3.curveCardinal.tension(0.42));

    function renderRingGuides() {
      for (let d = 1; d <= treeRoot.height; d++) {
        g.append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", ringSpacing * d)
          .attr("fill", "none")
          .attr("stroke", "rgba(100,116,139,0.12)")
          .attr("stroke-width", 1);
      }
    }

    function renderEdges() {
      for (const ln of treeRoot.descendants()) {
        if (!ln.parent) continue;
        const n = ln.data;
        const isPrimary = ln.depth <= 2;
        const w = lineWidth(n) * (isPrimary ? 1.18 : 0.92);
        const col = boosterColor(n);
        const [lnX, lnY] = radialPoint(ln.x, ln.y);
        const [pX, pY] = radialPoint(ln.parent.x, ln.parent.y);

        const points: [number, number][] = [
          [pX, pY],
          [(pX + lnX) / 2, (pY + lnY) / 2],
          [lnX, lnY],
        ];

        g.append("path")
          .attr("d", curveGen(points)!)
          .attr("fill", "none")
          .attr("stroke", col)
          .attr("stroke-width", w)
          .attr("stroke-dasharray", n.booster_way === "/" ? "5,3" : "none")
          .attr("opacity", isPrimary ? 0.94 : 0.62)
          .on("mouseover", (event) => {
            const bv = n.booster_val ?? 0;
            const dir = n.booster_way === "x" ? "Increases" : "Decreases";
            const sym = n.booster_way === "x" ? "×" : "÷";
            tooltip
              .style("display", "block")
              .html(
                `<strong>${n.label}</strong><br/>` +
                `Booster: ${sym}${bv.toFixed(2)}<br/>` +
                `<span style="color:${col}">${dir} Fatal risk</span><br/>` +
                `Fatal ratio: ${(n.target_ratio ?? 0).toFixed(4)}<br/>` +
                `Baseline: ${(n.baseline_ratio ?? 0).toFixed(4)}<br/>` +
                (n.support != null ? `Support: ${n.support.toLocaleString()}<br/>` : "") +
                `Depth: ${ln.depth}`,
              );
          })
          .on("mousemove", (event) => {
            tooltip.style("left", event.pageX + 15 + "px").style("top", event.pageY + 15 + "px");
          })
          .on("mouseout", () => tooltip.style("display", "none"));
      }
    }

    function renderNodes() {
      for (const ln of treeRoot.descendants()) {
        const n = ln.data;
        const isRoot = ln.depth === 0;
        const [lnX, lnY] = radialPoint(ln.x, ln.y);
        const r = isRoot ? NODE_RADIUS.root : ln.depth === 1 ? NODE_RADIUS.depth1 : NODE_RADIUS.default;
        const fill = isRoot ? FATAL_COLOR : (FEATURES[n.feature_name ?? ""]?.color ?? COLOR_NEUTRAL);

        g.append("circle")
          .attr("cx", lnX)
          .attr("cy", lnY)
          .attr("r", r)
          .attr("fill", fill)
          .attr("stroke", "rgba(0,0,0,0.1)")
          .attr("stroke-width", 1)
          .style("cursor", "pointer")
          .on("mouseover", (event) => {
            const fColor = FEATURES[n.feature_name ?? ""]?.color ?? COLOR_NEUTRAL;
            const bv = n.booster_val;
            const dir =
              n.booster_way === "x" ? "Increases Fatal risk" :
              n.booster_way === "/" ? "Decreases Fatal risk" : "";
            tooltip
              .style("display", "block")
              .html(
                (n.feature_name
                  ? `<span style="color:${fColor};font-weight:700">${n.feature_name}</span><br/>`
                  : `<span style="color:${FATAL_COLOR};font-weight:700">Fatal (root)</span><br/>`) +
                (n.feature_value ? `Value: ${n.feature_value}<br/>` : "") +
                (n.support != null ? `Support: ${n.support.toLocaleString()}<br/>` : "") +
                (bv != null ? `Booster: ${bv.toFixed(2)}<br/>` : "") +
                (dir ? `${dir}<br/>` : "") +
                `Depth: ${ln.depth}`,
              );
          })
          .on("mousemove", (event) => {
            tooltip.style("left", event.pageX + 15 + "px").style("top", event.pageY + 15 + "px");
          })
          .on("mouseout", () => tooltip.style("display", "none"));

        const showLabel =
          isRoot ||
          ln.depth <= 2 ||
          !ln.children?.length ||
          (n.support != null && n.support >= 12) ||
          ln.leaves().length > 2;

        if (showLabel) {
          const label = isRoot ? "Fatal" : nodeLabel(n, ln.depth);
          const onRight = lnX >= cx;
          g.append("text")
            .attr("x", lnX + (onRight ? 14 : -14))
            .attr("y", lnY + (lnY >= cy ? 18 : -12))
            .attr("text-anchor", onRight ? "start" : "end")
            .attr("fill", "var(--foreground)")
            .attr("font-size", isRoot ? 13 : 10)
            .attr("font-weight", isRoot ? 700 : 400)
            .attr("opacity", 0.85)
            .text(label);
        }
      }
    }

    renderRingGuides();
    renderEdges();
    renderNodes();

    return () => {
      tooltip.remove();
    };
  }, [filtered]);

  return (
    <div className="relative">
      <button onClick={resetZoom} className="btn absolute top-2 right-2 z-10">
        Reset View
      </button>
      <svg ref={svgRef} width="100%" height="900" className="rounded-xl border border-slate-400/15 bg-slate-100/60" />
    </div>
  );
}
