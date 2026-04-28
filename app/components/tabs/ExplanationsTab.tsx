"use client";

import { useState, useMemo } from "react";
import type { Rule } from "../../types";
import { filterRulesByQuery } from "../../utils/treeHelpers";
import NodeRow from "../NodeRow";

interface ExplanationsTabProps {
  rules: Rule[];
}

export default function ExplanationsTab({ rules }: ExplanationsTabProps) {
  const [search, setSearch] = useState("");
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => filterRulesByQuery(rules, search), [rules, search]);

  const toggleRule = (id: string) => {
    setExpandedRules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <input
          type="text"
          placeholder="Search rules..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg text-sm bg-white border border-slate-300/50 text-slate-900"
        />
        <span className="text-sm text-muted">
          {filtered.length} / {rules.length} rules
        </span>
      </div>

      <div className="space-y-2 max-h-[700px] overflow-y-auto">
        {filtered.map((rule) => {
          const isOpen = expandedRules.has(rule.id);
          return (
            <div key={rule.id} className="glass-panel">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => toggleRule(rule.id)}
              >
                <span className="text-xs text-muted">
                  {isOpen ? "▾" : "▸"}
                </span>
                <span className="font-semibold text-sm">{rule.title}</span>
                <span className="chip ml-auto">{rule.id}</span>
              </div>
              {isOpen && (
                <div className="mt-2 border-t border-black/10 pt-2">
                  <NodeRow node={rule.root} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
