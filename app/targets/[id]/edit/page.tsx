"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Play, Clock, History, Trash2, Edit2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

type SessionItem = {
  id: string;
  type: string;
  started_at: string;
  ended_at: string | null;
  duration: number;
};

type TargetDetailData = {
  target: {
    id: number;
    name: string;
    archived?: number;
  };
  statistics: {
    totalSessions: number;
    totalHours: number;
    totalHuntingHours: number;
    totalFindings: number;
    totalReports: number;
    totalValidReports: number;
    totalReward: number;
  };
  sessions: SessionItem[];
  findings: any[];
};

export default function TargetDetailsWorkspace() {
  const params = useParams();
  const router = useRouter();
  const targetId = params?.id as string;

  const [data, setData] = React.useState<TargetDetailData | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  // Renaming Modal State
  const [isRenameModalOpen, setIsRenameModalOpen] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState("");

  // Target Deletion Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // Completed Session Editing Modal State
  const [isEditSessionModalOpen, setIsEditSessionModalOpen] = React.useState(false);
  const [editingSession, setEditingSession] = React.useState<SessionItem | null>(null);
  const [editSessionStart, setEditSessionStart] = React.useState("");
  const [editSessionEnd, setEditSessionEnd] = React.useState("");
  const [editSessionLoading, setEditSessionLoading] = React.useState(false);

  // Active Session telemetry
  const [activeSession, setActiveSession] = React.useState<any>(null);
  const [elapsed, setElapsed] = React.useState("00:00:00");
  const [isStartingSession, setIsStartingSession] = React.useState(false);

  // Quick Finding logs tracking state for undo operation
  const [addedFindingIds, setAddedFindingIds] = React.useState<string[]>([]);
  const [isLoggingFinding, setIsLoggingFinding] = React.useState(false);

  // Helpers for datetime-local string mapping
  const toDatetimeLocal = (isoString: string | null) => {
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

  const fetchWorkspaceData = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/targets/${targetId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setRenameValue(json.target?.name || "");
      }
    } catch (err) {
      console.error("Workspace synchronization vector failure:", err);
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  const checkActiveSession = React.useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const json = await res.json();
        // Check if there is an active session for THIS target
        if (json?.active && String(json.active.targetId) === targetId) {
          setActiveSession(json.active);
        } else {
          setActiveSession(null);
        }
      }
    } catch (err) {
      console.error("Failed checking active sessions status:", err);
    }
  }, [targetId]);

  React.useEffect(() => {
    if (!targetId) return;
    fetchWorkspaceData();
    checkActiveSession();

    const interval = setInterval(() => {
      checkActiveSession();
    }, 5000);
    return () => clearInterval(interval);
  }, [targetId, fetchWorkspaceData, checkActiveSession]);

  // Live Timer Effect
  React.useEffect(() => {
    if (!activeSession) return;

    const start = new Date(activeSession.startedAt).getTime();
    const timer = setInterval(() => {
      const diff = Date.now() - start;
      const hrs = Math.floor(diff / 3600000).toString().padStart(2, "0");
      const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, "0");
      const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
      setElapsed(`${hrs}:${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession]);

  const handleStartSession = async () => {
    setIsStartingSession(true);
    try {
      const res = await fetch(`/api/targets/${targetId}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "Hunting", description: "" })
      });
      if (res.ok) {
        await checkActiveSession();
        await fetchWorkspaceData();
      }
    } catch (err) {
      console.error("Failed to start hunting session:", err);
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleEndSession = async (sessionId: number) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/terminate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setActiveSession(null);
        await fetchWorkspaceData();
        window.dispatchEvent(new Event("refresh-consistency-theme"));
      }
    } catch (err) {
      console.error("Failed to end session:", err);
    }
  };

  const handleAddQuickFinding = async (status: "Submitted" | "Valid") => {
    setIsLoggingFinding(true);
    try {
      const res = await fetch("/api/findings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_id: Number(targetId),
          title: status === "Valid" ? "Valid Report (Quick Logged)" : "Submitted Report (Quick Logged)",
          status: status
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.id) {
          setAddedFindingIds(prev => [...prev, json.id]);
        }
        await fetchWorkspaceData();
        window.dispatchEvent(new Event("refresh-consistency-theme"));
      }
    } catch (err) {
      console.error("Failed to add quick finding:", err);
    } finally {
      setIsLoggingFinding(false);
    }
  };

  const handleUndoQuickFinding = async () => {
    if (addedFindingIds.length === 0) return;
    const lastId = addedFindingIds[addedFindingIds.length - 1];
    try {
      const res = await fetch(`/api/findings/${lastId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setAddedFindingIds(prev => prev.slice(0, -1));
        await fetchWorkspaceData();
        window.dispatchEvent(new Event("refresh-consistency-theme"));
      }
    } catch (err) {
      console.error("Failed to undo finding:", err);
    }
  };

  const handleRenameTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameValue.trim()) return;

    try {
      const res = await fetch(`/api/targets/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue })
      });
      if (res.ok) {
        setIsRenameModalOpen(false);
        await fetchWorkspaceData();
      }
    } catch (err) {
      console.error("Failed to rename target:", err);
    }
  };

  const handleArchive = async () => {
    try {
      const res = await fetch(`/api/targets/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: 1, status: "Archived" })
      });
      if (res.ok) {
        router.push("/targets");
      }
    } catch (err) {
      console.error("Failed to archive target:", err);
    }
  };

  const handleRestore = async () => {
    try {
      const res = await fetch(`/api/targets/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: 0, status: "Active" })
      });
      if (res.ok) {
        await fetchWorkspaceData();
      }
    } catch (err) {
      console.error("Failed to restore target:", err);
    }
  };

  const handleDeleteSubmit = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/targets/${targetId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        router.push("/targets");
      }
    } catch (err) {
      console.error("Failed to delete target:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenEditSession = (session: SessionItem) => {
    setEditingSession(session);
    setEditSessionStart(toDatetimeLocal(session.started_at));
    setEditSessionEnd(toDatetimeLocal(session.ended_at));
    setIsEditSessionModalOpen(true);
  };

  const handleSaveSessionEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    setEditSessionLoading(true);

    try {
      const res = await fetch(`/api/sessions/${editingSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startedAt: toISOString(editSessionStart),
          endedAt: toISOString(editSessionEnd)
        })
      });
      if (res.ok) {
        setIsEditSessionModalOpen(false);
        await fetchWorkspaceData();
      }
    } catch (err) {
      console.error("Failed to edit session hours:", err);
    } finally {
      setEditSessionLoading(false);
    }
  };

  const isHuntingSession = (type: string) => {
    return ["hunting", "recon", "testing", "reporting"].includes(type.toLowerCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        // RETRIEVING_TARGET_OPERATIONAL_MATRIX...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState 
          title="Target Workspace Not Found" 
          description="The requested target parameter signature does not match any operational index mappings."
        />
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={() => router.push("/targets")} className="gap-2">
            Back to Mission Control
          </Button>
        </div>
      </div>
    );
  }

  const isArchived = data.target.archived === 1;

  // Filter session history logs to ONLY display Hunting sessions (excluding Learning)
  const huntingSessions = (data.sessions || []).filter((s) => isHuntingSession(s.type));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-zinc-200">
      
      {/* 1. TOP HERO REGISTRY BLOCK */}
      <div className="border border-border-subtle bg-card rounded-xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-500 font-mono text-xs uppercase">Target Registry</span>
              <span className="text-zinc-600 font-mono text-xs">//</span>
              <h1 className="text-lg font-bold text-white tracking-tight font-mono uppercase">{data.target.name}</h1>
              {isArchived && <Badge variant="neutral">Vaulted</Badge>}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">Time accumulator and permanent container.</p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
            <Button variant="secondary" className="h-8 text-[11px] gap-1 px-3" onClick={() => setIsRenameModalOpen(true)}>
              <Edit2 size={12} /> Rename
            </Button>
            {isArchived ? (
              <Button variant="secondary" className="h-8 text-[11px] gap-1 px-3 text-success-emerald border-success-emerald/20 bg-success-emerald/5 hover:bg-success-emerald/10" onClick={handleRestore}>
                Restore
              </Button>
            ) : (
              <Button variant="secondary" className="h-8 text-[11px] gap-1 px-3 text-warning-amber border-warning-amber/25 hover:bg-warning-amber/5" onClick={handleArchive}>
                Archive
              </Button>
            )}
            <Button variant="secondary" className="h-8 text-[11px] gap-1 px-3 text-danger-rose border-danger-rose/25 hover:bg-danger-rose/5" onClick={() => setIsDeleteModalOpen(true)}>
              <Trash2 size={12} /> Delete
            </Button>
          </div>
        </div>

        {/* ACTIVE RUNNING TIMER PANEL */}
        {activeSession ? (
          <div className="bg-zinc-950/80 border border-accent-cyan/30 p-4 rounded-lg flex items-center justify-between font-mono text-xs text-zinc-300">
            <div className="space-y-1">
              <span className="text-[9px] text-accent-cyan block uppercase tracking-wider animate-pulse">// ACTIVE TIME ACCUMULATOR</span>
              <span className="text-white font-bold">TYPE: {activeSession.type.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[9px] text-zinc-500 block uppercase">ELAPSED</span>
                <span className="text-md font-bold text-white tracking-widest">{elapsed}</span>
              </div>
              <Button 
                variant="primary" 
                onClick={() => handleEndSession(activeSession.id)}
                className="h-8 text-[9px] bg-danger-rose text-white border-danger-rose hover:opacity-90 font-bold uppercase tracking-wider"
              >
                End Session
              </Button>
            </div>
          </div>
        ) : (
          !isArchived && (
            <div className="flex flex-wrap gap-3 justify-start font-mono items-center">
              <Button 
                variant="primary" 
                className="h-9 px-4 text-xs font-bold bg-accent-cyan text-black border-accent-cyan hover:opacity-90 flex items-center gap-1.5 uppercase tracking-wider"
                onClick={handleStartSession}
                disabled={isStartingSession}
              >
                <Play size={11} fill="currentColor" /> Start Hunting Session
              </Button>

              <div className="h-6 w-px bg-zinc-800 mx-1 hidden sm:block" />

              <Button 
                variant="secondary" 
                className="h-9 px-3 text-xs font-bold text-warning-amber border-warning-amber/30 hover:bg-warning-amber/10 flex items-center gap-1.5 uppercase tracking-wider bg-black"
                onClick={() => handleAddQuickFinding("Submitted")}
                disabled={isLoggingFinding}
              >
                + Log Submitted
              </Button>

              <Button 
                variant="secondary" 
                className="h-9 px-3 text-xs font-bold text-success-emerald border-success-emerald/30 hover:bg-success-emerald/10 flex items-center gap-1.5 uppercase tracking-wider bg-black"
                onClick={() => handleAddQuickFinding("Valid")}
                disabled={isLoggingFinding}
              >
                + Log Valid
              </Button>

              {addedFindingIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleUndoQuickFinding}
                  className="text-zinc-500 hover:text-white transition-colors text-[10px] uppercase underline ml-1 cursor-pointer font-bold"
                >
                  Undo last ({addedFindingIds.length})
                </button>
              )}
            </div>
          )
        )}
      </div>

      {/* 2. THE QUAD-OVERVIEW METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="border border-border-subtle bg-black rounded-lg p-4">
          <span className="block text-[9px] text-zinc-500 uppercase font-medium">Hunting Time</span>
          <span className="block text-xl font-bold text-white mt-1">{data.statistics.totalHuntingHours?.toFixed(1) || "0.0"}h</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-4">
          <span className="block text-[9px] text-zinc-500 uppercase font-medium">Reports Submitted</span>
          <span className="block text-xl font-bold text-warning-amber mt-1">{data.statistics.totalReports ?? 0}</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-4">
          <span className="block text-[9px] text-zinc-500 uppercase font-medium">Valid Reports</span>
          <span className="block text-xl font-bold text-success-emerald mt-1">{data.statistics.totalValidReports ?? 0}</span>
        </div>
      </div>

      {/* 3. SESSION HISTORY TIMELINE */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-500 flex items-center gap-2 border-b border-border-subtle pb-2">
          <History className="w-3.5 h-3.5" /> Work Investment Timeline ({huntingSessions.length} Logs)
        </h2>

        {huntingSessions.length === 0 ? (
          <EmptyState 
            title="Timeline Empty" 
            description="No hunting sessions have been registered in this target container yet. Start your first session above to accumulate metrics."
          />
        ) : (
          <div className="space-y-3">
            {huntingSessions.map((session) => (
              <div key={session.id} className="border border-border-subtle bg-zinc-950 p-4 rounded-lg flex items-center justify-between gap-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="cyan">
                      {session.type.toUpperCase()}
                    </Badge>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(session.started_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })} 
                      {session.ended_at ? ` - ${new Date(session.ended_at).toLocaleString([], { timeStyle: "short" })}` : " (Active)"}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs font-bold text-white text-right">
                    {session.ended_at ? `${(session.duration / 60).toFixed(1)}h` : "Running"}
                  </span>
                  {session.ended_at && (
                    <button
                      onClick={() => handleOpenEditSession(session)}
                      className="p-1 border border-border-subtle text-zinc-500 hover:text-accent-cyan hover:border-accent-cyan/30 bg-zinc-900 rounded-md transition-colors"
                      title="Edit Session Times"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RENAME TARGET MODAL */}
      {isRenameModalOpen && (
        <Modal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} title="Rename Target Container">
          <form onSubmit={handleRenameTarget} className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="block text-[10px] text-zinc-500 uppercase">Target Name</label>
              <Input
                placeholder="Target Name"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsRenameModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="bg-accent-cyan text-black border-accent-cyan hover:opacity-90">
                Rename Target
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Target Container">
          <div className="space-y-4 font-mono text-xs text-zinc-300">
            <div className="flex items-start gap-2.5 bg-danger-rose/10 border border-danger-rose/25 p-3 rounded text-[11px] leading-relaxed text-danger-rose">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                Are you sure you want to delete the target container <strong className="text-white uppercase">{data.target.name}</strong>? 
                This will permanently delete all of its logged history, sessions, findings, and statistics. This action is irreversible.
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="primary" 
                isLoading={deleteLoading} 
                onClick={handleDeleteSubmit}
                className="bg-danger-rose text-white border-danger-rose hover:opacity-90 font-bold"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* EDIT COMPLETED SESSION MODAL */}
      {isEditSessionModalOpen && editingSession && (
        <Modal isOpen={isEditSessionModalOpen} onClose={() => setIsEditSessionModalOpen(false)} title="Edit Completed Session Logs">
          <form onSubmit={handleSaveSessionEdit} className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="block text-[10px] text-zinc-500 uppercase">Session Start Time</label>
              <input
                type="datetime-local"
                value={editSessionStart}
                onChange={(e) => setEditSessionStart(e.target.value)}
                className="w-full bg-black border border-border-subtle rounded-md text-xs px-3 py-2 text-zinc-300 focus:outline-none focus:border-accent-cyan font-mono h-9"
                required
              />
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setEditSessionStart(adjustDateTime(editSessionStart, -30))}
                  className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors cursor-pointer"
                >
                  -30m
                </button>
                <button
                  type="button"
                  onClick={() => setEditSessionStart(formatLocalDateTime(new Date()))}
                  className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors cursor-pointer"
                >
                  Current Time
                </button>
                <button
                  type="button"
                  onClick={() => setEditSessionStart(adjustDateTime(editSessionStart, 30))}
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
                value={editSessionEnd}
                onChange={(e) => setEditSessionEnd(e.target.value)}
                className="w-full bg-black border border-border-subtle rounded-md text-xs px-3 py-2 text-zinc-300 focus:outline-none focus:border-accent-cyan font-mono h-9"
                required
              />
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setEditSessionEnd(adjustDateTime(editSessionEnd, -30))}
                  className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors cursor-pointer"
                >
                  -30m
                </button>
                <button
                  type="button"
                  onClick={() => setEditSessionEnd(formatLocalDateTime(new Date()))}
                  className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors cursor-pointer"
                >
                  Current Time
                </button>
                <button
                  type="button"
                  onClick={() => setEditSessionEnd(adjustDateTime(editSessionEnd, 30))}
                  className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors cursor-pointer"
                >
                  +30m
                </button>
              </div>
            </div>
 
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsEditSessionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={editSessionLoading} className="bg-accent-cyan text-black border-accent-cyan hover:opacity-90">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}