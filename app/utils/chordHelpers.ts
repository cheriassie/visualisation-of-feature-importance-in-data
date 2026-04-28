import type { ChordData } from "../types";

export function filterChordMatrix(
  matrix: number[][],
  maxConnections: number,
  minRelativeStrength: number,
): number[][] {
  const n = matrix.length;
  const maxVal = Math.max(...matrix.flat());
  const threshold = minRelativeStrength * maxVal;

  const thresholded = matrix.map((row) => row.map((v) => (v >= threshold ? v : 0)));

  const pairs: { i: number; j: number; v: number }[] = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      if (thresholded[i][j] > 0) pairs.push({ i, j, v: thresholded[i][j] });

  pairs.sort((a, b) => b.v - a.v);
  const keep = new Set(pairs.slice(0, maxConnections).map((p) => `${p.i}-${p.j}`));

  const result = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const p of pairs) {
    if (keep.has(`${p.i}-${p.j}`)) {
      result[p.i][p.j] = p.v;
      result[p.j][p.i] = p.v;
    }
  }
  return result;
}

export function sortPairs(
  pairs: ChordData["pairs"],
  key: "value" | "source" | "target",
): ChordData["pairs"] {
  const copy = [...pairs];
  if (key === "value") copy.sort((a, b) => b.value - a.value);
  else if (key === "source") copy.sort((a, b) => a.source.localeCompare(b.source));
  else copy.sort((a, b) => a.target.localeCompare(b.target));
  return copy;
}

export function networkDensity(pairsCount: number, nFeatures: number): string {
  const maxPossible = (nFeatures * (nFeatures - 1)) / 2;
  return maxPossible > 0 ? (pairsCount / maxPossible).toFixed(2) : "0";
}
