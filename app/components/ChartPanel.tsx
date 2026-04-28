"use client";

import { ResponsiveContainer } from "recharts";

export default function ChartPanel({ title, height, children, className }: {
  title: string;
  height?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass-panel${className ? ` ${className}` : ""}`}>
      <h3 className="text-lg font-semibold mb-4 text-accent">{title}</h3>
      {height ? (
        <ResponsiveContainer width="100%" height={height}>
          {children as React.ReactElement}
        </ResponsiveContainer>
      ) : (
        children
      )}
    </div>
  );
}
