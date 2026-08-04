"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, History, Trash2, Edit2, AlertCircle, ArrowLeft, X, Archive, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";

// ── Types ─────────────────────────────────────────────────────────────────────
type SessionItem = {
  id: number;
  topic_id: number;
  started_at: string;
  ended_at: string | null;
  duration: number;
};

type TopicDetailData = {
  topic: {
    id: number;
    name: string;
    archived?: number;
    created_at: string;
  };
  stats: {
    totalHours: number;
    sessionsCount: number;
    lastStudiedAt: string | null;
  };
  sessions: SessionItem[];
};

// ── Inline Modal ──────────────────────────────────────────────────────────────
function InlineModal({
  isOpen, onClose, title, children,
}: {
  isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) { document.body.style.overflow = "hidden"; window.addEventListener("keydown", h); }
    return () => { document.body.style.overflow = "unset"; window.removeEventListener("keydown", h); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 flex flex-col w-full max-w-md rounded-xl border border-border-subtle bg-zinc-950 shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">{title}</h3>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white cursor-pointer rounded-md hover:bg-zinc-800">
            <X size={14} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">{children}</div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LearningTopicDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params?.id as string;

  const [data, setData] = React.useState<TopicDetailData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [isRenameOpen, setIsRenameOpen] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState("");

  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const [isEditSessionOpen, setIsEditSessionOpen] = React.useState(false);
  const [editingSession, setEditingSession] = React.useState<SessionItem | null>(null);
  const [editStart, setEditStart] = React.useState("");
  const [editEnd, setEditEnd] = React.useState("");
  const [editSessionLoading, setEditSessionLoading] = React.useState(false);

  // Active session telemetry
  const [activeSession, setActiveSession] = React.useState<any>(null);
  const [elapsed, setElapsed] = React.useState("00:00:00");
  const [isStartingSession, setIsStartingSession] = React.useState(false);

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

  const fetchData = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/learning/topics/${topicId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setRenameValue(json.topic?.name || "");
      }
    } catch (err) {
      console.error("Failed to fetch topic:", err);
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  const checkActiveSession = React.useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const json = await res.json();
        // Check if there is an active session for THIS topic
        if (json?.active && json.active.type === "Learning" && String(json.active.topicId) === topicId) {
          setActiveSession(json.active);
        } else {
          setActiveSession(null);
        }
      }
    } catch (err) {
      console.error("Failed checking active sessions status:", err);
    }
  }, [topicId]);

  React.useEffect(() => {
    if (!topicId) return;
    fetchData();
    checkActiveSession();

    const interval = setInterval(() => {
      checkActiveSession();
    }, 5000);
    return () => clearInterval(interval);
  }, [topicId, fetchData, checkActiveSession]);

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

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleStartSession = async () => {
    setIsStartingSession(true);
    try {
      const res = await fetch(`/api/learning/${topicId}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        await checkActiveSession();
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to start learning session:", err);
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleEndSession = async (sessionId: number) => {
    try {
      const res = await fetch(`/api/learning/sessions/${sessionId}/terminate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setActiveSession(null);
        await fetchData();
        window.dispatchEvent(new Event("refresh-consistency-theme"));
      }
    } catch (err) {
      console.error("Failed to end learning session:", err);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameValue.trim()) return;
    const res = await fetch(`/api/learning/topics/${topicId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue }),
    });
    if (res.ok) { setIsRenameOpen(false); await fetchData(); }
  };

  const handleArchive = async () => {
    const res = await fetch(`/api/learning/topics/${topicId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: 1 }),
    });
    if (res.ok) router.push("/learning");
  };

  const handleRestore = async () => {
    const res = await fetch(`/api/learning/topics/${topicId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: 0 }),
    });
    if (res.ok) await fetchData();
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    const res = await fetch(`/api/learning/topics/${topicId}`, { method: "DELETE" });
    if (res.ok) { setIsDeleteOpen(false); router.push("/learning"); }
    setDeleteLoading(false);
  };

  const openEditSession = (session: SessionItem) => {
    setEditingSession(session);
    setEditStart(toDatetimeLocal(session.started_at));
    setEditEnd(toDatetimeLocal(session.ended_at));
    setIsEditSessionOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    setEditSessionLoading(true);
    const res = await fetch(`/api/learning/sessions/${editingSession.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startedAt: toISO(editStart), endedAt: toISO(editEnd) }),
    });
    if (res.ok) { setIsEditSessionOpen(false); await fetchData(); }
    setEditSessionLoading(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        // INDEXING_TOPIC_OPERATIONAL_MATRIX...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState title="Learning Topic Not Found" description="This topic does not exist." />
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={() => router.push("/learning")} className="gap-2 font-mono">
            Back to Topics
          </Button>
        </div>
      </div>
    );
  }

  const isArchived = data.topic.archived === 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-zinc-200">

      {/* ── 1. HERO HEADER ── mirrors Target Workspace header exactly ─────── */}
      <div className="border border-border-subtle bg-card rounded-xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => router.push("/learning")}
                className="text-zinc-500 hover:text-zinc-300 font-mono text-xs uppercase flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft size={11} /> Study Index
              </button>
              <span className="text-zinc-600 font-mono text-xs">//</span>
              <h1 className="text-lg font-bold text-white tracking-tight font-mono uppercase">
                {data.topic.name}
              </h1>
              {isArchived && <Badge variant="neutral">Vaulted</Badge>}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Time accumulator and permanent learning container.
            </p>
          </div>

          {/* ACTION BUTTONS — identical pattern to Target Workspace */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
            <Button variant="secondary" className="h-8 text-[11px] gap-1 px-3" onClick={() => setIsRenameOpen(true)}>
              <Edit2 size={12} /> Rename
            </Button>
            {isArchived ? (
              <Button variant="secondary"
                className="h-8 text-[11px] gap-1 px-3 text-success-emerald border-success-emerald/20 bg-success-emerald/5 hover:bg-success-emerald/10"
                onClick={handleRestore}>
                Restore
              </Button>
            ) : (
              <Button variant="secondary"
                className="h-8 text-[11px] gap-1 px-3 text-warning-amber border-warning-amber/25 hover:bg-warning-amber/5"
                onClick={handleArchive}>
                <Archive size={12} /> Archive
              </Button>
            )}
            <Button variant="secondary"
              className="h-8 text-[11px] gap-1 px-3 text-danger-rose border-danger-rose/25 hover:bg-danger-rose/5"
              onClick={() => setIsDeleteOpen(true)}>
              <Trash2 size={12} /> Delete
            </Button>
          </div>
        </div>

        {/* ACTIVE STUDY SESSION TIMER / START BLOCK */}
        {activeSession ? (
          <div className="bg-zinc-950/80 border border-success-emerald/30 p-4 rounded-lg flex items-center justify-between font-mono text-xs text-zinc-300">
            <div className="space-y-1">
              <span className="text-[9px] text-success-emerald block uppercase tracking-wider animate-pulse">// ACTIVE STUDY SESSION</span>
              <span className="text-white font-bold">TOPIC: {activeSession.topicName?.toUpperCase() || data.topic.name.toUpperCase()}</span>
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
                className="h-9 px-4 text-xs font-bold bg-success-emerald text-black border-success-emerald hover:opacity-90 flex items-center gap-1.5 uppercase tracking-wider"
                onClick={handleStartSession}
                disabled={isStartingSession}
              >
                <Play size={11} fill="currentColor" /> Start Learning Session
              </Button>
            </div>
          )
        )}
      </div>

      {/* ── 2. METRICS CARDS — mirrors Target quad-overview ───────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="border border-border-subtle bg-black rounded-lg p-4">
          <span className="block text-[9px] text-zinc-500 uppercase font-medium">Total Study Hours</span>
          <span className="block text-xl font-bold text-white mt-1">
            {data.stats.totalHours?.toFixed(1) || "0.0"}h
          </span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-4">
          <span className="block text-[9px] text-zinc-500 uppercase font-medium">Study Sessions</span>
          <span className="block text-xl font-bold text-success-emerald mt-1">
            {data.stats.sessionsCount ?? 0}
          </span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-4">
          <span className="block text-[9px] text-zinc-500 uppercase font-medium">Last Studied</span>
          <span className="block text-lg font-bold text-white mt-1 truncate">
            {data.stats.lastStudiedAt
              ? new Date(data.stats.lastStudiedAt).toLocaleDateString([], { dateStyle: "medium" })
              : "Never"}
          </span>
        </div>
      </div>

      {/* ── 3. SESSION HISTORY TIMELINE — mirrors Target session timeline ─── */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-500 flex items-center gap-2 border-b border-border-subtle pb-2">
          <History className="w-3.5 h-3.5" /> Study Session Logs ({data.sessions.length})
        </h2>

        {data.sessions.length === 0 ? (
          <EmptyState
            title="Timeline Empty"
            description="No sessions logged for this topic yet. Go to Sessions → Learning mode to start."
          />
        ) : (
          <div className="space-y-3">
            {data.sessions.map((session) => (
              <div
                key={session.id}
                className="border border-border-subtle bg-zinc-950 p-4 rounded-lg flex items-center justify-between gap-4 font-mono text-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="success">LEARNING</Badge>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(session.started_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      {session.ended_at
                        ? ` — ${new Date(session.ended_at).toLocaleString([], { timeStyle: "short" })}`
                        : " (Active)"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs font-bold text-white">
                    {session.ended_at ? `${(session.duration / 60).toFixed(1)}h` : "Running"}
                  </span>
                  {session.ended_at && (
                    <button
                      onClick={() => openEditSession(session)}
                      className="p-1 border border-border-subtle text-zinc-500 hover:text-success-emerald hover:border-success-emerald/30 bg-zinc-900 rounded-md transition-colors cursor-pointer"
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

      {/* ── MODALS ────────────────────────────────────────────────────────── */}

      {/* Rename */}
      <InlineModal isOpen={isRenameOpen} onClose={() => setIsRenameOpen(false)} title="Rename Learning Topic">
        <form onSubmit={handleRename} className="space-y-4 font-mono text-xs">
          <div className="space-y-1.5">
            <label className="block text-[10px] text-zinc-500 uppercase">Topic Name</label>
            <Input placeholder="Topic Name" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsRenameOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="bg-success-emerald text-black border-success-emerald hover:opacity-90 font-bold">
              Rename Topic
            </Button>
          </div>
        </form>
      </InlineModal>

      {/* Delete */}
      <InlineModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Learning Topic">
        <div className="space-y-4 font-mono text-xs text-zinc-300">
          <div className="flex items-start gap-2.5 bg-danger-rose/10 border border-danger-rose/25 p-3 rounded text-[11px] leading-relaxed text-danger-rose">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              Permanently delete <strong className="text-white uppercase">{data.topic.name}</strong> and all
              associated session history. This action is irreversible.
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button type="button" variant="primary" isLoading={deleteLoading} onClick={handleDelete}
              className="bg-danger-rose text-white border-danger-rose hover:opacity-90 font-bold">
              Confirm Delete
            </Button>
          </div>
        </div>
      </InlineModal>

      <InlineModal isOpen={isEditSessionOpen && !!editingSession} onClose={() => setIsEditSessionOpen(false)} title="Edit Session Times">
        <form onSubmit={handleSaveEdit} className="space-y-4 font-mono text-xs">
          <div className="space-y-1.5">
            <label className="block text-[10px] text-zinc-500 uppercase">Start Time</label>
            <input type="datetime-local" value={editStart} onChange={(e) => setEditStart(e.target.value)}
              className="w-full bg-black border border-border-subtle rounded-md text-xs px-3 py-2 text-zinc-300 focus:outline-none focus:border-success-emerald font-mono h-9" required />
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setEditStart(adjustDateTime(editStart, -30))}
                className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-success-emerald hover:border-success-emerald/40 transition-colors cursor-pointer"
              >
                -30m
              </button>
              <button
                type="button"
                onClick={() => setEditStart(formatLocalDateTime(new Date()))}
                className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-success-emerald hover:border-success-emerald/40 transition-colors cursor-pointer"
              >
                Current Time
              </button>
              <button
                type="button"
                onClick={() => setEditStart(adjustDateTime(editStart, 30))}
                className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-success-emerald hover:border-success-emerald/40 transition-colors cursor-pointer"
              >
                +30m
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] text-zinc-500 uppercase">End Time</label>
            <input type="datetime-local" value={editEnd} onChange={(e) => setEditEnd(e.target.value)}
              className="w-full bg-black border border-border-subtle rounded-md text-xs px-3 py-2 text-zinc-300 focus:outline-none focus:border-success-emerald font-mono h-9" required />
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setEditEnd(adjustDateTime(editEnd, -30))}
                className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-success-emerald hover:border-success-emerald/40 transition-colors cursor-pointer"
              >
                -30m
              </button>
              <button
                type="button"
                onClick={() => setEditEnd(formatLocalDateTime(new Date()))}
                className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-success-emerald hover:border-success-emerald/40 transition-colors cursor-pointer"
              >
                Current Time
              </button>
              <button
                type="button"
                onClick={() => setEditEnd(adjustDateTime(editEnd, 30))}
                className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-success-emerald hover:border-success-emerald/40 transition-colors cursor-pointer"
              >
                +30m
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditSessionOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={editSessionLoading}
              className="bg-success-emerald text-black border-success-emerald hover:opacity-90 font-bold">
              Save Changes
            </Button>
          </div>
        </form>
      </InlineModal>

    </div>
  );
}
