import * as React from "react";
import { Card } from "./Card";

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string | number;
    type: "positive" | "negative" | "neutral";
  };
  icon?: React.ReactNode;
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ className = "", title, value, description, trend, icon, ...props }, ref) => {
    const trendColors = {
      positive: "text-success-emerald bg-success-emerald/10 border-success-emerald/20",
      negative: "text-danger-rose bg-danger-rose/10 border-danger-rose/20",
      neutral: "text-zinc-500 bg-zinc-800/50 border-zinc-700/30",
    };

    return (
      <Card ref={ref} className={`flex flex-col justify-between min-h-[110px] ${className}`} {...props}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-zinc-500 tracking-tight">{title}</span>
          {icon ? (
            <div className="text-zinc-500 shrink-0">{icon}</div>
          ) : (
            trend && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${trendColors[trend.type]}`}>
                {trend.type === "positive" && "+"}
                {trend.value}
              </span>
            )
          )}
        </div>
        <div className="mt-2 flex flex-col gap-0.5">
          <span className="text-2xl font-semibold tracking-tight text-white font-sans">{value}</span>
          {description && <span className="text-[11px] text-zinc-500 truncate">{description}</span>}
        </div>
      </Card>
    );
  }
);
MetricCard.displayName = "MetricCard";