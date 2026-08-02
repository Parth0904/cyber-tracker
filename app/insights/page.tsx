"use client";

import * as React from "react";
import { 
  Brain, Moon, BookOpen, Zap, Clock, Sun, Award, AlertCircle, 
  ChevronRight, Sparkles, HelpCircle, CheckCircle2, Shield
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

type InsightStatus = "success" | "insufficient_data";
type ConfidenceLevel = "High" | "Medium" | "Low";

type SleepData = {
  status: InsightStatus;
  confidence?: ConfidenceLevel;
  avgHunting7_8?: number;
  avgHuntingUnder6?: number;
  impact?: number;
};

type ReadingData = {
  status: InsightStatus;
  confidence?: ConfidenceLevel;
  reading?: { avgHunting: number; avgLearning: number; avgSessionLength: number };
  nonReading?: { avgHunting: number; avgLearning: number; avgSessionLength: number };
};

type WorkoutData = {
  status: InsightStatus;
  confidence?: ConfidenceLevel;
  workout?: { avgHunting: number; avgLearning: number; avgConsistency: number };
  noWorkout?: { avgHunting: number; avgLearning: number; avgConsistency: number };
};

type BedTimeData = {
  status: InsightStatus;
  confidence?: ConfidenceLevel;
  avgHuntingBefore11?: number;
  avgHunting11to12?: number;
  avgHuntingAfterMidnight?: number;
};

type WakeTimeData = {
  status: InsightStatus;
  confidence?: ConfidenceLevel;
  medianWakeTime?: string;
  earlyWake?: { avgHunting: number; avgLearning: number; avgConsistency: number };
  lateWake?: { avgHunting: number; avgLearning: number; avgConsistency: number };
};

type LearningTopicAttribution = {
  topicId: string;
  name: string;
  studyHours: number;
  attributedHuntingHours: number;
  attributedReports: number;
  attributedValidReports: number;
};

type LearningData = {
  status: InsightStatus;
  confidence?: ConfidenceLevel;
  topics?: LearningTopicAttribution[];
};

type InsightsPayload = {
  insights: {
    sleep: SleepData;
    reading: ReadingData;
    workout: WorkoutData;
    bedTime: BedTimeData;
    wakeTime: WakeTimeData;
    learning: LearningData;
  };
};

export default function InsightsPage() {
  const [data, setData] = React.useState<InsightsPayload | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchInsights = async () => {
    try {
      const res = await fetch("/api/insights");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed loading insights telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        // DEPLOYING_AI_MENTOR_ANALYTIC_ENGINES...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState 
          title="Insights Engine Offline" 
          description="Failed to compile intelligence matrices. Please ensure databases are initialized and active."
        />
      </div>
    );
  }

  const { sleep, reading, workout, bedTime, wakeTime, learning } = data.insights;

  const renderConfidenceBadge = (confidence?: ConfidenceLevel) => {
    if (!confidence) return null;
    let variant: "cyan" | "warning" | "neutral" = "neutral";
    if (confidence === "High") variant = "cyan";
    if (confidence === "Medium") variant = "warning";
    return (
      <Badge variant={variant} className="text-[9px] py-0.5 px-1.5 uppercase font-mono font-bold tracking-wider">
        CONFIDENCE: {confidence}
      </Badge>
    );
  };

  const renderInsufficientData = () => (
    <div className="flex items-start gap-2.5 bg-zinc-950 border border-border-subtle/50 p-4 rounded-lg text-zinc-500 font-mono text-[10px] leading-relaxed">
      <AlertCircle size={14} className="shrink-0 mt-0.5 text-zinc-600" />
      <span>More data is needed before this relationship can be determined.</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 text-zinc-200">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-mono flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent-cyan animate-pulse" /> Strategic Intelligence Engine
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">// WHY DID SOMETHING HAPPEN? - Deep relational diagnostics between habits and output.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. SLEEP INSIGHT */}
        <Panel className="space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-3">
            <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
              <Moon className="w-4 h-4 text-accent-cyan" /> Sleep & Hunt Productivity
            </h3>
            {sleep.status === "success" && renderConfidenceBadge(sleep.confidence)}
          </div>
          
          {sleep.status === "insufficient_data" ? (
            renderInsufficientData()
          ) : (
            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950 p-3.5 rounded border border-border-subtle/50">
                  <span className="text-[9px] text-zinc-500 block uppercase">7-8 Hours Sleep</span>
                  <span className="text-white font-bold text-md mt-1 block">{sleep.avgHunting7_8?.toFixed(1)}h avg</span>
                </div>
                <div className="bg-zinc-950 p-3.5 rounded border border-border-subtle/50">
                  <span className="text-[9px] text-zinc-500 block uppercase">&lt;6 Hours Sleep</span>
                  <span className="text-zinc-400 font-bold text-md mt-1 block">{sleep.avgHuntingUnder6?.toFixed(1)}h avg</span>
                </div>
              </div>
              <div className="p-3 bg-accent-cyan/5 border border-accent-cyan/10 rounded text-[11px] text-zinc-300 leading-relaxed">
                Hunting output is <strong className="text-accent-cyan font-bold">{Math.abs(sleep.impact || 0).toFixed(1)}h {sleep.impact && sleep.impact >= 0 ? "higher" : "lower"}</strong> on days following optimal (7-8h) sleep cycles.
              </div>
            </div>
          )}
        </Panel>

        {/* 2. READING INSIGHT */}
        <Panel className="space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-3">
            <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-success-emerald" /> Reading & Daily Capacity
            </h3>
            {reading.status === "success" && renderConfidenceBadge(reading.confidence)}
          </div>

          {reading.status === "insufficient_data" ? (
            renderInsufficientData()
          ) : (
            <div className="space-y-3 font-mono text-[11px]">
              <div className="grid grid-cols-2 gap-4 border-b border-border-subtle/30 pb-3 text-center">
                <div>
                  <span className="text-success-emerald font-bold uppercase block text-[9px]">Reading Days</span>
                  <div className="mt-2 space-y-1 text-zinc-300">
                    <div className="flex justify-between"><span>Hunting:</span><span className="font-bold text-white">{reading.reading?.avgHunting.toFixed(1)}h</span></div>
                    <div className="flex justify-between"><span>Learning:</span><span className="font-bold text-white">{reading.reading?.avgLearning.toFixed(1)}h</span></div>
                    <div className="flex justify-between"><span>Session:</span><span className="font-bold text-white">{reading.reading?.avgSessionLength.toFixed(1)}h</span></div>
                  </div>
                </div>
                <div className="border-l border-border-subtle/30">
                  <span className="text-zinc-500 font-bold uppercase block text-[9px]">Non-Reading Days</span>
                  <div className="mt-2 space-y-1 text-zinc-400">
                    <div className="flex justify-between pl-4"><span>Hunting:</span><span>{reading.nonReading?.avgHunting.toFixed(1)}h</span></div>
                    <div className="flex justify-between pl-4"><span>Learning:</span><span>{reading.nonReading?.avgLearning.toFixed(1)}h</span></div>
                    <div className="flex justify-between pl-4"><span>Session:</span><span>{reading.nonReading?.avgSessionLength.toFixed(1)}h</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Panel>

        {/* 3. WORKOUT INSIGHT */}
        <Panel className="space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-3">
            <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
              <Zap className="w-4 h-4 text-warning-amber" /> Workout & Yield Synergy
            </h3>
            {workout.status === "success" && renderConfidenceBadge(workout.confidence)}
          </div>

          {workout.status === "insufficient_data" ? (
            renderInsufficientData()
          ) : (
            <div className="space-y-3 font-mono text-[11px]">
              <div className="grid grid-cols-2 gap-4 border-b border-border-subtle/30 pb-3 text-center">
                <div>
                  <span className="text-warning-amber font-bold uppercase block text-[9px]">Workout Days</span>
                  <div className="mt-2 space-y-1 text-zinc-300">
                    <div className="flex justify-between"><span>Hunting:</span><span className="font-bold text-white">{workout.workout?.avgHunting.toFixed(1)}h</span></div>
                    <div className="flex justify-between"><span>Learning:</span><span className="font-bold text-white">{workout.workout?.avgLearning.toFixed(1)}h</span></div>
                    <div className="flex justify-between"><span>Consistency:</span><span className="font-bold text-success-emerald">{workout.workout?.avgConsistency}%</span></div>
                  </div>
                </div>
                <div className="border-l border-border-subtle/30">
                  <span className="text-zinc-500 font-bold uppercase block text-[9px]">No Workout Days</span>
                  <div className="mt-2 space-y-1 text-zinc-400">
                    <div className="flex justify-between pl-4"><span>Hunting:</span><span>{workout.noWorkout?.avgHunting.toFixed(1)}h</span></div>
                    <div className="flex justify-between pl-4"><span>Learning:</span><span>{workout.noWorkout?.avgLearning.toFixed(1)}h</span></div>
                    <div className="flex justify-between pl-4"><span>Consistency:</span><span>{workout.noWorkout?.avgConsistency}%</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Panel>

        {/* 4. BED TIME INSIGHT */}
        <Panel className="space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-3">
            <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-cyan" /> Bedtime Performance Windows
            </h3>
            {bedTime.status === "success" && renderConfidenceBadge(bedTime.confidence)}
          </div>

          {bedTime.status === "insufficient_data" ? (
            renderInsufficientData()
          ) : (
            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-zinc-950 p-2.5 rounded border border-border-subtle/40">
                  <span className="text-zinc-400">Before 11:00 PM</span>
                  <span className="text-white font-bold">{bedTime.avgHuntingBefore11?.toFixed(1)}h average hunt</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-950 p-2.5 rounded border border-border-subtle/40">
                  <span className="text-zinc-400">11:00 PM – Midnight</span>
                  <span className="text-white font-bold">{bedTime.avgHunting11to12?.toFixed(1)}h average hunt</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-950 p-2.5 rounded border border-border-subtle/40">
                  <span className="text-zinc-400">After Midnight</span>
                  <span className="text-warning-amber font-bold">{bedTime.avgHuntingAfterMidnight?.toFixed(1)}h average hunt</span>
                </div>
              </div>
            </div>
          )}
        </Panel>

        {/* 5. WAKE TIME INSIGHT */}
        <Panel className="space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-3">
            <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
              <Sun className="w-4 h-4 text-warning-amber" /> Wake Time & Baseline Efficiency
            </h3>
            {wakeTime.status === "success" && renderConfidenceBadge(wakeTime.confidence)}
          </div>

          {wakeTime.status === "insufficient_data" ? (
            renderInsufficientData()
          ) : (
            <div className="space-y-3 font-mono text-[11px]">
              <div className="text-[10px] text-zinc-500 mb-2">// Partitioned dynamically by median wake time: {wakeTime.medianWakeTime} AM</div>
              <div className="grid grid-cols-2 gap-4 border-b border-border-subtle/30 pb-3 text-center">
                <div>
                  <span className="text-warning-amber font-bold uppercase block text-[9px]">Early Wake days</span>
                  <div className="mt-2 space-y-1 text-zinc-300">
                    <div className="flex justify-between"><span>Hunting:</span><span className="font-bold text-white">{wakeTime.earlyWake?.avgHunting.toFixed(1)}h</span></div>
                    <div className="flex justify-between"><span>Learning:</span><span className="font-bold text-white">{wakeTime.earlyWake?.avgLearning.toFixed(1)}h</span></div>
                    <div className="flex justify-between"><span>Consistency:</span><span className="font-bold text-success-emerald">{wakeTime.earlyWake?.avgConsistency}%</span></div>
                  </div>
                </div>
                <div className="border-l border-border-subtle/30">
                  <span className="text-zinc-500 font-bold uppercase block text-[9px]">Late Wake days</span>
                  <div className="mt-2 space-y-1 text-zinc-400">
                    <div className="flex justify-between pl-4"><span>Hunting:</span><span>{wakeTime.lateWake?.avgHunting.toFixed(1)}h</span></div>
                    <div className="flex justify-between pl-4"><span>Learning:</span><span>{wakeTime.lateWake?.avgLearning.toFixed(1)}h</span></div>
                    <div className="flex justify-between pl-4"><span>Consistency:</span><span>{wakeTime.lateWake?.avgConsistency}%</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Panel>

        {/* 6. LEARNING INSIGHT */}
        <Panel className="space-y-4 md:col-span-2">
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-3">
            <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
              <Award className="w-4 h-4 text-success-emerald" /> Learning to Outcome Attribution
            </h3>
            {learning.status === "success" && renderConfidenceBadge(learning.confidence)}
          </div>

          {learning.status === "insufficient_data" ? (
            renderInsufficientData()
          ) : (
            <div className="space-y-3">
              <div className="text-[10px] text-zinc-500 font-mono mb-2">// Attributing hunting hours and findings submitted within 7 days of studying a topic.</div>
              <div className="border border-border-subtle rounded bg-black font-mono text-[11px] overflow-x-auto">
                <table className="w-full text-left min-w-[500px]">
                  <thead className="bg-zinc-950 border-b border-border-subtle text-zinc-500 text-[8px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Learning Topic</th>
                      <th className="py-2 px-3 text-right">Study Time</th>
                      <th className="py-2 px-3 text-right">Attributed Hunt</th>
                      <th className="py-2 px-3 text-right">Attributed Reports</th>
                      <th className="py-2 px-3 text-right">Valid Reports</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/50 text-zinc-300">
                    {learning.topics?.map(topic => (
                      <tr key={topic.topicId} className="hover:bg-zinc-950/60 transition-colors">
                        <td className="py-2.5 px-3 font-bold uppercase text-white">{topic.name}</td>
                        <td className="py-2.5 px-3 text-right text-success-emerald">{topic.studyHours.toFixed(1)}h</td>
                        <td className="py-2.5 px-3 text-right text-accent-cyan">{topic.attributedHuntingHours.toFixed(1)}h</td>
                        <td className="py-2.5 px-3 text-right text-warning-amber">{topic.attributedReports}</td>
                        <td className="py-2.5 px-3 text-right text-success-emerald font-bold">{topic.attributedValidReports}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Panel>

      </div>
    </div>
  );
}