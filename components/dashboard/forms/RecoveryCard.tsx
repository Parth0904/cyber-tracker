"use client";

import * as React from "react";
import { BookOpen } from "lucide-react";

type RecoveryData = { reading: boolean };

type Props = {
  data: RecoveryData;
  onChange: (fields: Partial<RecoveryData>) => void;
};

export function RecoveryCard({ data, onChange }: Props) {
  return (
    <div className="border border-border-subtle bg-card rounded-lg p-4 space-y-4 font-mono text-xs text-zinc-200">
      <div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2">
        <BookOpen className="w-4 h-4 text-accent-cyan" />
        <span className="font-bold uppercase tracking-wider text-white">Daily Habit Calibration</span>
      </div>

      <div className="space-y-3">
        {/* READING TOGGLE WIDGET */}
        <div className="flex items-center justify-between bg-black/40 border border-border-subtle/40 p-2 rounded">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <BookOpen size={13} />
            <span className="text-[11px] uppercase">Reading Before Bed</span>
          </div>
          <input 
            type="checkbox"
            checked={data.reading || false}
            onChange={(e) => onChange({ reading: e.target.checked })}
            className="w-4 h-4 bg-zinc-950 border-border-subtle rounded text-accent-cyan focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}