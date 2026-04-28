"use client";

import { useRef, useEffect, useMemo } from "react";
import * as d3 from "d3";
import type { ChordData } from "../types";
import { FEATURES } from "../utils/chartStyles";
import { createD3Tooltip } from "../utils/d3helpers";
import { filterChordMatrix } from "../utils/chordHelpers";

interface ChordDiagramProps {
  data: ChordData;
  maxConnections?: number;
  minRelativeStrength?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export default function ChordDiagram({
  data,
  maxConnections = 50,
  minRelativeStrength = 0,
  innerRadius: innerR,
  outerRadius: outerR,
}: ChordDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const filteredMatrix = useMemo(
    () => filterChordMatrix(data.matrix, maxConnections, minRelativeStrength),
    [data.matrix, maxConnections, minRelativeStrength],
  );

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svgRef.current) return;
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 600;
    const height = 600;
    const cR = Math.min(width, height) / 2 - 40;
    const inner = innerR ?? cR * 0.7;
    const outer = outerR ?? cR * 0.74;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const chords = d3.chord().padAngle(0.05).sortSubgroups(d3.descending)(filteredMatrix);
    const arc = d3.arc<d3.ChordGroup>().innerRadius(inner).outerRadius(outer);
    const ribbon = d3.ribbon<d3.Chord, d3.ChordSubgroup>().radius(inner);
    const tooltip = createD3Tooltip();

    const featureColor = (i: number) =>
      FEATURES[data.features[i]]?.color ?? d3.schemeTableau10[i % 10];

    function renderArcs() {
      g.selectAll("path.arc")
        .data(chords.groups)
        .join("path")
        .attr("class", "arc")
        .attr("d", arc as (d: d3.ChordGroup) => string)
        .attr("fill", (d) => featureColor(d.index))
        .attr("stroke", "rgba(0,0,0,0.1)")
        .on("mouseover", (event, d) => {
          const total = filteredMatrix[d.index].reduce((s, v) => s + v, 0);
          tooltip
            .style("display", "block")
            .html(`<strong>${data.features[d.index]}</strong><br/>Total connections: ${total}`);
        })
        .on("mousemove", (event) => {
          tooltip.style("left", event.pageX + 15 + "px").style("top", event.pageY + 15 + "px");
        })
        .on("mouseout", () => tooltip.style("display", "none"));
    }

    function renderLabels() {
      g.selectAll("text.label")
        .data(chords.groups)
        .join("text")
        .attr("class", "label")
        .each(function (d) {
          const angle = (d.startAngle + d.endAngle) / 2;
          const r = outer + 12;
          d3.select(this)
            .attr("x", Math.cos(angle - Math.PI / 2) * r)
            .attr("y", Math.sin(angle - Math.PI / 2) * r)
            .attr("text-anchor", angle > Math.PI ? "end" : "start")
            .attr("transform", `rotate(0)`)
            .attr("fill", "var(--foreground)")
            .attr("font-size", 11)
            .text(FEATURES[data.features[d.index]]?.short ?? data.features[d.index]);
        });
    }

    function renderRibbons() {
      g.selectAll("path.ribbon")
        .data(chords)
        .join("path")
        .attr("class", "ribbon")
        .attr("d", ribbon as (d: d3.Chord) => string)
        .attr("fill", (d) => featureColor(d.source.index))
        .attr("opacity", 0.55)
        .on("mouseover", (event, d) => {
          tooltip
            .style("display", "block")
            .html(
              `<strong>${data.features[d.source.index]} ↔ ${data.features[d.target.index]}</strong><br/>` +
              `Co-occurrence: ${d.source.value}`,
            );
          d3.select(event.currentTarget).attr("opacity", 0.85);
        })
        .on("mousemove", (event) => {
          tooltip.style("left", event.pageX + 15 + "px").style("top", event.pageY + 15 + "px");
        })
        .on("mouseout", (event) => {
          tooltip.style("display", "none");
          d3.select(event.currentTarget).attr("opacity", 0.55);
        });
    }

    renderArcs();
    renderLabels();
    renderRibbons();

    return () => {
      tooltip.remove();
    };
  }, [filteredMatrix, data.features, innerR, outerR]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="600"
      className="rounded-xl border border-slate-400/15 bg-slate-100/60"
    />
  );
}
