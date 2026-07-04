"use client";

import * as React from "react";
import { Heart, Activity, Flame } from "lucide-react";

type HealthData = { sleep: number; workout: boolean; steps: number };

type Props = {
  data: HealthData;
  onChange: (fields: Partial<HealthData>) => void;
};

export function HealthCard({ data, onChange }: Props) {
  return (
    <div className="border border-border-subtle bg-card rounded-lg p-4 space-y-4 font-mono text-xs text-zinc-200">
      <div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2">
        <Heart className="w-4 h-4 text-danger-rose" />
        <span className="font-bold uppercase tracking-wider text-white">Health System Metrics</span>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-zinc-500 uppercase">Sleep Duration</span>
            <span className="text-white font-bold">{data.sleep || 0} hrs</span>
          </div>
          <input 
            type="range" min="0" max="16" step="0.5"
            value={data.sleep || 0}
            onChange={(e) => onChange({ sleep: parseFloat(e.target.value) })}
            className="w-full accent-accent-cyan bg-zinc-900 h-1 rounded-lg cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between bg-black/40 border border-border-subtle/40 p-2 rounded">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Flame size={13} />
            <span className="text-[11px] uppercase">Daily Workout Complete</span>
          </div>
          <input 
            type="checkbox"
            checked={data.workout || false}
            onChange={(e) => onChange({ workout: e.target.checked })}
            className="w-4 h-4 bg-zinc-950 border-border-subtle rounded text-accent-cyan focus:ring-0 focus:ring-offset-0"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-zinc-500 uppercase flex items-center gap-1"><Activity size={12}/> Daily Steps Count</label>
          <input 
            type="number" min="0" step="500" placeholder="e.g., 8500"
            value={data.steps || ""}
            onChange={(e) => onChange({ steps: parseInt(e.target.value) || 0 })}
            className="w-full bg-black border border-border-subtle rounded p-2 text-zinc-200 focus:outline-none focus:border-accent-cyan font-mono"
          />
        </div>
      </div>
    </div>
  );
}