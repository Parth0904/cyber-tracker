"use client";

import { AlertCircle, Sparkles } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

type InsightItem = {
  id?: string;
  text: string;
  impact: "high" | "medium" | "low";
  confidence: number;
};

type InsightsProps = {
  insights: InsightItem[];
};

export default function InsightsWidget({ insights }: InsightsProps) {
  // Map your dynamic status fields to strict Design System variants
  const getImpactVariant = (impact: "high" | "medium" | "low") => {
    if (impact === "high") return "danger";
    if (impact === "medium") return "warning";
    return "neutral";
  };

  return (
    <Panel>
      {/* Redesigned Structural Header to completely bypass React 19 form actions */}
      <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-5">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
            Security Intelligence Insights
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Automated intelligence recommendations and vulnerabilities.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-500 bg-black border border-border-subtle px-2 py-1 rounded-md">
          <Sparkles className="w-3 h-3 text-accent-cyan" />
          <span className="text-[10px] uppercase font-mono font-medium tracking-tight">Engine: Active</span>
        </div>
      </div>

      {insights.length === 0 ? (
        <EmptyState 
          title="Insufficient Operational Data" 
          description="Continue hunting logs to populate proactive intelligence trends and vulnerability findings."
        />
      ) : (
        <div className="space-y-3">
          {insights.map((item, idx) => (
            <div 
              key={item.id || `insight-key-${idx}`} 
              className="border border-border-subtle bg-card rounded-lg p-4 space-y-3 transition-all duration-200 hover:-translate-y-[1px] hover:border-accent-cyan"
            >
              <div className="flex items-center justify-between font-mono text-[10px]">
                <Badge variant={getImpactVariant(item.impact)}>
                  Impact: {item.impact}
                </Badge>
                <span className="text-zinc-500">
                  Confidence: {Math.round(item.confidence * 100)}%
                </span>
              </div>
              
              <div className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-accent-cyan shrink-0 mt-0.5" />
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}