"use client";

import * as React from "react";
import { StickyNote } from "lucide-react";

type JournalData = { notes: string };

type Props = {
  data: JournalData;
  onChange: (fields: Partial<JournalData>) => void;
};

export function JournalCard({ data, onChange }: Props) {
  return (
    <div className="border border-border-subtle bg-card rounded-lg p-4 space-y-3 font-mono text-xs text-zinc-200 h-full flex flex-col">
      <div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2 shrink-0">
        <StickyNote className="w-4 h-4 text-zinc-400" />
        <span className="font-bold uppercase tracking-wider text-white">Daily Operations Journal</span>
      </div>

      <div className="flex-1 flex flex-col min-h-[120px]">
        <textarea
          placeholder="Log situational events, diagnostic blockers, workflow modifications..."
          value={data.notes || ""}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="w-full flex-1 bg-black border border-border-subtle rounded p-2 text-xs font-sans text-zinc-300 focus:outline-none focus:border-accent-cyan resize-none leading-relaxed"
        />
      </div>
    </div>
  );
}