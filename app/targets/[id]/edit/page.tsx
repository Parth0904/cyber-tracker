"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Play, Plus, FileText, StickyNote, Shield, ExternalLink, Clock, 
  Terminal, History, BarChart3, Layers, AlertCircle, DollarSign, ArrowLeft 
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Progress } from "@/components/ui/Progress";

// --- STRICT WORKSPACE COMPONENT TYPES ---
type ScopeItem = { type: string; pattern: string; status: string };
type SessionItem = { id: string; type: string; description: string; start: string; end: string; duration: string; status: string };
type FindingItem = { id: string; severity: string; status: string; title: string; reward?: string; date: string; url?: string };
type ReportItem = { id: string; date: string; status: string; reward?: string; resolution: string; url?: string };
type TimelineItem = { id: string; action: string; timestamp: string };

type TargetDetailData = {
  id: string;
  name: string;
  platform: string;
  status: string;
  priority: string;
  url: string;
  hoursInvested: number;
  sessionStatus: string;
  scope: ScopeItem[];
  sessions: SessionItem[];
  findings: FindingItem[];
  reports: ReportItem[];
  timeline: TimelineItem[];
  notes: string;
};

export default function TargetDetailsWorkspace() {
  const params = useParams();
  const router = useRouter();
  const targetId = params?.id as string;

  // State Management - Initialized clean with zero temporary placeholders
  const [data, setData] = React.useState<TargetDetailData | null>(null);
  const [activeTab, setActiveTab] = React.useState("overview");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!targetId) return;
    async function fetchWorkspaceData() {
      try {
        const res = await fetch(`/api/targets/${targetId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Workspace synchronization vector failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchWorkspaceData();
  }, [targetId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        // INDEXING_ACTIVE_WORKSPACE_ENVIRONMENT...
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
            <ArrowLeft size={14} /> Back to Mission Control
          </Button>
        </div>
      </div>
    );
  }

  const workspaceTabs = [
    { id: "overview", label: "Overview & Scope", icon: <Terminal size={13} /> },
    { id: "sessions", label: "Toggl Sessions", icon: <Layers size={13} /> },
    { id: "findings", label: "Issues (Findings)", icon: <AlertCircle size={13} /> },
    { id: "reports", label: "Submissions (Reports)", icon: <FileText size={13} /> },
    { id: "notes", label: "Hunting Notes", icon: <StickyNote size={13} /> },
    { id: "timeline", label: "Continuous Timeline", icon: <History size={13} /> }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-zinc-200">
      
      {/* 1. TOP HERO REGISTRY BLOCK */}
      <div className="border border-border-subtle bg-card rounded-lg p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-500 font-mono text-xs uppercase">{data.platform}</span>
              <span className="text-zinc-600 font-mono text-xs">//</span>
              <h1 className="text-md font-bold text-white tracking-tight">{data.name}</h1>
              <Badge variant={data.priority === "P1" ? "danger" : "warning"}>{data.priority}</Badge>
              <Badge variant="cyan">{data.status}</Badge>
            </div>
            <a href={data.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-mono text-accent-cyan hover:underline">
              {data.url} <ExternalLink size={11} />
            </a>
          </div>

          {/* QUICK TERMINAL ACTIONS HUB */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" className="h-8 text-[11px] gap-1.5 bg-success-emerald text-black border-success-emerald hover:opacity-90">
              <Play size={12} fill="currentColor" /> Start Session
            </Button>
            <Button variant="secondary" className="h-8 text-[11px] gap-1.5">
              <Plus size={12} /> Log Finding
            </Button>
            <Button variant="secondary" className="h-8 text-[11px] gap-1.5">
              <FileText size={12} /> Report
            </Button>
          </div>
        </div>
      </div>

      {/* 2. THE QUAD-OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="border border-border-subtle bg-black rounded-lg p-3.5">
          <span className="block text-[9px] text-zinc-500 uppercase font-medium">Total Invested Time</span>
          <span className="block text-lg font-bold text-white mt-1">{data.hoursInvested?.toFixed(1) || "0.0"}h</span>
          <span className="block text-[9px] text-success-emerald mt-0.5">▲ Operational velocity active</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3.5">
          <span className="block text-[9px] text-zinc-500 uppercase font-medium">Recon & Test Sessions</span>
          <span className="block text-lg font-bold text-white mt-1">{(data.sessions || []).length} Logs</span>
          <span className="block text-[9px] text-zinc-400 mt-0.5">Stable continuous audit track</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3.5">
          <span className="block text-[9px] text-zinc-500 uppercase font-medium">Identified Vulnerabilities</span>
          <span className="block text-lg font-bold text-success-emerald mt-1">{(data.findings || []).length} Bugs</span>
          <span className="block text-[9px] text-accent-cyan mt-0.5">Triaged threat mapping</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3.5">
          <span className="block text-[9px] text-zinc-500 uppercase font-medium">Submitted Platform Reports</span>
          <span className="block text-lg font-bold text-warning-amber mt-1">{(data.reports || []).length} Forms</span>
          <span className="block text-[9px] text-zinc-500 mt-0.5">Resolution rate tracking clean</span>
        </div>
      </div>

      {/* 3. TABBED WORKSPACE FRAMEWORK ROW */}
      <div className="flex bg-zinc-950 px-2 border border-border-subtle rounded-t-lg overflow-x-auto scrollbar-none gap-1 pt-1 bg-black">
        {workspaceTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 py-2 px-3.5 text-xs font-medium transition-all rounded-t-md border-t border-x relative -mb-[1px] whitespace-nowrap
              ${activeTab === tab.id 
                ? "bg-card border-border-subtle text-white font-semibold" 
                : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 4. DYNAMIC VIEWPORTS TERMINAL CONTAINER */}
      <div className="border-x border-b border-border-subtle bg-card rounded-b-lg p-5 min-h-[300px]">
        
        {/* TAB viewport: SCOPE MAP OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-4 animate-in fade-in duration-100">
            <h3 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-2">// DIRECT_ATTACK_SURFACE_SCOPE</h3>
            {(data.scope || []).length === 0 ? (
              <EmptyState title="No Scopes Cataloged" description="This workspace does not contain registered network bounds or active binary assets targets." />
            ) : (
              <div className="border border-border-subtle rounded-md overflow-hidden bg-black">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-950 border-b border-border-subtle text-zinc-500 text-[10px]">
                    <tr>
                      <th className="p-3">Asset Target Type</th>
                      <th className="p-3">Scope Rule Rule / Endpoint Track</th>
                      <th className="p-3 text-right">Coverage Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/40 text-zinc-300">
                    {data.scope.map((s, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/30">
                        <td className="p-3 text-zinc-500">{s.type}</td>
                        <td className="p-3 text-white font-semibold">{s.pattern}</td>
                        <td className="p-3 text-right"><Badge variant="cyan">{s.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB viewport: TOGGL HUNTING SESSIONS LOGS */}
        {activeTab === "sessions" && (
          <div className="space-y-3 animate-in fade-in duration-100">
            {(data.sessions || []).length === 0 ? (
              <EmptyState title="No Tracking Sessions Found" description="Launch your first live testing session to audit real-time tracking durations." />
            ) : (
              data.sessions.map(s => (
                <div key={s.id} className="border border-border-subtle bg-black p-4 rounded-md flex flex-col sm:flex-row justify-between sm:items-center gap-3 font-mono text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">{s.type.toUpperCase()}</Badge>
                      <span className="text-zinc-500 text-[11px]">{s.start} - {s.end}</span>
                    </div>
                    <p className="font-sans text-zinc-300 leading-relaxed text-xs">{s.description}</p>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <span className="font-bold text-white text-sm">{s.duration}</span>
                    <Button variant="secondary" className="h-6 text-[10px] px-2">Resume</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB viewport: GITHUB ISSUES FINDINGS RUNWAY */}
        {activeTab === "findings" && (
          <div className="space-y-3 animate-in fade-in duration-100">
            {(data.findings || []).length === 0 ? (
              <EmptyState title="No Bugs Logged" description="No unhandled operational flaws have been index tracked against this targets network frame yet." />
            ) : (
              data.findings.map(f => (
                <div key={f.id} className="border border-border-subtle bg-black p-4 rounded-md flex justify-between items-start gap-3 transition-colors hover:border-zinc-700">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={f.severity === "Critical" || f.severity === "High" ? "danger" : "warning"}>{f.severity}</Badge>
                      <span className="text-[10px] font-mono text-zinc-500">{f.date}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-white pt-1">{f.title}</h4>
                    <div className="text-[10px] font-mono text-zinc-500">STATE STATUS // <span className="text-accent-cyan">{f.status}</span></div>
                  </div>
                  {f.reward && <span className="text-xs font-mono font-bold text-success-emerald bg-success-emerald/10 border border-success-emerald/20 px-2 py-0.5 rounded shrink-0">{f.reward}</span>}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB viewport: DOCUMENTATION SUBMITTED REPORTS */}
        {activeTab === "reports" && (
          <div className="space-y-3 animate-in fade-in duration-100">
            {(data.reports || []).length === 0 ? (
              <EmptyState title="No Disclosures Discovered" description="Disclose vulnerabilities to the tracking endpoint to initialize your submission stream history logs." />
            ) : (
              data.reports.map(r => (
                <div key={r.id} className="border border-border-subtle bg-black p-4 rounded-md font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-border-subtle/40 pb-2">
                    <span className="text-zinc-400">SUBMISSION: {r.id.toUpperCase()}</span>
                    <span className="text-[10px] text-zinc-600">{r.date}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-[11px]">
                    <div><span className="text-zinc-600 block text-[9px] uppercase">Resolution</span><span className="text-zinc-200">{r.resolution}</span></div>
                    <div><span className="text-zinc-600 block text-[9px] uppercase">Payout</span><span className="text-success-emerald font-bold">{r.reward || "$0.00"}</span></div>
                    <div><span className="text-zinc-600 block text-[9px] uppercase">State tracking</span><span className="text-warning-amber">{r.status}</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB viewport: INTEGRATED HUNTING NOTES MARKDOWN CANVAS */}
        {activeTab === "notes" && (
          <div className="space-y-4 animate-in fade-in duration-100">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">// LOCAL_WORKSPACE_NOTEBOOK</h3>
              <Button variant="secondary" className="h-6 text-[10px] px-2">Save Buffer</Button>
            </div>
            <textarea
              className="w-full h-48 bg-black border border-border-subtle rounded-md p-3 text-xs font-mono text-zinc-300 focus:outline-none focus:border-accent-cyan resize-y leading-relaxed"
              placeholder="Inject tactical note segments, endpoints payloads vectors, tracking targets configurations..."
              value={data.notes || ""}
              onChange={(e) => setData(data ? { ...data, notes: e.target.value } : null)}
            />
          </div>
        )}

        {/* TAB viewport: REVERSE-CHRONOLOGICAL OPERATIONAL AUDIT TIMELINE */}
        {activeTab === "timeline" && (
          <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-border-subtle animate-in fade-in duration-100 pl-6">
            {(data.timeline || []).length === 0 ? (
              <div className="text-center font-mono text-[10px] text-zinc-600 py-6 -ml-6">// RETRIEVAL_TIMELINE_EMPTY</div>
            ) : (
              data.timeline.map(t => (
                <div key={t.id} className="relative group">
                  <div className="absolute -left-6.5 top-1.5 h-2 w-2 rounded-full bg-zinc-800 border border-zinc-600 group-hover:bg-accent-cyan transition-colors" />
                  <div className="flex items-center justify-between gap-4 text-xs font-mono bg-black p-3 rounded border border-border-subtle/50">
                    <span className="text-zinc-300">{t.action}</span>
                    <span className="text-[10px] text-zinc-600 shrink-0">{t.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}