"use client";

import * as React from "react";
import { Award, Target, Milestone, Trophy, ChevronRight, ShieldCheck } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Progress } from "@/components/ui/Progress";

type PerformanceIntervalGoal = {
  id: string;
  title: string;
  timeframe: "weekly" | "monthly" | "quarterly" | "yearly";
  targetValue: number;
  currentValue: number;
  unit: string;
};

type CareerMilestoneNode = {
  id: string;
  title: string;
  description: string;
  unlockedAt: string | null;
  metricProgress?: { current: number; target: number; unit: string };
};

type RoadmapTier = {
  currentStage: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  scoreToNextStage: number;
  progressPercent: number;
  nextStageRequirements: string[];
};

type CareerProgressPayload = {
  goals: PerformanceIntervalGoal[];
  milestones: CareerMilestoneNode[];
  roadmap: RoadmapTier;
};

export default function CareerProgressPage() {
  const [data, setData] = React.useState<CareerProgressPayload | null>(null);
  const [activeIntervalTab, setActiveIntervalTab] = React.useState<"weekly" | "monthly" | "quarterly" | "yearly">("weekly");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function synchronizeCareerMetrics() {
      try {
        const res = await fetch("/api/career");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Career metric stream link dropped:", err);
      } finally {
        setLoading(false);
      }
    }
    synchronizeCareerMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        // BUFFERING_LONG_TERM_CAREER_TELEMETRY...
      </div>
    );
  }

  const goals = data?.goals || [];
  const milestones = data?.milestones || [];
  const roadmap = data?.roadmap || { currentStage: "Beginner", scoreToNextStage: 100, progressPercent: 0, nextStageRequirements: [] };

  const filteredGoals = goals.filter(g => g.timeframe === activeIntervalTab);
  const unlockedMilestones = milestones.filter(m => m.unlockedAt !== null);
  const lockedMilestones = milestones.filter(m => m.unlockedAt === null);

  if (!data || milestones.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState 
          title="Career Metrics Matrix Uninitialized" 
          description="Your long-term tracking repository is empty. Complete verified program objectives to fire career milestones vectors."
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-zinc-200">
      
      {/* 1. STAGE & NEXT MILESTONE PROGRESS HERO */}
      <div className="border border-border-subtle bg-card rounded-lg p-5 font-mono text-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase block">Current Operations Status Tier</span>
            <div className="flex items-center gap-2">
              <Trophy className="text-warning-amber w-4 h-4" />
              <h2 className="text-sm font-bold text-white uppercase tracking-tight">
                {roadmap.currentStage} Operator Matrix
              </h2>
            </div>
          </div>
          <div className="text-left md:text-right">
            <span className="text-[9px] text-zinc-500 uppercase block">Velocity to Next Stage Boundary</span>
            <span className="text-zinc-300 font-bold">{roadmap.scoreToNextStage} Capability Credits Required</span>
          </div>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>Macro Tier Progression</span>
            <span>{roadmap.progressPercent}%</span>
          </div>
          <Progress value={roadmap.progressPercent} className="h-1.5 bg-black" />
        </div>

        {/* ROADMAP TARGET SEGMENT LOOP WITH UNIQUE PROPS KEY */}
        {roadmap.nextStageRequirements && roadmap.nextStageRequirements.length > 0 && (
          <div className="pt-2 border-t border-border-subtle/40">
            <span className="text-[9px] text-zinc-600 block mb-1.5 uppercase">// STAGE_EVOLUTION_CRITERIA</span>
            <div className="flex flex-wrap gap-2">
              {roadmap.nextStageRequirements.map((req, i) => (
                <div 
                  key={`stage-req-${i}`} 
                  className="bg-zinc-950 border border-border-subtle p-2 rounded text-[10px] text-zinc-400 font-sans flex items-center gap-1.5"
                >
                  <ChevronRight size={10} className="text-accent-cyan shrink-0" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. THREE COLUMN LAYOUT DUPLEX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* INTERIM INTERVAL TARGET MANDATES */}
        <div className="lg:col-span-1 space-y-4">
          <Panel>
            <div className="flex justify-between border-b border-border-subtle pb-2 mb-3 items-center">
              <h3 className="text-xs font-mono font-bold uppercase text-zinc-400 flex items-center gap-1.5">
                <Target size={13}/> Targets
              </h3>
              <div className="flex bg-black border border-border-subtle p-0.5 rounded text-[9px]">
                {(["weekly", "monthly", "quarterly", "yearly"] as const).map((tab) => (
                  <button 
                    key={`tab-btn-${tab}`} 
                    onClick={() => setActiveIntervalTab(tab)} 
                    className={`px-2 py-0.5 uppercase transition-all ${activeIntervalTab === tab ? "bg-white text-black font-bold" : "text-zinc-600 hover:text-zinc-400"}`}
                  >
                    {tab.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 font-mono text-xs">
              {filteredGoals.length === 0 ? (
                <div className="text-center font-mono text-[10px] text-zinc-600 py-6">// ZERO_INTERVAL_GOALS_DEPLOYED</div>
              ) : (
                filteredGoals.map((goal, index) => {
                  const safeProgress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
                  return (
                    <div key={goal.id || `goal-item-${index}`} className="space-y-1.5 bg-zinc-950/40 border border-border-subtle p-3 rounded">
                      <div className="flex justify-between text-[11px] items-start gap-2">
                        <span className="text-white font-medium font-sans leading-tight block">{goal.title}</span>
                        <span className="text-zinc-500 shrink-0 text-[10px]">{goal.currentValue}/{goal.targetValue} {goal.unit}</span>
                      </div>
                      <Progress value={Math.min(100, safeProgress)} className="h-1 bg-black" />
                    </div>
                  );
                })
              )}
            </div>
          </Panel>
        </div>

        {/* LONG TERM MILESTONES INDEX RECORD TRAIL */}
        <div className="lg:col-span-2 space-y-4">
          <Panel>
            <div className="mb-4">
              <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase flex items-center gap-1.5">
                <Milestone size={13}/> Career Milestones Index Ledger ({milestones.length})
              </h3>
            </div>
            
            <div className="space-y-3 font-mono text-xs">
              
              {/* UNLOCKED SYSTEM EXPERIENCES */}
              {unlockedMilestones.map((m, index) => (
                <div key={m.id || `unlocked-${index}`} className="border border-success-emerald/20 bg-zinc-950 p-3.5 rounded-md flex justify-between items-center gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-white font-bold text-xs truncate flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-success-emerald shrink-0" /> {m.title}
                    </h4>
                    <p className="text-zinc-400 font-sans text-[11px] leading-normal">{m.description}</p>
                  </div>
                  <Badge variant="success" className="shrink-0 uppercase text-[9px]">UNLOCKED // {m.unlockedAt}</Badge>
                </div>
              ))}

              {/* LOCKED ADVANCEMENTS CHALLENGES */}
              {lockedMilestones.map((m, index) => (
                <div key={m.id || `locked-${index}`} className="border border-border-subtle bg-black p-3.5 rounded-md space-y-3 opacity-60">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-zinc-400 font-semibold text-xs truncate">{m.title}</h4>
                      <p className="text-zinc-500 font-sans text-[11px] leading-normal">{m.description}</p>
                    </div>
                    <span className="text-[9px] text-zinc-600 font-bold uppercase shrink-0 pt-0.5">// LOCKED</span>
                  </div>

                  {m.metricProgress && (
                    <div className="space-y-1 pt-1 border-t border-border-subtle/30">
                      <div className="flex justify-between text-[9px] text-zinc-600">
                        <span>Requirements Target</span>
                        <span>{m.metricProgress.current} / {m.metricProgress.target} {m.metricProgress.unit.toUpperCase()}</span>
                      </div>
                      <Progress 
                        value={Math.min(100, (m.metricProgress.current / m.metricProgress.target) * 100)} 
                        className="h-1 bg-zinc-950" 
                      />
                    </div>
                  )}
                </div>
              ))}

            </div>
          </Panel>
        </div>

      </div>
    </div>
  );
}