"use client";

import * as React from "react";
import { Play, Search, History, Square } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

type SessionLog = {
  id: string;
  targetId: string;
  targetName: string;
  type: "Recon" | "Testing" | "Reporting" | "Learning" | "Automation";
  description: string;
  start: string;
  end: string;
  ended_at?: string | null;
  durationHours: number;
  status: "Completed" | "Aborted";
};

export default function SessionsPage() {
  const [logs, setLogs] = React.useState<SessionLog[]>([]);
  const [stats, setStats] = React.useState({ todayTotal: 0, weekTotal: 0, streakDays: 0, avgLengthHours: 0, commonType: "N/A" });
  const [targetsList, setTargetsList] = React.useState<{ id: string; name: string }[]>([]);

  const [selectedTarget, setSelectedTarget] = React.useState("");
  const [sessionType, setSessionType] = React.useState("Testing");
  const [description, setDescription] = React.useState("");

  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("All");
  const [loading, setLoading] = React.useState(true);
  const [activeSession, setActiveSession] =
    React.useState<any>(null);

  React.useEffect(() => {
    async function syncSessionTelemetry() {
      try {
        const [sessionsRes, targetsRes] = await Promise.all([
          fetch("/api/sessions"),
          fetch("/api/targets")
        ]);

        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          setActiveSession(data.active);

          const mappedSessions = (data.sessions || []).map((log: any) => ({
            ...log,
            isActive: data.active?.id === Number(log.id),
            status: data.active?.id === Number(log.id) ? "Running" : "Completed",
          }));

          setLogs(mappedSessions);
          if (data.stats) setStats(data.stats);
        }

        if (targetsRes.ok) {
          const targetsData = await targetsRes.json();
          setTargetsList(targetsData || []);
          if (targetsData.length > 0) setSelectedTarget(targetsData[0].id);
        }
      } catch (err) {
        console.error("Telemetry channel link error:", err);
      } finally {
        setLoading(false);
      }
    }
    syncSessionTelemetry();
  }, []);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarget) return;

    await fetch(`/api/targets/${selectedTarget}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: sessionType, description })
    });

    window.location.reload();
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/terminate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) window.location.reload();
    } catch (err) {
      console.error("Termination fault:", err);
    }
  };

  const getCategoryVariant = (type: string) => {
    switch (type) {
      case "Recon": return "cyan";
      case "Testing": return "danger";
      case "Reporting": return "warning";
      case "Learning": return "success";
      default: return "neutral";
    }
  };

  const filteredLogs = (Array.isArray(logs) ? logs : []).filter(log => {
    const matchesSearch = log.targetName?.toLowerCase().includes(search.toLowerCase()) ||
      log.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "All" || log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100 font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        // BUFFERING_SESSIONS_METRIC_FABRICS...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-zinc-200">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 font-mono">
        <div className="border border-border-subtle bg-black rounded-lg p-3.5">
          <span className="block text-[9px] text-zinc-500 uppercase">Hours Today</span>
          <span className="block text-lg font-bold text-white mt-1">{stats.todayTotal?.toFixed(1) ?? "0.0"}h</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3.5">
          <span className="block text-[9px] text-zinc-500 uppercase">Hours This Week</span>
          <span className="block text-lg font-bold text-white mt-1">{stats.weekTotal?.toFixed(1) ?? "0.0"}h</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3.5">
          <span className="block text-[9px] text-zinc-500 uppercase">Hunting Streak</span>
          <span className="block text-lg font-bold text-accent-cyan mt-1">{stats.streakDays ?? 0} Days</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3.5">
          <span className="block text-[9px] text-zinc-500 uppercase">Avg Session</span>
          <span className="block text-lg font-bold text-white mt-1">{stats.avgLengthHours?.toFixed(1) ?? "0.0"}h</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3.5 col-span-2 lg:col-span-1">
          <span className="block text-[9px] text-zinc-500 uppercase">Primary Vector</span>
          <span className="block text-xs font-bold text-zinc-300 mt-2 truncate uppercase">{stats.commonType ?? "N/A"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1 space-y-4">
          <Panel>
            <form onSubmit={handleStartSession} className="space-y-4">
              <div className="border-b border-border-subtle pb-2">
                <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                  <Play size={12} className="text-accent-cyan" /> Initialize Session Engine
                </h3>
              </div>

              {targetsList.length === 0 ? (
                <p className="text-[11px] font-mono text-zinc-600">// DEPLOY_TARGET_BEFORE_TIMING</p>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase">Target Context Node</label>
                    <select
                      value={selectedTarget}
                      onChange={(e) => setSelectedTarget(e.target.value)}
                      className="w-full bg-black border border-border-subtle rounded-md text-xs px-2.5 py-2 text-zinc-300 focus:outline-none focus:border-accent-cyan font-mono"
                    >
                      {targetsList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase">Engagement Vector Type</label>
                    <select
                      value={sessionType}
                      onChange={(e) => setSessionType(e.target.value)}
                      className="w-full bg-black border border-border-subtle rounded-md text-xs px-2.5 py-2 text-zinc-300 focus:outline-none focus:border-accent-cyan font-mono"
                    >
                      <option value="Recon">RECON // EXPLORATORY</option>
                      <option value="Testing">TESTING // ACTIVE FUZZING</option>
                      <option value="Reporting">REPORTING // DISCLOSURE</option>
                      <option value="Learning">LEARNING // RESEARCH</option>
                      <option value="Automation">AUTOMATION // SCRIPTING</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase">Task Directive / Log Statement</label>
                    <textarea
                      placeholder="e.g., Auditing race conditions on checkout handlers..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full h-20 bg-black border border-border-subtle rounded-md p-2 text-xs text-zinc-300 focus:outline-none focus:border-accent-cyan resize-none leading-relaxed font-sans"
                    />
                  </div>

                  <Button type="submit" disabled={!!activeSession} variant="primary" className="w-full h-9 bg-accent-cyan text-black border-accent-cyan hover:opacity-90 font-mono text-xs font-bold">
                    {activeSession
                      ? "SESSION ALREADY RUNNING"
                      : "LAUNCH ACTIVE MONITOR"}
                  </Button>
                </>
              )}
            </form>
          </Panel>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-black p-3 border border-border-subtle rounded-lg">
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search historic sessions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search size={13} />}
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full sm:w-auto bg-zinc-950 border border-border-subtle rounded-md text-xs px-2.5 py-1.5 text-zinc-400 font-mono focus:outline-none focus:border-accent-cyan"
            >
              <option value="All">TYPE: ALL</option>
              <option value="Recon">RECON</option>
              <option value="Testing">TESTING</option>
              <option value="Reporting">REPORTING</option>
              <option value="Learning">LEARNING</option>
            </select>
          </div>

          <Panel>
            <div className="mb-4">
              <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <History size={13} /> Trailing Operation Logs ({filteredLogs.length})
              </h3>
            </div>

            {filteredLogs.length === 0 ? (
              <EmptyState
                title="No Session Logs Indexed"
                description="Your operational timeline is clear. Launch a session to map real-time metrics data vectors."
              />
            ) : (
              <div className="space-y-3">
                {filteredLogs.map(log => (
                  <div key={log.id} className="border border-border-subtle bg-black p-4 rounded-md flex flex-col sm:flex-row justify-between sm:items-center gap-3 font-mono text-xs">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold truncate max-w-37.5">{log.targetName}</span>
                        <span className="text-zinc-600">//</span>
                        <Badge variant={getCategoryVariant(log.type)}>{log.type}</Badge>
                        <span className="text-[10px] text-zinc-500">{log.start} - {log.end}</span>
                      </div>
                      {log.description && (
                        <p className="font-sans text-zinc-400 text-xs leading-relaxed max-w-xl">{log.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 self-end sm:self-auto flex items-center gap-3">
                      {log.isActive && (
                        <button
                          onClick={() => handleTerminateSession(log.id)}
                          className="flex items-center gap-1 text-[10px] bg-red-950/20 text-red-500 border border-red-900/30 px-2 py-1 rounded hover:bg-red-900/30 font-bold transition-all"
                        >
                          <Square size={10} fill="currentColor" /> TERMINATE
                        </button>
                      )}
                      <span className="text-sm font-bold text-white tracking-tight w-12 text-right">
                        {log.durationHours?.toFixed(1) ?? "0.0"}h
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}