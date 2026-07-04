// app/components/dashboard/QuickActions.tsx
"use client";

import { Play, Target, Bug } from "lucide-react";
import {Panel} from "@/components/ui/Panel";
import { Button } from "../ui";

type QuickActionsProps = {
  onActivity: () => Promise<void>;
};

export default function QuickActions({ onActivity }: QuickActionsProps) {
  const handleAction = async (actionType: string) => {
    // Keeps your existing api business logic fully intact
    await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: actionType }),
    });
    await onActivity();
  };

  return (
    <Panel title="Command Controls" className="h-full flex flex-col justify-between">
      <div className="space-y-3 my-auto">
        <Button variant="primary" onClick={() => handleAction("session_start")} className="w-full justify-start gap-3">
          <Play className="w-4 h-4 text-cyan-500 fill-cyan-500" />
          <span>Initialize Hunting Session</span>
        </Button>

        <Button variant="secondary" onClick={() => handleAction("target_check")} className="w-full justify-start gap-3">
          <Target className="w-4 h-4 text-slate-400" />
          <span>Audit Active Scope Baseline</span>
        </Button>

        <Button variant="secondary" onClick={() => handleAction("finding_log")} className="w-full justify-start gap-3">
          <Bug className="w-4 h-4 text-slate-400" />
          <span>Record New Vulnerability Target</span>
        </Button>
      </div>
    </Panel>
  );
}