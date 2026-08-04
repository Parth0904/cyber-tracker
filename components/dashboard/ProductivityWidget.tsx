// app/components/dashboard/ProductivityWidget.tsx
"use client";

import {Panel} from "@/components/ui/Panel";

type Contributor = {
  name: string;
  weight: number;
  value: number | string | boolean;
};

type ProductivityProps = {
  score: number;
  level: string;
  reason: string;
  contributors: Contributor[];
};

export default function ProductivityWidget({ score, level, reason, contributors }: ProductivityProps) {
  return (
    <Panel title="Today's Productivity Index">
      <div className="space-y-6">
        {/* Core Header Sizing Matrix */}
        <div className="flex items-start justify-between bg-slate-950 border border-slate-800 p-4 rounded-2xl">
          <div>
            <span className="block text-xs font-mono tracking-widest text-slate-500 uppercase">SYSTEM_BRACKET</span>
            <div className="text-2xl font-bold text-slate-50 tracking-tight mt-1">{level}</div>
          </div>
          <div className="text-right">
            <span className="block text-xs font-mono tracking-widest text-slate-500 uppercase">CALCULATED_SCORE</span>
            <div className="text-3xl font-mono font-black text-cyan-400 mt-0.5">{score}</div>
          </div>
        </div>

        {/* Descriptive Recommendation Text Block */}
        {reason && (
          <div className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 border border-slate-800/60 p-3.5 rounded-2xl font-sans">
            <span className="text-xs font-mono font-semibold text-cyan-500 block mb-1">// INTEL_SUMMARY</span>
            {reason}
          </div>
        )}

        {/* High Density Metric Contributor Stack */}
        {contributors && contributors.length > 0 && (
          <div className="space-y-2.5">
            <span className="block text-xs font-mono tracking-widest text-slate-500 uppercase font-semibold">Performance Components</span>
            <div className="grid gap-2 font-mono">
              {contributors.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs border border-slate-800 bg-slate-950 px-4 py-2.5 rounded-xl">
                  <span className="text-slate-400">{c.name}</span>
                  <span className="text-slate-200 font-semibold">
                    {typeof c.value === "boolean" ? (c.value ? "true" : "false") : c.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}