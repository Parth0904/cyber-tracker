"use client";

import * as React from "react";
import { Moon, BookOpen, Clock } from "lucide-react";

type RecoveryData = { bedTime: string; reading: boolean };

type Props = {
  data: RecoveryData;
  onChange: (fields: Partial<RecoveryData>) => void;
};

export function RecoveryCard({ data, onChange }: Props) {
  // Quick-snap presets covering your typical 10 PM to 12 AM timeline windows
  const bedTimePresets = [
    { label: "10:00 P", value: "22:00" },
    { label: "10:30 P", value: "22:30" },
    { label: "11:00 P", value: "23:00" },
    { label: "11:30 P", value: "23:30" },
    { label: "12:00 A", value: "00:00" },
  ];

  return (
    <div className="border border-border-subtle bg-card rounded-lg p-4 space-y-4 font-mono text-xs text-zinc-200">
      <div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2">
        <Moon className="w-4 h-4 text-accent-cyan" />
        <span className="font-bold uppercase tracking-wider text-white">Recovery Calibration</span>
      </div>

      <div className="space-y-3">
        
        {/* BED TIME BLOCK WITH PRESET ACCELERATORS */}
        <div className="space-y-2">
          <label className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
            <Clock size={11} className="text-zinc-600" /> Target Bed Time
          </label>
          
          {/* Native flexible input node */}
          <input 
            type="time"
            value={data.bedTime || ""}
            onChange={(e) => onChange({ bedTime: e.target.value })}
            className="w-full bg-black border border-border-subtle rounded p-2 text-zinc-200 focus:outline-none focus:border-accent-cyan font-mono text-xs"
          />

          {/* Micro preset chip array matrix */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {bedTimePresets.map((preset) => {
              const isSelected = data.bedTime === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => onChange({ bedTime: preset.value })}
                  className={`text-[9px] px-1.5 py-0.5 rounded border transition-all font-mono tracking-tighter
                    ${isSelected 
                      ? "bg-accent-cyan/10 border-accent-cyan text-accent-cyan font-bold" 
                      : "bg-black/40 border-border-subtle/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                    }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

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