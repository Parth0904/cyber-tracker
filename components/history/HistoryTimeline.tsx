"use client";

import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Calendar, Brain, Shield, Info, Activity } from "lucide-react";

type TimelineItem = {
  id: string;
  date: string;
  completion: number;
  productivityScore: number;
  performance: string;
  habits: {
    sleepHours: number;
    wakeTime: string;
    reading: boolean;
    workout: boolean;
    screenTimeMinutes: number | null;
  };
  learning: {
    learningBlocks: number;
    bugReportStudyBlocks: number;
  };
  hunting: {
    reconSessions: number;
    targetsTested: number;
    findings: number;
  };
  comparison: {
    productivity: string;
    completion: string;
    sleep: string;
    learningBlocks: string;
    reconSessions: string;
  };
  summary: string;
  notes?: string;
};

type TimelineProps = {
  items: TimelineItem[];
  onItemSelect: (item: TimelineItem) => void;
};

export default function HistoryTimeline({ items, onItemSelect }: TimelineProps) {
  const getPerformanceBadgeVariant = (perf: string) => {
    switch (perf) {
      case "Exceptional":
        return "success";
      case "Above Average":
        return "cyan";
      case "Average":
        return "neutral";
      case "Below Average":
        return "warning";
      case "Recovery Day":
        return "danger";
      default:
        return "neutral";
    }
  };

  const renderComparisonValue = (valueStr: string) => {
    const isNegative = valueStr.startsWith("-");
    const isZero = valueStr.startsWith("0") || valueStr.startsWith("+0") || valueStr.startsWith("-0");
    const colorClass = isZero ? "text-zinc-500" : isNegative ? "text-danger-rose" : "text-success-emerald";
    return <span className={`font-mono font-bold ${colorClass}`}>{valueStr}</span>;
  };

  if (items.length === 0) {
    return (
      <EmptyState
        title="Zero records found"
        description="No daily journal files match your search criteria or category filter."
      />
    );
  }

  return (
    <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-800">
      {items.map((item) => (
        <div key={item.id} className="relative pl-8 group">
          {/* Timeline Connector node */}
          <div className="absolute left-2.5 top-5 h-1.5 w-1.5 rounded-full bg-zinc-800 border border-zinc-700 transition-colors group-hover:bg-accent-cyan group-hover:border-accent-cyan" />
          
          <Card 
            className="hover:border-zinc-700 transition-all duration-200"
            onClick={() => onItemSelect(item)}
          >
            <div className="space-y-4">
              
              {/* Header: Date, Rating, Completion & Score */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-white font-mono font-bold">
                    <Calendar size={13} className="text-zinc-500" />
                    {item.date}
                  </div>
                  <Badge variant={getPerformanceBadgeVariant(item.performance)}>
                    {item.performance}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500">Completion:</span>
                    <span className="text-white font-bold">{item.completion}%</span>
                  </div>
                  <div className="h-3 w-[1px] bg-zinc-800" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500">Score:</span>
                    <span className="text-accent-cyan font-bold">{item.productivityScore}</span>
                  </div>
                </div>
              </div>

              {/* Summary / Notes Text Section */}
              {(item.notes || item.summary) && (
                <div className="bg-zinc-950/70 p-3 rounded border-l-2 border-accent-cyan text-xs leading-relaxed text-zinc-300 italic whitespace-pre-wrap">
                  {item.notes ? item.notes : item.summary}
                </div>
              )}

              {/* Detail Sections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                
                {/* Section 1: Lifestyle / Habits */}
                <div className="space-y-2 bg-zinc-950/30 p-3 rounded border border-zinc-900">
                  <h5 className="font-semibold text-white flex items-center gap-1.5 pb-1 border-b border-zinc-800/60 uppercase tracking-wider text-[10px] text-zinc-400">
                    <Activity size={12} className="text-zinc-500" /> Lifestyle
                  </h5>
                  <ul className="space-y-1.5 text-zinc-400">
                    <li className="flex justify-between">
                      <span>Sleep Hours:</span>
                      <span className="text-white font-medium">{item.habits.sleepHours.toFixed(1)}h</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Wake Time:</span>
                      <span className="text-white font-medium">{item.habits.wakeTime}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Workout:</span>
                      <span className="font-medium">{item.habits.workout ? "🟢 Yes" : "🔴 No"}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Reading:</span>
                      <span className="font-medium">{item.habits.reading ? "🟢 Yes" : "🔴 No"}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Screen Time:</span>
                      <span className="text-white font-medium">
                        {item.habits.screenTimeMinutes !== null 
                          ? `${Math.floor(item.habits.screenTimeMinutes / 60)}h ${item.habits.screenTimeMinutes % 60}m` 
                          : "N/A"}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Section 2: Learning */}
                <div className="space-y-2 bg-zinc-950/30 p-3 rounded border border-zinc-900">
                  <h5 className="font-semibold text-white flex items-center gap-1.5 pb-1 border-b border-zinc-800/60 uppercase tracking-wider text-[10px] text-zinc-400">
                    <Brain size={12} className="text-zinc-500" /> Learning
                  </h5>
                  <ul className="space-y-1.5 text-zinc-400">
                    <li className="flex justify-between">
                      <span>Learning Sessions:</span>
                      <span className="text-white font-medium font-mono">{item.learning.learningBlocks}</span>
                    </li>
                  </ul>
                </div>

                {/* Section 3: Hunting */}
                <div className="space-y-2 bg-zinc-950/30 p-3 rounded border border-zinc-900">
                  <h5 className="font-semibold text-white flex items-center gap-1.5 pb-1 border-b border-zinc-800/60 uppercase tracking-wider text-[10px] text-zinc-400">
                    <Shield size={12} className="text-zinc-500" /> Hunting
                  </h5>
                  <ul className="space-y-1.5 text-zinc-400">
                    <li className="flex justify-between">
                      <span>Systems Evaluated:</span>
                      <span className="text-white font-medium font-mono">{item.hunting.targetsTested}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Reports Logged:</span>
                      <span className="text-white font-medium font-mono">{item.hunting.findings}</span>
                    </li>
                  </ul>
                </div>

                {/* Section 4: Comparison vs Average */}
                <div className="space-y-2 bg-zinc-950/30 p-3 rounded border border-zinc-900">
                  <h5 className="font-semibold text-white flex items-center gap-1.5 pb-1 border-b border-zinc-800/60 uppercase tracking-wider text-[10px] text-zinc-400">
                    <Info size={12} className="text-zinc-500" /> Comparison
                  </h5>
                  <ul className="space-y-1.5 text-zinc-400">
                    <li className="flex justify-between">
                      <span>Productivity:</span>
                      {renderComparisonValue(item.comparison.productivity)}
                    </li>
                    <li className="flex justify-between">
                      <span>Completion:</span>
                      {renderComparisonValue(item.comparison.completion)}
                    </li>
                    <li className="flex justify-between">
                      <span>Sleep hours:</span>
                      {renderComparisonValue(item.comparison.sleep)}
                    </li>
                    <li className="flex justify-between">
                      <span>Session:</span>
                      {renderComparisonValue(item.comparison.learningBlocks)}
                    </li>
                  </ul>
                </div>

              </div>

            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}