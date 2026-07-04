"use client";

import * as React from "react";

type BarDataPoint = {
  label: string;
  value: number;
};

type BarChartProps = {
  data: BarDataPoint[];
  height?: number;
};

export default function BarChart({ data, height = 160 }: BarChartProps) {
  if (!data || data.length === 0) return null;

  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const baseMax = max === 0 ? 1 : max;

  return (
    <div className="w-full space-y-2">
      <div 
        className="flex items-end justify-between gap-2 w-full border border-border-subtle bg-black rounded-lg p-3 pt-6"
        style={{ height: `${height}px` }}
      >
        {data.map((item, idx) => {
          const percentage = (item.value / baseMax) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
              {/* Tooltip on Hover */}
              <span className="absolute -translate-y-8 bg-zinc-900 border border-border-subtle px-1.5 py-0.5 rounded text-[9px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {item.value}
              </span>
              
              {/* Vertical Metric Bar */}
              <div 
                className="w-full max-w-[12px] bg-accent-cyan rounded-t-sm transition-all duration-150 group-hover:opacity-80"
                style={{ height: `${percentage}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Extreme End Labels */}
      <div className="flex justify-between items-center px-1 text-[9px] font-mono text-zinc-500 uppercase">
        <span>{data[0].label}</span>
        <span>{data[data.length - 1].label}</span>
      </div>
    </div>
  );
}