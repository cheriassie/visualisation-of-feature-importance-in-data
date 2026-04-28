import * as d3 from "d3";

export function createD3Tooltip() {
  return d3.select("body").append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("background", "#ffffff")
    .style("color", "#0f172a")
    .style("box-shadow", "0 4px 12px rgba(0,0,0,0.12)")
    .style("padding", "8px 12px")
    .style("border-radius", "6px")
    .style("font-size", "12px")
    .style("z-index", "9999")
    .style("display", "none");
}
