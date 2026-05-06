# Visualisation of Feature Importance in Data

Interactive dashboard pilot prototype for exploring association rules mined from road accident data. Built with Next.js, D3.js, and Recharts.

## Prerequisites

- Node.js 18+
- Python 3.10+ (for data generation)
- bun or npm

## Setup

1. Install dependencies:

```bash
bun install
# or
npm install
```

2. Generate the data (requires the ARAXAI engine and source CSV):

```bash
cd python
python generate_data.py
```

This creates `public/output.json` which the frontend reads at build time.

3. Run the dev server:

```bash
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
  page.tsx             -main page, loads output.json, renders tabs
  types.ts             -shared TypeScript types
  components/
    tabs/              -one component per tab (Summary, Correlations, etc.)
    CoralPlotV2.tsx    -radial tree (D3)
    ChordDiagram.tsx   -chord diagram (D3)
    DrillDownBarChart.tsx-interactive bar drill-down
    HeatmapD3.tsx      -correlation heatmap (D3)
  utils/
    treeHelpers.ts     -tree filtering, colour scales, label helpers
    chartStyles.ts     -shared colours, axis/tooltip styles
    correlationHelpers.ts-heatmap colour mapping
    d3helpers.ts       -tooltip factory
python/
  generate_data.py     -reads CSV + ARAXAI output, writes output.json
```

## Build

```bash
bun run build
# or
npm run build
```
