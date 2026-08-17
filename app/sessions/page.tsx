"use client";

import * as React from "react";
import { Play, Search, History, Square, Clock, Target, BookOpen } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

// ── Types ─────────────────────────────────────────────────────────────────────
type SessionLog = {
  id: string;
  targetId?: string;
  targetName?: string;
  type?: string;
  topicId?: string;
  topicName?: string;
  start: string;
  end: string | null;
  durationHours: number;
  status: "Running" | "Completed";
  module: "Hunting" | "Learning";
};

type HuntingStats = {
  todayTotal: number;
  weekTotal: number;
  totalHours: number;
  avgLengthHours: number;
};

type LearningStats = {
  todayTotal: number;
  weekTotal: number;
  totalSessions: number;
  totalHours: number;
  avgLengthHours: number;
  isStudying: boolean;
};

// ── Inline Modal ──────────────────────────────────────────────────────────────
function InlineModal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handler);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handler);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 flex flex-col w-full max-w-md rounded-xl border border-border-subtle bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white cursor-pointer px-1 font-mono text-xs">✕</button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SessionsPage() {
  const [mode, setMode] = React.useState<"Hunting" | "Learning">("Hunting");

  // Data
  const [huntingLogs, setHuntingLogs] = React.useState<SessionLog[]>([]);
  const [learningLogs, setLearningLogs] = React.useState<SessionLog[]>([]);
  const [huntingActive, setHuntingActive] = React.useState<any>(null);
  const [learningActive, setLearningActive] = React.useState<any>(null);
  const [huntingStats, setHuntingStats] = React.useState<HuntingStats>({ todayTotal: 0, weekTotal: 0, totalHours: 0, avgLengthHours: 0 });
  const [learningStats, setLearningStats] = React.useState<LearningStats>({ todayTotal: 0, weekTotal: 0, totalSessions: 0, totalHours: 0, avgLengthHours: 0, isStudying: false });

  const [targetsList, setTargetsList] = React.useState<{ id: string; name: string }[]>([]);
  const [topicsList, setTopicsList] = React.useState<{ id: string; name: string }[]>([]);
  const [selectedTarget, setSelectedTarget] = React.useState("");
  const [selectedTopic, setSelectedTopic] = React.useState("");

  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  // Edit modal
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editingSession, setEditingSession] = React.useState<SessionLog | null>(null);
  const [editStart, setEditStart] = React.useState("");
  const [editEnd, setEditEnd] = React.useState("");
  const [editLoading, setEditLoading] = React.useState(false);

  const toDatetimeLocal = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  const toISO = (local: string) => local ? new Date(local).toISOString() : "";

  const formatLocalDateTime = (date: Date) => {
    const pad = (num: number) => num.toString().padStart(2, "0");
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  };

  const adjustDateTime = (currentVal: string, minutes: number) => {
    if (!currentVal) return formatLocalDateTime(new Date());
    const d = new Date(currentVal);
    if (isNaN(d.getTime())) return formatLocalDateTime(new Date());
    d.setMinutes(d.getMinutes() + minutes);
    return formatLocalDateTime(d);
  };

  // ── Sync ──────────────────────────────────────────────────────────────────
  const syncAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [huntRes, learnRes, targetsRes, topicsRes] = await Promise.all([
        fetch("/api/sessions"),
        fetch("/api/learning/sessions"),
        fetch("/api/targets"),
        fetch("/api/learning/topics"),
      ]);

      if (huntRes.ok) {
        const d = await huntRes.json();
        const mapped: SessionLog[] = (d.sessions || []).map((s: any) => ({
          id: String(s.id),
          targetId: String(s.targetId),
          targetName: s.targetName,
          type: s.type,
          start: s.start,
          end: s.end,
          durationHours: s.durationHours,
          status: s.status,
          module: "Hunting" as const,
        }));
        setHuntingLogs(mapped);
        setHuntingActive(d.active?.module === "Hunting" ? d.active : null);
        if (d.stats) setHuntingStats(d.stats);
      }

      if (learnRes.ok) {
        const d = await learnRes.json();
        const mapped: SessionLog[] = (d.sessions || []).map((s: any) => ({
          id: String(s.id),
          topicId: String(s.topicId),
          topicName: s.topicName,
          start: s.start,
          end: s.end,
          durationHours: s.durationHours,
          status: s.status,
          module: "Learning" as const,
        }));
        setLearningLogs(mapped);
        setLearningActive(d.active || null);
        if (d.stats) setLearningStats(d.stats);
      }

      if (targetsRes.ok) {
        const td = await targetsRes.json();
        setTargetsList(td || []);
        if (td.length > 0 && !selectedTarget) setSelectedTarget(String(td[0].id));
      }

      if (topicsRes.ok) {
        const tp = await topicsRes.json();
        const simple = (tp || []).filter((t: any) => !t.archived).map((t: any) => ({
          id: String(t.id),
          name: t.name,
        }));
        setTopicsList(simple);
        if (simple.length > 0 && !selectedTopic) setSelectedTopic(String(simple[0].id));
      }
    } catch (err) {
      console.error("Session sync error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedTarget, selectedTopic]);

  React.useEffect(() => { syncAll(); }, [syncAll]);

  // ── Start session ─────────────────────────────────────────────────────────
  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "Hunting") {
      if (!selectedTarget) return;
      await fetch(`/api/targets/${selectedTarget}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "Hunting", description: "" }),
      });
    } else {
      if (!selectedTopic) return;
      await fetch(`/api/learning/${selectedTopic}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    }
    await syncAll();
    window.dispatchEvent(new Event("refresh-consistency-theme"));
  };

  // ── Terminate ─────────────────────────────────────────────────────────────
  const handleTerminate = async (log: SessionLog) => {
    const url =
      log.module === "Learning"
        ? `/api/learning/sessions/${log.id}/terminate`
        : `/api/sessions/${log.id}/terminate`;
    await fetch(url, { method: "PATCH" });
    await syncAll();
    window.dispatchEvent(new Event("refresh-consistency-theme"));
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit = (log: SessionLog) => {
    setEditingSession(log);
    setEditStart(toDatetimeLocal(log.start));
    setEditEnd(toDatetimeLocal(log.end));
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    setEditLoading(true);
    try {
      const url =
        editingSession.module === "Learning"
          ? `/api/learning/sessions/${editingSession.id}`
          : `/api/sessions/${editingSession.id}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startedAt: toISO(editStart), endedAt: toISO(editEnd) }),
      });
      if (res.ok) { 
        setIsEditOpen(false); 
        await syncAll(); 
        window.dispatchEvent(new Event("refresh-consistency-theme"));
      }
    } catch (err) {
      console.error("Edit error:", err);
    } finally {
      setEditLoading(false);
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const isHunting = mode === "Hunting";
  const activeSesion = isHunting ? huntingActive : learningActive;
  const isRunning = !!activeSesion;

  const visibleLogs = (isHunting ? huntingLogs : learningLogs).filter((log) => {
    const name = isHunting ? (log.targetName || "") : (log.topicName || "");
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const activeLogId = activeSesion?.id ? String(activeSesion.id) : null;

  // ── Stats card data ───────────────────────────────────────────────────────
  const statCards = isHunting
    ? [
        { label: "Hours Today", value: `${huntingStats.todayTotal?.toFixed(1) ?? "0.0"}h` },
        { label: "Hours This Week", value: `${huntingStats.weekTotal?.toFixed(1) ?? "0.0"}h` },
        { label: "Total Hunting Hours", value: `${huntingStats.totalHours?.toFixed(1) ?? "0.0"}h`, color: "text-accent-cyan" },
        { label: "Avg Session", value: `${huntingStats.avgLengthHours?.toFixed(1) ?? "0.0"}h` },
      ]
    : [
        { label: "Hours Today", value: `${learningStats.todayTotal?.toFixed(1) ?? "0.0"}h` },
        { label: "Hours This Week", value: `${learningStats.weekTotal?.toFixed(1) ?? "0.0"}h` },
        { label: "Total Hours", value: `${learningStats.totalHours?.toFixed(1) ?? "0.0"}h`, color: "text-success-emerald" },
        { label: "Avg Session", value: `${learningStats.avgLengthHours?.toFixed(1) ?? "0.0"}h` },
      ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        // BUFFERING_SESSION_TIMELINE...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-zinc-200">

      {/* CONTEXT-AWARE STATS HEADER */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {statCards.map((card) => (
          <div key={card.label} className="border border-border-subtle bg-black rounded-lg p-3.5 transition-all duration-300">
            <span className="block text-[9px] text-zinc-500 uppercase">{card.label}</span>
            <span className={`block text-lg font-bold mt-1 ${card.color ?? "text-white"}`}>{card.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* LEFT: START SESSION PANEL */}
        <div className="lg:col-span-1 space-y-4">
          <Panel>
            <div className="space-y-4">
              {/* Mode toggle */}
              <div className="border-b border-border-subtle pb-3">
                <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5 mb-3">
                  <Play size={12} className="text-accent-cyan" /> Initialize Session
                </h3>
                <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 rounded-lg border border-border-subtle">
                  <button
                    onClick={() => { setMode("Hunting"); setSearch(""); }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                      isHunting ? "bg-accent-cyan text-black" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Target size={10} /> Hunting
                  </button>
                  <button
                    onClick={() => { setMode("Learning"); setSearch(""); }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                      !isHunting ? "bg-success-emerald text-black" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <BookOpen size={10} /> Learning
                  </button>
                </div>
              </div>

              {/* Hunting form */}
              {isHunting && (
                <form onSubmit={handleStart} className="space-y-3">
                  {targetsList.length === 0 ? (
                    <p className="text-[11px] font-mono text-zinc-600">// NO_TARGETS_DEPLOYED</p>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase">Target</label>
                        <select
                          value={selectedTarget}
                          onChange={(e) => setSelectedTarget(e.target.value)}
                          className="w-full bg-black border border-border-subtle rounded-md text-xs px-2.5 py-2 text-zinc-300 focus:outline-none focus:border-accent-cyan font-mono"
                        >
                          {targetsList.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <Button type="submit" disabled={isRunning} variant="primary"
                        className="w-full h-9 bg-accent-cyan text-black border-accent-cyan hover:opacity-90 font-mono text-xs font-bold">
                        {isRunning ? "SESSION RUNNING" : "START HUNTING"}
                      </Button>
                    </>
                  )}
                </form>
              )}

              {/* Learning form */}
              {!isHunting && (
                <form onSubmit={handleStart} className="space-y-3">
                  {topicsList.length === 0 ? (
                    <p className="text-[11px] font-mono text-zinc-600">// NO_TOPICS_DEPLOYED</p>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase">Topic</label>
                        <select
                          value={selectedTopic}
                          onChange={(e) => setSelectedTopic(e.target.value)}
                          className="w-full bg-black border border-border-subtle rounded-md text-xs px-2.5 py-2 text-zinc-300 focus:outline-none focus:border-success-emerald font-mono"
                        >
                          {topicsList.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <Button type="submit" disabled={isRunning} variant="primary"
                        className="w-full h-9 bg-success-emerald text-black border-success-emerald hover:opacity-90 font-mono text-xs font-bold">
                        {isRunning ? "SESSION RUNNING" : "START LEARNING"}
                      </Button>
                    </>
                  )}
                </form>
              )}
            </div>
          </Panel>
        </div>

        {/* RIGHT: FILTERED SESSION LOG */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-black p-3 border border-border-subtle rounded-lg">
            <div className="w-full sm:w-64">
              <Input
                placeholder={isHunting ? "Search targets..." : "Search topics..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search size={13} />}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider shrink-0">
              {isHunting ? "// HUNTING_SESSIONS" : "// LEARNING_SESSIONS"}
            </span>
          </div>

          <Panel>
            <div className="mb-4">
              <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <History size={13} />
                {isHunting ? "Hunting Timeline" : "Learning Timeline"} ({visibleLogs.length})
              </h3>
            </div>

            {visibleLogs.length === 0 ? (
              <EmptyState
                title={isHunting ? "No Hunting Sessions" : "No Learning Sessions"}
                description={isHunting
                  ? "Select a target above and start hunting to record your first session."
                  : "Select a topic above and start a session to build your learning history."}
              />
            ) : (
              <div className="space-y-3">
                {visibleLogs.map((log) => {
                  const isActive = activeLogId === log.id;
                  const displayName = isHunting ? log.targetName : log.topicName;
                  return (
                    <div
                      key={log.id}
                      className={`border bg-black p-4 rounded-md flex flex-col sm:flex-row justify-between sm:items-center gap-3 font-mono text-xs transition-colors ${
                        isActive ? "border-accent-cyan/40" : "border-border-subtle"
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold truncate max-w-[150px] uppercase">{displayName}</span>
                          <span className="text-zinc-600">//</span>
                          <Badge variant={isHunting ? "cyan" : "success"}>
                            {isHunting ? (log.type || "HUNTING").toUpperCase() : "LEARNING"}
                          </Badge>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(log.start).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                            {log.end ? ` — ${new Date(log.end).toLocaleString([], { timeStyle: "short" })}` : " (Active)"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        {isActive && (
                          <button
                            onClick={() => handleTerminate(log)}
                            className="flex items-center gap-1 text-[10px] bg-red-950/20 text-red-500 border border-red-900/30 px-2 py-1 rounded hover:bg-red-900/30 font-bold transition-all cursor-pointer"
                          >
                            <Square size={10} fill="currentColor" /> TERMINATE
                          </button>
                        )}
                        <span className="text-sm font-bold text-white">
                          {log.end ? `${log.durationHours?.toFixed(1)}h` : "Running"}
                        </span>
                        {log.end && (
                          <button
                            onClick={() => openEdit(log)}
                            className="p-1 border border-border-subtle text-zinc-500 hover:text-accent-cyan hover:border-accent-cyan/30 bg-zinc-900 rounded-md transition-colors cursor-pointer"
                            title="Edit Session Times"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* EDIT SESSION MODAL */}
      <InlineModal isOpen={isEditOpen && !!editingSession} onClose={() => setIsEditOpen(false)} title="Edit Session Times">
        <form onSubmit={handleSaveEdit} className="space-y-4 font-mono text-xs">
          <div className="space-y-1.5">
            <label className="block text-[10px] text-zinc-500 uppercase">Start Time</label>
            <input type="datetime-local" value={editStart} onChange={(e) => setEditStart(e.target.value)}
              className={`w-full bg-black border border-border-subtle rounded-md text-xs px-3 py-2 text-zinc-300 focus:outline-none font-mono h-9 ${
                editingSession?.module === "Learning" ? "focus:border-success-emerald" : "focus:border-accent-cyan"
              }`} required />
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setEditStart(adjustDateTime(editStart, -30))}
                className={`px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer ${
                  editingSession?.module === "Learning" ? "hover:border-success-emerald/40 hover:text-success-emerald" : "hover:border-accent-cyan/40 hover:text-accent-cyan"
                }`}
              >
                -30m
              </button>
              <button
                type="button"
                onClick={() => setEditStart(formatLocalDateTime(new Date()))}
                className={`px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer ${
                  editingSession?.module === "Learning" ? "hover:border-success-emerald/40 hover:text-success-emerald" : "hover:border-accent-cyan/40 hover:text-accent-cyan"
                }`}
              >
                Current Time
              </button>
              <button
                type="button"
                onClick={() => setEditStart(adjustDateTime(editStart, 30))}
                className={`px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer ${
                  editingSession?.module === "Learning" ? "hover:border-success-emerald/40 hover:text-success-emerald" : "hover:border-accent-cyan/40 hover:text-accent-cyan"
                }`}
              >
                +30m
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] text-zinc-500 uppercase">End Time</label>
            <input type="datetime-local" value={editEnd} onChange={(e) => setEditEnd(e.target.value)}
              className={`w-full bg-black border border-border-subtle rounded-md text-xs px-3 py-2 text-zinc-300 focus:outline-none font-mono h-9 ${
                editingSession?.module === "Learning" ? "focus:border-success-emerald" : "focus:border-accent-cyan"
              }`} required />
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setEditEnd(adjustDateTime(editEnd, -30))}
                className={`px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer ${
                  editingSession?.module === "Learning" ? "hover:border-success-emerald/40 hover:text-success-emerald" : "hover:border-accent-cyan/40 hover:text-accent-cyan"
                }`}
              >
                -30m
              </button>
              <button
                type="button"
                onClick={() => setEditEnd(formatLocalDateTime(new Date()))}
                className={`px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer ${
                  editingSession?.module === "Learning" ? "hover:border-success-emerald/40 hover:text-success-emerald" : "hover:border-accent-cyan/40 hover:text-accent-cyan"
                }`}
              >
                Current Time
              </button>
              <button
                type="button"
                onClick={() => setEditEnd(adjustDateTime(editEnd, 30))}
                className={`px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer ${
                  editingSession?.module === "Learning" ? "hover:border-success-emerald/40 hover:text-success-emerald" : "hover:border-accent-cyan/40 hover:text-accent-cyan"
                }`}
              >
                +30m
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={editLoading}
              className={`border hover:opacity-90 font-bold text-black ${
                editingSession?.module === "Learning" ? "bg-success-emerald border-success-emerald" : "bg-accent-cyan border-accent-cyan"
              }`}>Save Changes</Button>
          </div>
        </form>
      </InlineModal>

    </div>
  );
}