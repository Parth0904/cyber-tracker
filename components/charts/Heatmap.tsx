"use client";

import * as React from "react";

type HeatmapNode = {
  date: string;
  count: number;
};

type HeatmapProps = {
  nodes: HeatmapNode[]; // Expects a matrix series (e.g., trailing 52 weeks or 30 days)
};

export default function Heatmap({ nodes }: HeatmapProps) {
  const getNodeColor = (count: number) => {
    if (count === 0) return "bg-zinc-900 border-zinc-950";
    if (count <= 2) return "bg-success-emerald/30 border-success-emerald/10";
    if (count <= 4) return "bg-success-emerald/60 border-success-emerald/20";
    return "bg-success-emerald text-black border-success-emerald/40";
  };

  return (
    <div className="w-full border border-border-subtle bg-black rounded-lg p-3 overflow-x-auto scrollbar-none">
      <div className="grid grid-flow-col grid-rows-7 gap-1 min-w-max">
        {nodes.map((node, idx) => (
          <div
            key={idx}
            className={`h-2.5 w-2.5 rounded-[1px] border transition-all hover:scale-115 hover:z-10 cursor-crosshair group relative ${getNodeColor(node.count)}`}
          >
            {/* Native CSS Floating Micro Bubble Tooltip Context */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 bg-zinc-950 border border-border-subtle text-[9px] font-mono font-medium text-zinc-200 px-1.5 py-0.5 rounded shadow-xl whitespace-nowrap pointer-events-none">
              {node.date} : {node.count} actions
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}