"use client";

import * as React from "react";

type ChartDataPoint = {
  label: string;
  value: number;
};

type LineChartProps = {
  data: ChartDataPoint[];
  height?: number;
};

export default function LineChart({ data, height = 200 }: LineChartProps) {
  if (!data || data.length < 2) return null;

  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min === 0 ? 1 : max - min;

  const padding = 20;
  const chartHeight = height - padding * 2;

  // Compute clean SVG points coordinates
  const points = data
    .map((d, index) => {
      const x = (index / (data.length - 1)) * 100; // Percentage-based width spacing
      const y = padding + (chartHeight - ((d.value - min) / range) * chartHeight);
      return `${x}%,${y}`;
    })
    .join(" ");

  return (
    <div className="w-full space-y-2">
      <div 
        className="relative w-full border border-border-subtle bg-black rounded-lg p-2 overflow-visible"
        style={{ height: `${height}px` }}
      >
        {/* Subtle background horizontal axis baseline grids */}
        <div className="absolute inset-x-0 top-1/4 border-b border-border-subtle/30 pointer-events-none" />
        <div className="absolute inset-x-0 top-2/4 border-b border-border-subtle/30 pointer-events-none" />
        <div className="absolute inset-x-0 top-3/4 border-b border-border-subtle/30 pointer-events-none" />

        <svg className="w-full h-full overflow-visible">
          {/* Main Visual Trend Line Wave */}
          <polyline
            fill="none"
            className="stroke-accent-cyan"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points.replace(/%/g, "")} // Strip percentage markers for standard SVG viewBox mapping
            style={{ vectorEffect: "non-scaling-stroke" }}
            preserveAspectRatio="none"
          />
        </svg>
      </div>

      {/* Axis Simple Labels */}
      <div className="flex justify-between items-center px-1 text-[9px] font-mono text-zinc-500 uppercase">
        <span>{data[0].label}</span>
        <span>{data[data.length - 1].label}</span>
      </div>
    </div>
  );
}