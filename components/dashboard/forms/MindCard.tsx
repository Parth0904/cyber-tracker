"use client";

import * as React from "react";
import { BrainCircuit } from "lucide-react";

type MindData = { focusFeeling: number };

type Props = {
  data: MindData;
  onChange: (fields: Partial<MindData>) => void;
};

export function MindCard({ data, onChange }: Props) {
  const focusLevels = [
    { value: 1, label: "DISTRACTED" },
    { value: 2, label: "FOCUSED" },
    { value: 3, label: "DEEP" },
    { value: 4, label: "FLOW STATE" }
  ];

  return (
    <div className="border border-border-subtle bg-card rounded-lg p-4 space-y-4 font-mono text-xs text-zinc-200">
      <div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2">
        <BrainCircuit className="w-4 h-4 text-warning-amber" />
        <span className="font-bold uppercase tracking-wider text-white">Cognitive Focus Matrix</span>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] text-zinc-500 uppercase block">Focus Architecture Assessment</span>
        <div className="flex flex-col gap-1.5">
          {focusLevels.map((lvl) => (
            <button
              key={lvl.value}
              type="button"
              onClick={() => onChange({ focusFeeling: lvl.value })}
              className={`w-full text-left p-2 rounded border font-mono text-[11px] transition-all
                ${data.focusFeeling === lvl.value 
                  ? "bg-accent-cyan/10 border-accent-cyan text-white font-bold" 
                  : "bg-black/20 border-border-subtle/60 text-zinc-400 hover:border-zinc-700"
                }`}
            >
              [{lvl.value}] {lvl.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}