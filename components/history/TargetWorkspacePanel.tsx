"use client";

import * as React from "react";
import { X, ExternalLink, ShieldCheck, Terminal, Layers, AlertCircle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type WorkspacePanelProps = {
  target: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onClose: () => void;
};

export function TargetWorkspacePanel({ target, activeTab, setActiveTab, onClose }: WorkspacePanelProps) {
  
  // Custom secondary sub-navigation matching GitHub repo links
  const tabs = [
    { id: "overview", label: "Code & Scope" },
    { id: "sessions", label: "Recon Sessions" },
    { id: "findings", label: "Issues (Findings)" },
    { id: "timeline", label: "Audit Timeline" }
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-full lg:w-3/5 bg-black border-l border-border-subtle z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* SHEET HEADER FRAMEWORK */}
      <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-zinc-950">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-mono text-xs">{target.platform} /</span>
            <h2 className="text-md font-bold text-white tracking-tight">{target.name}</h2>
          </div>
          <a 
            href={target.url} 
            target="_blank" 
            rel="noreferrer" 
            className="inline-flex items-center gap-1 text-[10px] font-mono text-accent-cyan mt-1 hover:underline"
          >
            <span>{target.url}</span> <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-md border border-border-subtle hover:bg-zinc-900 transition-colors text-zinc-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* SUB-TAB REPO BAR */}
      <div className="flex bg-zinc-950 px-4 border-b border-border-subtle overflow-x-auto scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2.5 px-3 text-xs font-medium transition-all border-b-2 relative -mb-[1px] whitespace-nowrap
              ${activeTab === tab.id 
                ? "border-accent-cyan text-white font-semibold" 
                : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DYNAMIC SCROLLABLE BODY ENGINE */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-black">
        
        {/* TAB 1: OVERVIEW & SCOPE RUNWAY */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-950 p-4 border border-border-subtle rounded-md font-mono">
              <div>
                <span className="block text-[9px] text-zinc-600 uppercase">Priority</span>
                <span className="text-sm font-semibold text-white">{target.priority}</span>
              </div>
              <div>
                <span className="block text-[9px] text-zinc-600 uppercase">Track Date</span>
                <span className="text-sm font-semibold text-zinc-300">{target.createdDate}</span>
              </div>
              <div>
                <span className="block text-[9px] text-zinc-600 uppercase">Total Hours</span>
                <span className="text-sm font-semibold text-zinc-300">{target.hoursInvested}h</span>
              </div>
              <div>
                <span className="block text-[9px] text-zinc-600 uppercase">Findings Count</span>
                <span className="text-sm font-semibold text-success-emerald">{target.findings.length}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> Target Attack Surface Scope Mapping
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
                    {target.scope.map((s: any, idx: number) => (
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

        {/* TAB 2: RECON TIMELINE SESSIONS */}
        {activeTab === "sessions" && (
          <div className="space-y-4 animate-in fade-in duration-100">
            {target.sessions.map((session: any) => (
              <div key={session.id} className="border border-border-subtle bg-zinc-950 p-4 rounded-md space-y-2 font-mono">
                <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-accent-cyan" />
                    <span className="text-xs font-semibold text-white uppercase">{session.type}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">{session.start} - {session.end} ({session.duration})</span>
                </div>
                <p className="text-xs font-sans text-zinc-400 leading-relaxed pt-1">
                  {session.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: FINDINGS ISSUES FRAMEWORK */}
        {activeTab === "findings" && (
          <div className="space-y-3 animate-in fade-in duration-100">
            {target.findings.map((finding: any) => (
              <div 
                key={finding.id} 
                className="border border-border-subtle bg-zinc-950 p-4 rounded-md flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition-colors hover:border-zinc-700"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={finding.severity === "High" || finding.severity === "Critical" ? "danger" : "warning"}>
                      {finding.severity}
                    </Badge>
                    <span className="text-[10px] font-mono text-zinc-500">{finding.date}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white pt-1">{finding.title}</h4>
                  <div className="text-[10px] font-mono text-zinc-400">STATUS // <span className="text-accent-cyan">{finding.status.toUpperCase()}</span></div>
                </div>
                {finding.reward && (
                  <span className="text-xs font-mono font-bold text-success-emerald bg-success-emerald/10 border border-success-emerald/20 px-2 py-0.5 rounded self-start sm:self-auto">
                    {finding.reward}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: CHRONOLOGICAL ACTIVITY TIMELINE */}
        {activeTab === "timeline" && (
          <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-border-subtle animate-in fade-in duration-100 pl-6">
            {target.timeline.map((evt: any) => (
              <div key={evt.id} className="relative group">
                <div className="absolute -left-6.5 top-1.5 h-2 w-2 rounded-full bg-zinc-800 border border-zinc-600 group-hover:bg-accent-cyan transition-colors" />
                <div className="flex items-center justify-between gap-4 text-xs font-mono bg-zinc-950/40 p-2.5 rounded border border-border-subtle/30">
                  <span className="text-zinc-300">{evt.label}</span>
                  <span className="text-[10px] text-zinc-600 shrink-0">{evt.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}