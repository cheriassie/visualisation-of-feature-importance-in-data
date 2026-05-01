"use client";

import { useState, useEffect } from "react";
import type { Output, Tab } from "./types";

import SummaryTab from "./components/tabs/SummaryTab";
import AttributesTab from "./components/tabs/AttributesTab";
import CorrelationsTab from "./components/tabs/CorrelationsTab";
import FeatureImportanceTab from "./components/tabs/FeatureImportanceTab";
import RuleAnalyticsTab from "./components/tabs/RuleAnalyticsTab";
import ChordVisualizationTab from "./components/tabs/ChordVisualizationTab";
const TABS: { key: Tab; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "attributes", label: "Attributes" },
  { key: "correlations", label: "Correlations" },
  { key: "feature-importance", label: "Feature Importance" },
  { key: "rule-analytics", label: "Rule Analytics" },
  { key: "chord", label: "Chord & Coral" },
];

function renderActiveTab(data: Output, tab: Tab) {
  switch (tab) {
    case "summary":
      return <SummaryTab summary={data.summary} metadata={data.metadata} targetInfo={data.target_info} />;
    case "attributes":
      return <AttributesTab attributes={data.attributes} />;
    case "correlations":
      return <CorrelationsTab correlations={data.correlations} />;
    case "feature-importance":
      return data.feature_importance
        ? <FeatureImportanceTab featureImportance={data.feature_importance} />
        : null;
    case "rule-analytics":
      return data.rule_analytics
        ? <RuleAnalyticsTab ruleAnalytics={data.rule_analytics} />
        : null;
    case "chord":
      return (
        <ChordVisualizationTab
          chordData={data.chord_data}
          coralTree={data.coral_tree}
          coralRuleCount={data.coral_rules?.length}
          featureImportance={data.feature_importance}
          targetInfo={data.target_info}
        />
      );
  }
}

export default function Home() {
  const [data, setData] = useState<Output | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/output.json");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setData(await r.json() as Output);
      } catch (e) {
        setError((e as Error).message);
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel text-center max-w-md">
          <h2 className="text-xl font-bold mb-2 text-red-400">Error Loading Data</h2>
          <p className="text-sm text-muted">
            Could not load <code>output.json</code>. Run the Python pipeline first.
          </p>
          <p className="text-xs mt-2 text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel text-center">
          <p className="text-muted">Loading data…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-accent">
        Feature Importance Visualization
      </h1>

      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {renderActiveTab(data, activeTab)}
    </main>
  );
}
