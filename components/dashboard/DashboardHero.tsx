// app/components/dashboard/DashboardHero.tsx
"use client";

import { Shield } from "lucide-react";

type HeroProps = {
  score: number;
  updatedAt?: string;
};

export default function DashboardHero({ score, updatedAt }: HeroProps) {
  const formattedDate = new Date().toISOString().split('T')[0];

  return (
    <div className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all duration-200 hover:border-cyan-500/30">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center text-cyan-400">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-50 font-mono">
            CYBER_TRACKER // OPERATOR_DASHBOARD
          </h1>
          <p className="text-xs text-slate-400 font-mono tracking-wide mt-0.5">
            STATUS: ACTIVE • LAST_SYNC: {updatedAt ? new Date(updatedAt).toLocaleTimeString() : "JUST NOW"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 font-mono md:text-right border-t border-slate-800 md:border-t-0 pt-4 md:pt-0">
        <div>
          <span className="block text-xs uppercase tracking-widest text-slate-500 font-semibold">
            PERFORMANCE_INDEX
          </span>
          <span className="text-2xl font-bold text-cyan-400 tracking-tight">
            {score}<span className="text-xs text-slate-600">/100</span>
          </span>
        </div>
        <div className="border-l border-slate-800 pl-6">
          <span className="block text-xs uppercase tracking-widest text-slate-500 font-semibold">
            TIMELINE_LOG
          </span>
          <span className="text-sm font-bold text-slate-300">
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
}