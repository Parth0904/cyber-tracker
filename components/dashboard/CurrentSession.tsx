// app/components/dashboard/CurrentSession.tsx
"use client";

import { Terminal } from "lucide-react";
import {Panel} from "@/components/ui/Panel";
import {Button} from "@/components/ui/Button";

type CurrentSessionProps = {
  active: boolean;
  type: string;
  target: string;
  duration: string;
};

export default function CurrentSession({ active, type, target, duration }: CurrentSessionProps) {
  return (
    <Panel title="Live Operations Session">
      <div className="flex flex-col justify-between h-full space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 p-4 rounded-2xl">
            <div className="relative flex h-2 w-2">
              {active && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${active ? "bg-emerald-500" : "bg-slate-600"}`}></span>
            </div>
            <div className="font-mono text-xs">
              <div className="text-slate-300 font-semibold uppercase tracking-wide">{type}</div>
              <div className="text-slate-500 mt-0.5">TARGET: {target}</div>
            </div>
          </div>

          <div className="text-center py-3 bg-slate-950/40 border border-slate-800/50 rounded-2xl">
            <span className="block text-xs uppercase tracking-widest text-slate-500 font-mono font-semibold mb-1">ELAPSED_LOG_TIME</span>
            <span className="text-4xl font-light tracking-tight text-slate-100 font-mono">{duration}</span>
          </div>
        </div>

        {active ? (
          <Button variant="danger" className="w-full">
            Terminate Session Log
          </Button>
        ) : (
          <Button variant="secondary" className="w-full justify-center gap-2">
            <Terminal className="w-4 h-4" />
            <span>Initialize Shell Session</span>
          </Button>
        )}
      </div>
    </Panel>
  );
}