import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import type { RuleAnalytics } from "../../types";
import { TOOLTIP_STYLE, SIGN_COLORS } from "../../utils/chartStyles";
import MetricCard from "../MetricCard";
import ChartPanel from "../ChartPanel";

interface RuleAnalyticsTabProps {
  ruleAnalytics: RuleAnalytics;
}

export default function RuleAnalyticsTab({ ruleAnalytics }: RuleAnalyticsTabProps) {
  const sd = ruleAnalytics.sign_distribution;
  const signDistribution = [
    { name: "+ (moderate)", value: sd.plus },
    { name: "++ (strong)", value: sd.plus_plus },
    { name: "+++ (very strong)", value: sd.plus_plus_plus },
    { name: "÷ (divisor)", value: sd.divisor },
  ].filter((d) => d.value > 0);

  const rs = ruleAnalytics.ratio_stats;
  const ds = ruleAnalytics.depth_stats;
  const bs = ruleAnalytics.base_stats;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">This tab gives a statistical overview of all {ruleAnalytics.total_nodes} nodes across the {ruleAnalytics.total_rules} mined rules. Each node in a rule has a <strong>booster value</strong> — the factor by which it changes the fatal ratio relative to its parent. Nodes are categorised by strength: <strong>+</strong> (weak increase, booster &lt; 5), <strong>++</strong> (moderate, 5–10), <strong>+++</strong> (strong, ≥ 10), and <strong>÷</strong> (divisive — the condition <em>reduces</em> fatal risk). The pie chart shows the distribution across these categories. The stats below summarise the booster values (Ratio Stats), rule depths (Depth Stats), and divisive nodes specifically (Base Stats).</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Rules" value={ruleAnalytics.total_rules} />
        <MetricCard label="Total Nodes" value={ruleAnalytics.total_nodes} />
        <MetricCard label="Mean Booster" value={rs.mean.toFixed(2)} />
        <MetricCard label="Max Booster" value={rs.max.toFixed(2)} />
      </div>

      <ChartPanel title="Sign Distribution">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={signDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {signDistribution.map((_, i) => (
                  <Cell key={i} fill={SIGN_COLORS[i % SIGN_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2 text-sm min-w-[200px]">
            {signDistribution.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: SIGN_COLORS[i] }} />
                <span>{d.name}</span>
                <span className="font-mono ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </ChartPanel>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Ratio Stats", data: rs, decimals: 4 },
          { title: "Depth Stats", data: ds, decimals: 2 },
          { title: "Base Stats (Divisors)", data: bs, decimals: 4 },
        ].map(({ title, data, decimals }) => (
          <div key={title} className="glass-panel">
            <h4 className="text-sm font-semibold mb-2 text-accent">{title}</h4>
            <table className="text-sm w-full">
              <tbody>
                {Object.entries(data).map(([k, v]) => (
                  <tr key={k}>
                    <td className="text-muted">{k}</td>
                    <td className="text-right font-mono">
                      {typeof v === "number" ? v.toFixed(decimals) : v}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
