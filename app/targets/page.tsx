"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Target, Archive, Shield, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";

type TargetData = {
  id: string;
  name: string;
  archived?: number;
  stats?: {
    totalSessions: number;
    totalHours: number;
    totalHuntingHours: number;
    totalLearningHours: number;
    totalFindings: number;
    totalReports: number;
    totalValidReports: number;
    totalReward: number;
  };
};

export default function TargetsPage() {
  const router = useRouter();
  const [targets, setTargets] = React.useState<TargetData[]>([]);
  const [search, setSearch] = React.useState("");

  const loadPrograms = async () => {
    try {
      const response = await fetch("/api/targets");
      if (response.ok) {
        const data = await response.json();
        setTargets(data || []);
      }
    } catch (err) {
      console.error("Failed to load targets matrix:", err);
    }
  };

  React.useEffect(() => {
    loadPrograms();
  }, []);

  const filteredTargets = (targets || []).filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase())
  );

  const activeTargets = filteredTargets.filter((t) => t.archived !== 1);
  const archivedTargets = filteredTargets.filter((t) => t.archived === 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 text-zinc-200">
      {/* HEADER CONTROLS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-mono flex items-center gap-2">
            <Target className="w-4 h-4 text-accent-cyan" /> Target Mission Control
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Your permanent work history containers. Click any target to manage its investment timeline.
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-1.5 self-start md:self-auto h-9 text-xs bg-accent-cyan text-black border-accent-cyan hover:opacity-90"
          onClick={() => router.push("/targets/new")}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Track New Target</span>
        </Button>
      </div>

      {/* FILTERS PANEL TRACK */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-black p-3 border border-border-subtle rounded-lg">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search targets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      {/* CORE CARDS STREAM GRID AREA */}
      {targets.length === 0 ? (
        <EmptyState
          title="No Active Targets Deployed"
          description="Your security operational matrix is empty. Initialize your workspace by setting up your first target program."
        />
      ) : (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-500 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-accent-cyan" /> Active Containers ({activeTargets.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTargets.map((target) => (
                <div
                  key={target.id}
                  onClick={() => router.push(`/targets/${target.id}/edit`)}
                  className="group bg-card border border-border-subtle rounded-lg p-5 space-y-4 hover:border-accent-cyan transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-semibold text-white group-hover:text-accent-cyan transition-colors truncate max-w-xs font-mono uppercase">
                        {target.name}
                      </h3>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 py-4 border-y border-border-subtle/50 my-4 text-center font-mono">
                      <div>
                        <span className="block text-[8px] text-zinc-600 uppercase">Hunting</span>
                        <span className="text-xs font-semibold text-zinc-300">
                          {target.stats?.totalHuntingHours?.toFixed(1) ?? "0.0"}h
                        </span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-zinc-600 uppercase">Reports</span>
                        <span className="text-xs font-semibold text-warning-amber">
                          {target.stats?.totalReports ?? 0}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-zinc-600 uppercase">Valid</span>
                        <span className="text-xs font-semibold text-success-emerald">
                          {target.stats?.totalValidReports ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-accent-cyan" />
                      {target.stats?.totalSessions ?? 0} Sessions logged
                    </span>
                    <span className="group-hover:text-accent-cyan transition-colors">
                      Open Timeline &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {archivedTargets.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border-subtle">
              <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-600 flex items-center gap-2">
                <Archive className="w-3.5 h-3.5" /> Vaulted / Archived Targets ({archivedTargets.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
                {archivedTargets.map((target) => (
                  <div
                    key={target.id}
                    onClick={() => router.push(`/targets/${target.id}/edit`)}
                    className="group bg-card border border-border-subtle rounded-lg p-5 space-y-4 hover:border-accent-cyan transition-all duration-200 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-semibold text-zinc-400 group-hover:text-accent-cyan transition-colors truncate max-w-xs font-mono uppercase">
                          {target.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}