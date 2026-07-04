// app/components/dashboard/FocusWidget.tsx
"use client";

import { BrainCircuit } from "lucide-react";
import {Panel} from "@/components/ui/Panel";
import {Badge} from "@/components/ui/Badge";

type FocusProps = {
  habit: string;
  strength: string;
  recommendation: string;
  explanation: string;
  confidence: number;
};

export default function FocusWidget({ habit, strength, recommendation, explanation, confidence }: FocusProps) {
  return (
    <Panel title="Today's Core Optimization Focus">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-mono tracking-widest text-slate-500 uppercase">Target Habit Vector</span>
            <h4 className="text-lg font-bold text-slate-100 tracking-tight">{habit}</h4>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-cyan-400">
            <BrainCircuit className="w-4 h-4" />
          </div>
        </div>

        {/* Recommendation Layout Blocks */}
        <div className="border border-slate-800 bg-slate-950 rounded-2xl p-4 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2 text-xs">
            <span className="text-slate-500 uppercase tracking-wider">CONFIDENCE_RATING</span>
            <span className="text-emerald-400 font-bold">{Math.round(confidence * 100)}%</span>
          </div>
          <div className="space-y-1 font-sans">
            <span className="text-xs font-mono font-semibold text-amber-500 block uppercase tracking-wide">Actionable Guidance</span>
            <p className="text-sm text-slate-200 leading-relaxed">{recommendation}</p>
          </div>
        </div>

        {explanation && (
          <p className="text-xs text-slate-400 leading-relaxed italic font-sans pl-3 border-l border-slate-800">
            {explanation}
          </p>
        )}
      </div>
    </Panel>
  );
}