"use client";

import { Target, ArrowUpRight } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type ActiveTargetProps = {
  name: string;
  status: string;
  hours: number;
  findings: number;
  reports: number;
};

export default function ActiveTarget({ name, status, hours, findings, reports }: ActiveTargetProps) {
  const isInactive = status.toLowerCase() === "inactive" || name.includes("No Target");

  return (
    <Panel>
      {/* Header Segment */}
      <div className="flex items-start justify-between pb-4 border-b border-border-subtle mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold tracking-tight text-white">{name}</h4>
            <Badge variant={isInactive ? "neutral" : "cyan"}>
              {status}
            </Badge>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono tracking-wide mt-0.5">
            WORKSPACE // BUG_BOUNTY_TARGET
          </p>
        </div>
        <div className="h-7 w-7 border border-border-subtle bg-black flex items-center justify-center text-accent-cyan rounded-md">
          <Target className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="flex flex-col justify-between space-y-5">
        {/* Metric Tri-Grid Segment */}
        <div className="grid grid-cols-3 gap-4 py-1 font-mono">
          <div>
            <span className="block text-[10px] text-zinc-500 uppercase tracking-tight font-medium">Invested</span>
            <span className="text-sm font-semibold text-zinc-200 mt-0.5 block">{hours.toFixed(1)}h</span>
          </div>
          <div>
            <span className="block text-[10px] text-zinc-500 uppercase tracking-tight font-medium">Findings</span>
            <span className="text-sm font-semibold text-success-emerald mt-0.5 block">{findings}</span>
          </div>
          <div>
            <span className="block text-[10px] text-zinc-500 uppercase tracking-tight font-medium">Reports</span>
            <span className="text-sm font-semibold text-warning-amber mt-0.5 block">{reports}</span>
          </div>
        </div>

        {/* Action Trigger */}
        <Button 
          variant={isInactive ? "secondary" : "primary"} 
          disabled={isInactive}
          className="w-full gap-1.5"
          onClick={() => {
            window.location.href = "/targets";
          }}
        >
          <span>Open Hunting Workspace</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Panel>
  );
}