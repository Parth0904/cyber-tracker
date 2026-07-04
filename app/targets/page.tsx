"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Plus, Target, Archive, Shield, 
  ExternalLink, X, Terminal, Layers
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Progress } from "@/components/ui/Progress";

// --- TYPE DEFINITIONS ---
type ScopeItem = { type: string; pattern: string; status: string };
type SessionItem = { id: string; type: string; start: string; end: string; duration: string; description: string };
type FindingItem = { id: string; title: string; severity: "Critical" | "High" | "Medium" | "Low"; status: string; reward?: string; url?: string; date: string };
type TimelineItem = { id: string; label: string; date: string; type: string };

type TargetData = {
  id: string;
  name: string;
  platform: string;
  status: "Active" | "Paused" | "Archived";
  priority: "P1" | "P2" | "P3" | "P4";
  hoursInvested: number;
  openFindings: number;
  submittedReports: number;
  lastActivity: string;
  progress: number;
  url: string;
  createdDate: string;
  scope: ScopeItem[];
  sessions: SessionItem[];
  findings: FindingItem[];
  timeline: TimelineItem[];
};

export default function TargetsPage() {
  const router = useRouter();
  
  //  FIXED: Seed values removed entirely. Starts with an empty tracking array 
  // that populates immediately when wired to your database API hook loops.
  const [targets, setTargets] = React.useState<TargetData[]>([]);
  const [search, setSearch] = React.useState("");
  const [platformFilter, setPlatformFilter] = React.useState("All");
  const [selectedTarget, setSelectedTarget] = React.useState<TargetData | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = React.useState("overview");

  // Fetch initial collection data values directly from your api route layer
  React.useEffect(() => {
    async function loadPrograms() {
      try {
        const response = await fetch("/api/targets");
        if (response.ok) {
          const data = await response.json();
          setTargets(data || []);
        }
      } catch (err) {
        console.error("Failed to load targets workspace matrix:", err);
      }
    }
    loadPrograms();
  }, []);

  // Filter systems tracking computations
  const filteredTargets = (targets || []).filter(t => {
    const matchesSearch = t.name?.toLowerCase().includes(search.toLowerCase()) || t.platform?.toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = platformFilter === "All" || t.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  const activeTargets = filteredTargets.filter(t => t.status !== "Archived");
  const archivedTargets = filteredTargets.filter(t => t.status === "Archived");

  const getPriorityColor = (p: string) => {
    if (p === "P1") return "danger";
    if (p === "P2") return "warning";
    return "neutral";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 text-zinc-200">
      
      {/* HEADER CONTROLS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-mono flex items-center gap-2">
            <Target className="w-4 h-4 text-accent-cyan" /> Target Mission Control
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Manage targets, track test coverage velocities, and review open operational findings.
          </p>
        </div>
        <Button variant="primary" className="gap-1.5 self-start md:self-auto h-9 text-xs" onClick={() => router.push("/targets/new")}>
          <Plus className="w-3.5 h-3.5" />
          <span>Track New Target</span>
        </Button>
      </div>

      {/* FILTERS PANEL TRACK */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-black p-3 border border-border-subtle rounded-lg">
        <div className="w-full md:w-80">
          <Input 
            placeholder="Search active scopes..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-3.5 h-3.5" />}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select 
            value={platformFilter} 
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-zinc-950 border border-border-subtle rounded-md text-xs px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-accent-cyan font-mono"
          >
            <option value="All">PLATFORMS: ALL</option>
            <option value="HackerOne">HACKERONE</option>
            <option value="Bugcrowd">BUGCROWD</option>
            <option value="Private">PRIVATE VDP</option>
          </select>
        </div>
      </div>

      {/* CORE CARDS STREAM GRID AREA */}
      {targets.length === 0 ? (
        <EmptyState 
          title="No Active Targets Deployed" 
          description="Your security operational matrix indices are blank. Initialize your workspace by setting up your first target tracker program."
        />
      ) : (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-500 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-accent-cyan" /> Active Engagements ({activeTargets.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTargets.map(target => (
                <div 
                  key={target.id}
                  onClick={() => { setSelectedTarget(target); setActiveWorkspaceTab("overview"); }}
                  className="group bg-card border border-border-subtle rounded-lg p-4 space-y-4 hover:border-accent-cyan transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-semibold text-white group-hover:text-accent-cyan transition-colors truncate max-w-[180px]">
                          {target.name}
                        </h3>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">{target.platform}</span>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <Badge variant={getPriorityColor(target.priority)}>{target.priority}</Badge>
                        <Badge variant={target.status === "Active" ? "cyan" : "neutral"}>{target.status}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-border-subtle/50 my-3 text-center font-mono">
                      <div>
                        <span className="block text-[9px] text-zinc-600 uppercase">Invested</span>
                        <span className="text-xs font-medium text-zinc-300">{target.hoursInvested || 0}h</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-zinc-600 uppercase">Bugs</span>
                        <span className="text-xs font-medium text-success-emerald">{target.openFindings || 0}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-zinc-600 uppercase">Reports</span>
                        <span className="text-xs font-medium text-warning-amber">{target.submittedReports || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>Coverage Mapping</span>
                      <span>{target.progress || 0}%</span>
                    </div>
                    <Progress value={target.progress || 0} className="h-1" />
                    <div className="text-[9px] text-zinc-600 font-mono text-right pt-1">
                      LAST RUN // {(target.lastActivity || "N/A").toUpperCase()}
                    </div>
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
            </div>
          )}
        </div>
      )}

      {/*  FIXED: Included embedded definition safely below to resolve the reference crash loop */}
      {selectedTarget && (
        <TargetWorkspacePanel 
          target={selectedTarget} 
          activeTab={activeWorkspaceTab}
          setActiveTab={setActiveWorkspaceTab}
          onClose={() => setSelectedTarget(null)} 
        />
      )}
    </div>
  );
}

// --- INTERNAL EMBEDDED REPO SIDE PANEL COMPONENT ---
function TargetWorkspacePanel({ target, activeTab, setActiveTab, onClose }: { target: any; activeTab: string; setActiveTab: (t: string) => void; onClose: () => void }) {
  const tabs = [
    { id: "overview", label: "Code & Scope" },
    { id: "sessions", label: "Recon Sessions" },
    { id: "findings", label: "Issues (Findings)" },
    { id: "timeline", label: "Audit Timeline" }
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-full lg:w-3/5 bg-black border-l border-border-subtle z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-zinc-950">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-mono text-xs">{target.platform} /</span>
            <h2 className="text-sm font-bold text-white tracking-tight">{target.name}</h2>
          </div>
          <a href={target.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-mono text-accent-cyan mt-1 hover:underline">
            <span>{target.url}</span> <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-md border border-border-subtle hover:bg-zinc-900 transition-colors text-zinc-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex bg-zinc-950 px-4 border-b border-border-subtle overflow-x-auto scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2.5 px-3 text-xs font-medium transition-all border-b-2 relative -mb-[1px] whitespace-nowrap
              ${activeTab === tab.id ? "border-accent-cyan text-white font-semibold" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-black">
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-950 p-4 border border-border-subtle rounded-md font-mono">
              <div>
                <span className="block text-[9px] text-zinc-600 uppercase">Priority</span>
                <span className="text-xs font-semibold text-white">{target.priority}</span>
              </div>
              <div>
                <span className="block text-[9px] text-zinc-600 uppercase">Track Date</span>
                <span className="text-xs font-semibold text-zinc-300">{target.createdDate || "N/A"}</span>
              </div>
              <div>
                <span className="block text-[9px] text-zinc-600 uppercase">Total Hours</span>
                <span className="text-xs font-semibold text-zinc-300">{target.hoursInvested || 0}h</span>
              </div>
              <div>
                <span className="block text-[9px] text-zinc-600 uppercase">Findings</span>
                <span className="text-xs font-semibold text-success-emerald">{(target.findings || []).length}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-accent-cyan" /> Target Attack Surface Scope Mapping
              </h3>
              <div className="border border-border-subtle rounded-md overflow-hidden bg-zinc-950">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-900 border-b border-border-subtle text-zinc-500 text-[10px]">
                    <tr>
                      <th className="p-2.5">Target Type</th>
                      <th className="p-2.5">Scope Target Definition Rule</th>
                      <th className="p-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/50 text-zinc-300">
                    {(target.scope || []).map((s: any, idx: number) => (
                      <tr key={idx} className="hover:bg-zinc-900/40">
                        <td className="p-2.5 text-zinc-400">{s.type}</td>
                        <td className="p-2.5 text-white font-semibold">{s.pattern}</td>
                        <td className="p-2.5 text-right"><Badge variant="cyan">{s.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sessions" && (
          <div className="space-y-4 animate-in fade-in duration-100">
            {(target.sessions || []).length === 0 ? (
              <div className="text-center font-mono text-[10px] text-zinc-600 py-6">// ZERO_ACTIVE_SESSIONS_RECORDED</div>
            ) : (
              target.sessions.map((session: any) => (
                <div key={session.id} className="border border-border-subtle bg-zinc-950 p-4 rounded-md space-y-2 font-mono">
                  <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-accent-cyan" />
                      <span className="text-[11px] font-semibold text-white uppercase">{session.type}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">{session.start} - {session.end} ({session.duration})</span>
                  </div>
                  <p className="text-xs font-sans text-zinc-400 leading-relaxed pt-1">{session.description}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "findings" && (
          <div className="space-y-3 animate-in fade-in duration-100">
            {(target.findings || []).length === 0 ? (
              <div className="text-center font-mono text-[10px] text-zinc-600 py-6">// ZERO_VULNERABILITIES_LOGGED</div>
            ) : (
              target.findings.map((finding: any) => (
                <div key={finding.id} className="border border-border-subtle bg-zinc-950 p-4 rounded-md flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition-colors hover:border-zinc-700">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={finding.severity === "High" || finding.severity === "Critical" ? "danger" : "warning"}>{finding.severity}</Badge>
                      <span className="text-[10px] font-mono text-zinc-500">{finding.date}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-white pt-1">{finding.title}</h4>
                    <div className="text-[10px] font-mono text-zinc-400">STATUS // <span className="text-accent-cyan">{finding.status.toUpperCase()}</span></div>
                  </div>
                  {finding.reward && <span className="text-xs font-mono font-bold text-success-emerald bg-success-emerald/10 border border-success-emerald/20 px-2 py-0.5 rounded self-start sm:self-auto">{finding.reward}</span>}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-border-subtle animate-in fade-in duration-100 pl-6">
            {(target.timeline || []).length === 0 ? (
              <div className="text-center font-mono text-[10px] text-zinc-600 py-6 -ml-6">// NO_TIMELINE_EVENTS</div>
            ) : (
              target.timeline.map((evt: any) => (
                <div key={evt.id} className="relative group">
                  <div className="absolute -left-6.5 top-1.5 h-2 w-2 rounded-full bg-zinc-800 border border-zinc-600 group-hover:bg-accent-cyan transition-colors" />
                  <div className="flex items-center justify-between gap-4 text-xs font-mono bg-zinc-950/40 p-2.5 rounded border border-border-subtle/30">
                    <span className="text-zinc-300">{evt.label}</span>
                    <span className="text-[10px] text-zinc-600 shrink-0">{evt.date}</span>
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