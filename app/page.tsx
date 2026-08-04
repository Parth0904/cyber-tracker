"use client";

import * as React from "react";
import { Terminal, Shield, Play, Square, Layers, AlertCircle, Clock } from "lucide-react";
import { DailyHabitsForm } from "@/components/dashboard/forms/DailyHabitsForm";
import { useConsistency } from "@/components/dashboard/ConsistencyTheme";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type DashboardData = {
  completion: {
    percent: number;
    completedCount: number;
    totalCount: number;
    missing: string[];
    entry: {
      bedTime: string;
      wakeTime: string;
      workout: boolean;
      reading: boolean;
      notes: string;
    };
  };
  activeSession: {
    active: boolean;
    id: number | null;
    targetId: string;
    targetName: string;
    type: string;
    description: string;
    startedAt: string;
    isAbandoned?: boolean;
    lastActiveAt?: string;
    module?: string;
  };
  consistency: {
    state: "green" | "amber" | "red";
    score: number;
  };
  targets: { id: string; name: string }[];
};

export default function DashboardConsoleHome() {
  const { refresh: refreshConsistency } = useConsistency();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [selectedTarget, setSelectedTarget] = React.useState("");
  const [isStartingSession, setIsStartingSession] = React.useState(false);
  const [elapsed, setElapsed] = React.useState("00:00:00");

  // Recovery Prompt State
  const [showRecoveryPrompt, setShowRecoveryPrompt] = React.useState(false);
  const [ignoredSessionId, setIgnoredSessionId] = React.useState<number | null>(null);

  // Recovery Edit State
  const [isRecoveryEditing, setIsRecoveryEditing] = React.useState(false);
  const [recoveryStart, setRecoveryStart] = React.useState("");
  const [recoveryEnd, setRecoveryEnd] = React.useState("");
  const [recoveryLoading, setRecoveryLoading] = React.useState(false);

  // Time conversion helpers
  const toDatetimeLocal = (isoString?: string | null) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const toISOString = (localString: string) => {
    if (!localString) return "";
    return new Date(localString).toISOString();
  };

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

  const syncDashboardData = React.useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = (await res.json()) as DashboardData;
        setData(json);
        if (json.targets.length > 0 && !selectedTarget) {
          setSelectedTarget(json.targets[0].id);
        }

        // Trigger safe termination / crash recovery prompt on app launch
        if (
          json.activeSession?.active &&
          json.activeSession?.isAbandoned &&
          json.activeSession.id !== ignoredSessionId
        ) {
          setShowRecoveryPrompt(true);
          setRecoveryStart(toDatetimeLocal(json.activeSession.startedAt));
          setRecoveryEnd(toDatetimeLocal(json.activeSession.lastActiveAt || new Date().toISOString()));
        } else {
          setShowRecoveryPrompt(false);
        }
      }
    } catch (err) {
      console.error("Dashboard synchronization fault:", err);
    } finally {
      setLoading(false);
    }
  }, [ignoredSessionId, selectedTarget]);

  React.useEffect(() => {
    syncDashboardData();

    const handleRefresh = () => {
      syncDashboardData();
    };
    window.addEventListener("refresh-dashboard-data", handleRefresh);
    return () => {
      window.removeEventListener("refresh-dashboard-data", handleRefresh);
    };
  }, [syncDashboardData]);

  React.useEffect(() => {
    if (!data?.activeSession?.active || !data.activeSession.startedAt) return;

    const start = new Date(data.activeSession.startedAt).getTime();
    const timer = setInterval(() => {
      const diff = Date.now() - start;
      const hrs = Math.floor(diff / 3600000).toString().padStart(2, "0");
      const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, "0");
      const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
      setElapsed(`${hrs}:${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [data?.activeSession]);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarget) return;

    setIsStartingSession(true);
    try {
      const res = await fetch(`/api/targets/${selectedTarget}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "Testing", description: "" }),
      });
      if (res.ok) {
        await syncDashboardData();
        refreshConsistency();
      }
    } catch (err) {
      console.error("Failed to start session:", err);
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleEndSession = async (sessionId: number) => {
    try {
      const url = data?.activeSession?.module === "Learning"
        ? `/api/learning/sessions/${sessionId}/terminate`
        : `/api/sessions/${sessionId}/terminate`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        await syncDashboardData();
        refreshConsistency();
      }
    } catch (err) {
      console.error("Failed to end session:", err);
    }
  };

  // Recovery Prompt actions
  const handleRecoveryContinue = async () => {
    if (!data?.activeSession?.id) return;
    try {
      const url = data.activeSession.module === "Learning"
        ? `/api/learning/sessions/${data.activeSession.id}`
        : `/api/sessions/${data.activeSession.id}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "continue" })
      });
      if (res.ok) {
        setShowRecoveryPrompt(false);
        setIsRecoveryEditing(false);
        await syncDashboardData();
      }
    } catch (err) {
      console.error("Failed to resume session:", err);
    }
  };

  const handleRecoveryEndLastActive = async () => {
    if (!data?.activeSession?.id) return;
    try {
      const url = data.activeSession.module === "Learning"
        ? `/api/learning/sessions/${data.activeSession.id}`
        : `/api/sessions/${data.activeSession.id}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end_last_active" })
      });
      if (res.ok) {
        setShowRecoveryPrompt(false);
        setIsRecoveryEditing(false);
        await syncDashboardData();
        refreshConsistency();
      }
    } catch (err) {
      console.error("Failed to end session at last active:", err);
    }
  };

  const handleRecoveryEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.activeSession?.id) return;
    setRecoveryLoading(true);

    try {
      const url = data.activeSession.module === "Learning"
        ? `/api/learning/sessions/${data.activeSession.id}`
        : `/api/sessions/${data.activeSession.id}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startedAt: toISOString(recoveryStart),
          endedAt: toISOString(recoveryEnd)
        })
      });
      if (res.ok) {
        setShowRecoveryPrompt(false);
        setIsRecoveryEditing(false);
        await syncDashboardData();
        refreshConsistency();
      }
    } catch (err) {
      console.error("Failed to submit custom session times:", err);
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleRecoveryIgnore = () => {
    if (data?.activeSession?.id) {
      setIgnoredSessionId(data.activeSession.id);
    }
    setShowRecoveryPrompt(false);
    setIsRecoveryEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        // ESTABLISHING_SECURE_HUD_TUNNELS...
      </div>
    );
  }

  const completed = data?.completion.completedCount || 0;
  const total = data?.completion.totalCount || 5;
  const percentage = data?.completion.percent || 0;

  const totalBlocks = 12;
  const filledBlocks = Math.round((percentage / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  const blockString = "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10 text-zinc-200">

      {/* BRAND HEADER HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xs font-semibold tracking-tight text-white uppercase font-mono flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent-cyan" /> Operator Center Console // HUD Dashboard
          </h1>
          <p className="text-[9px] text-zinc-500 mt-0.5 font-mono">
            DUAL PIPELINE ENGINE // SYNCED OPERATIONAL STATEMENTS ACTIVE.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[9px] bg-black border border-border-subtle px-2.5 py-1 rounded-md text-zinc-400">
          <Shield size={11} className="text-accent-cyan animate-pulse" /> SYSTEM CORE SECURE
        </div>
      </div>

      {/* SECTION 1: TODAY'S PROGRESS */}
      <div className="space-y-3">
        <h3 className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider">// SECTION 01 // TODAY'S PROGRESS</h3>
        <div className="border border-border-subtle bg-black/30 p-6 rounded-xl space-y-3">
          <div className="space-y-2">
            <div className="text-4xl tracking-widest text-accent-cyan font-mono leading-none drop-shadow-[0_0_8px_rgba(var(--accent-color),0.35)]">
              {blockString}
            </div>
            <div className="flex items-center justify-between text-xs font-mono font-bold pt-1">
              <span className="text-white text-xs">{completed} / {total} Habits Complete</span>
              <span className="text-accent-cyan text-xs">{percentage}% Complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: DAILY INPUTS */}
      <div className="space-y-3">
        <h3 className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider">// SECTION 02 // DAILY METRIC INPUTS</h3>
        <DailyHabitsForm />
      </div>

      {/* SECTION 3: CURRENT SESSION */}
      <div className="space-y-3">
        <h3 className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider">// SECTION 03 // CURRENT SESSION</h3>
        <div className="border border-border-subtle bg-black/30 p-5 rounded-xl">
          {data?.activeSession?.active ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
              <div className="space-y-1">
                <div className="text-[9px] text-zinc-500 uppercase">// ENGAGED_TARGET_NODE</div>
                <div className="text-white text-xs font-bold flex items-center gap-2 uppercase">
                  <Layers size={14} className="text-accent-cyan" />
                  {data.activeSession.targetName}
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  TYPE // <span className="text-white">{data.activeSession.type.toUpperCase()}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[9px] text-zinc-500 uppercase">ELAPSED_TIME</div>
                  <div className="text-lg font-bold text-white tracking-wider">{elapsed}</div>
                </div>
                <Button
                  variant="primary"
                  onClick={() => data.activeSession.id && handleEndSession(data.activeSession.id)}
                  className="h-9 px-4 bg-danger-rose text-white hover:opacity-90 border-danger-rose font-bold uppercase text-[9px] tracking-wider"
                >
                  <Square size={10} fill="currentColor" className="mr-1.5" /> End Session
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
              <div className="space-y-1">
                <div className="text-[9px] text-zinc-500 uppercase">// OPERATIONS_STATUS</div>
                <div className="text-zinc-400 text-xs">No Active Session</div>
              </div>
              {data && data.targets.length > 0 ? (
                <form onSubmit={handleStartSession} className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-end sm:items-center">
                  <select
                    value={selectedTarget}
                    onChange={(e) => setSelectedTarget(e.target.value)}
                    className="w-full sm:w-60 bg-black border border-border-subtle rounded-md text-xs px-2.5 py-2 text-zinc-300 focus:outline-none focus:border-accent-cyan font-mono"
                    required
                  >
                    {data.targets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isStartingSession}
                    className="w-full sm:w-auto h-9 px-4 bg-accent-cyan text-black hover:opacity-90 font-bold border-accent-cyan flex items-center gap-1.5 uppercase text-[9px] tracking-wider focus:ring-accent-cyan"
                  >
                    <Play size={10} fill="currentColor" /> Start Hunting
                  </Button>
                </form>
              ) : (
                <div className="text-[9px] text-zinc-500 font-bold">// NO ACTIVE TARGET NODES FOUND</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* UNFINISHED SESSION PROMPT MODAL */}
      {showRecoveryPrompt && data?.activeSession && (
        <Modal
          isOpen={showRecoveryPrompt}
          onClose={handleRecoveryIgnore}
          title="Unfinished Session Detected"
        >
          <div className="space-y-4 font-mono text-xs text-zinc-300">
            <div className="flex items-start gap-2.5 bg-warning-amber/10 border border-warning-amber/25 p-3 rounded text-[11px] leading-relaxed text-warning-amber">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                You have an unfinished session on target <strong className="text-white uppercase">{data.activeSession.targetName}</strong>.
                It appears to have been left running since it started on <strong className="text-white">{new Date(data.activeSession.startedAt).toLocaleString()}</strong>.
              </div>
            </div>

            {isRecoveryEditing ? (
              <form onSubmit={handleRecoveryEditSubmit} className="space-y-4 pt-2 border-t border-border-subtle">
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-zinc-500 uppercase">Session Start Time</label>
                  <input
                    type="datetime-local"
                    value={recoveryStart}
                    onChange={(e) => setRecoveryStart(e.target.value)}
                    className="w-full bg-black border border-border-subtle rounded-md text-xs px-3 py-2 text-zinc-300 focus:outline-none focus:border-accent-cyan font-mono h-9"
                    required
                  />
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setRecoveryStart(adjustDateTime(recoveryStart, -30))}
                      className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors cursor-pointer"
                    >
                      -30m
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecoveryStart(formatLocalDateTime(new Date()))}
                      className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors cursor-pointer"
                    >
                      Current Time
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecoveryStart(adjustDateTime(recoveryStart, 30))}
                      className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors cursor-pointer"
                    >
                      +30m
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-zinc-500 uppercase">Session End Time</label>
                  <input
                    type="datetime-local"
                    value={recoveryEnd}
                    onChange={(e) => setRecoveryEnd(e.target.value)}
                    className="w-full bg-black border border-border-subtle rounded-md text-xs px-3 py-2 text-zinc-300 focus:outline-none focus:border-accent-cyan font-mono h-9"
                    required
                  />
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setRecoveryEnd(adjustDateTime(recoveryEnd, -30))}
                      className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors cursor-pointer"
                    >
                      -30m
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecoveryEnd(formatLocalDateTime(new Date()))}
                      className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors cursor-pointer"
                    >
                      Current Time
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecoveryEnd(adjustDateTime(recoveryEnd, 30))}
                      className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors cursor-pointer"
                    >
                      +30m
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setIsRecoveryEditing(false)}>
                    Back
                  </Button>
                  <Button type="submit" variant="primary" isLoading={recoveryLoading} className="bg-accent-cyan text-black border-accent-cyan hover:opacity-90">
                    Save Completed Session
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 pt-2">
                <p className="text-[11px] text-zinc-500">How would you like to handle this session?</p>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleRecoveryContinue}
                    className="w-full bg-accent-cyan text-black border-accent-cyan hover:opacity-90 flex items-center justify-center gap-1.5 uppercase tracking-wider text-[10px] h-8"
                  >
                    Continue Session
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleRecoveryEndLastActive}
                    className="w-full text-zinc-300 border-zinc-700 hover:bg-zinc-900 flex items-center justify-center gap-1.5 uppercase tracking-wider text-[10px] h-8"
                  >
                    End at Last Active Time ({data.activeSession.lastActiveAt ? new Date(data.activeSession.lastActiveAt).toLocaleTimeString() : "N/A"})
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsRecoveryEditing(true)}
                    className="w-full text-zinc-300 border-zinc-700 hover:bg-zinc-900 flex items-center justify-center gap-1.5 uppercase tracking-wider text-[10px] h-8"
                  >
                    <Clock size={12} /> Edit Session Times
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleRecoveryIgnore}
                    className="w-full text-zinc-500 border-transparent hover:text-zinc-300 flex items-center justify-center gap-1.5 uppercase tracking-wider text-[10px] h-8"
                  >
                    Ignore
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

    </div>
  );
}