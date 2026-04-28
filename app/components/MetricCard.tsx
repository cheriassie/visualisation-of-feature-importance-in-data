export default function MetricCard({ label, value, sub, className, valueClassName }: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`metric-card${className ? ` ${className}` : ""}`}>
      <h4>{label}</h4>
      <div className={`value${valueClassName ? ` ${valueClassName}` : ""}`}>{value}</div>
      {sub && <p className="text-xs mt-1 text-muted">{sub}</p>}
    </div>
  );
}
