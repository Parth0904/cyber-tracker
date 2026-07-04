"use client";

import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type TimelineItem = {
  id: string;
  date: string;
  time: string;
  title: string;
  description: string;
  type: "target" | "habit" | "system";
  meta?: string;
};

type TimelineProps = {
  items: TimelineItem[];
  onItemSelect: (item: TimelineItem) => void;
};

export default function HistoryTimeline({ items, onItemSelect }: TimelineProps) {
  const getBadgeVariant = (type: string) => {
    if (type === "target") return "cyan";
    if (type === "habit") return "success";
    return "neutral";
  };

  if (items.length === 0) {
    return (
      <EmptyState
        title="Zero records found"
        description="No historical operational data points match your current filtering configuration."
      />
    );
  }

  return (
    <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-border-subtle">
      {items.map((item) => (
        <div key={item.id} className="relative pl-8 group">
          {/* Node Dot Timeline Indicator */}
          <div className="absolute left-2.5 top-3.5 h-1.5 w-1.5 rounded-full bg-zinc-800 border border-zinc-700 transition-colors group-hover:bg-accent-cyan group-hover:border-accent-cyan" />
          
          <Card 
            className="cursor-pointer"
            onClick={() => onItemSelect(item)}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-500">{item.date} @ {item.time}</span>
                  <Badge variant={getBadgeVariant(item.type)}>{item.type}</Badge>
                </div>
                <h4 className="text-xs font-semibold text-white tracking-tight">{item.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">{item.description}</p>
              </div>

              {item.meta && (
                <div className="text-[10px] font-mono text-zinc-600 self-start sm:self-auto bg-black px-1.5 py-0.5 rounded border border-border-subtle/50">
                  {item.meta}
                </div>
              )}
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}