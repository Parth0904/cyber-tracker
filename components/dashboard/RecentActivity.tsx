"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

type ActivityItem = {
  id: string;
  timestamp: string;
  title: string;
  category: "habit" | "target" | "system";
  meta?: string;
};

type RecentActivityProps = {
  activities: ActivityItem[];
};

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getCategoryVariant = (category: string) => {
    if (category === "target") return "cyan";
    if (category === "habit") return "success";
    return "neutral";
  };

  return (
    <Panel>
      <div className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
          Recent Activity Log
        </h3>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Real-time operational auditing trail.
        </p>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          title="No recent operations"
          description="Your stream is empty. Complete daily logs or hunt targets to populate activity logs."
        />
      ) : (
        <div className="divide-y divide-border-subtle">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between py-2.5 base-text transition-colors hover:bg-card/30"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="text-zinc-600 shrink-0">
                  <Clock size={13} />
                </div>
                <div className="truncate">
                  <p className="text-xs font-medium text-zinc-200 truncate">
                    {activity.title}
                  </p>
                  {activity.meta && (
                    <p className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">
                      {activity.meta}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-4">
                <span className="text-[10px] font-mono text-zinc-600">
                  {activity.timestamp}
                </span>
                <Badge variant={getCategoryVariant(activity.category)}>
                  {activity.category}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}