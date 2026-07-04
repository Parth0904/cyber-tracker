"use client";

import * as React from "react";
import { X, ExternalLink, Terminal, History, StickyNote, Link } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type DrawerProps = {
  finding: any;
  onClose: () => void;
};

export function FindingDetailsDrawer({ finding, onClose }: DrawerProps) {
  const [activeTab, setActiveTab] = React.useState("overview");

  const tabs = [
    { id: "overview", label: "Triage Core" },
    { id: "notes", label: "Reproduction & Payloads" },
    { id: "timeline", label: "Audit Log Trailing" }
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-full lg:w-7/12 bg-black border-l border-border-subtle z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 text-zinc-200">
      
      {/* DRAWER STRUCTURAL HEADER CONTAINER */}
      <div className="p-4 border-b border-border-subtle bg-zinc-950 flex justify-between items-center">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-mono text-[10px] uppercase">{finding.platform} / {finding.targetName}</span>
          </div>
          <h2 className="text-xs font-bold text-white tracking-tight truncate max-w-lg">{finding.title}</h2>
        </div>
        <button onClick={onClose} className="p-1.5 border border-border-subtle rounded-md hover:bg-zinc-900 text-zinc-500 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* COMPACT SUB-NAVIGATION TABBED LINK SLIDER BAR */}
      <div className="flex bg-zinc-950 px-4 border-b border-border-subtle overflow-x-auto scrollbar-none gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`py-2 px-3 text-[11px] font-medium transition-all border-b-2 relative -mb-[1px] whitespace-nowrap
              ${activeTab === t.id ? "border-accent-cyan text-white font-semibold" : "border-transparent text-zinc-500 hover:text-zinc-400"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CORE FRAME LAYOUT VIEWPORT CONTAINER */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-black">
        
        {/* DRAW VIEWPORT: OVERVIEW METRIC SUMMARY PILL */}
        {activeTab === "overview" && (
          <div className="space-y-5 animate-in fade-in duration-100 font-mono text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950 p-4 border border-border-subtle rounded-md">
              <div>
                <span className="block text-[9px] text-zinc-600 uppercase">Severity</span>
                <span className="text-white font-bold">{finding.severity}</span>
              </div>
              <div>
                <span className="block text-[9px] text-zinc-600 uppercase">State Tier</span>
                <span className="text-white font-bold">{finding.status}</span>
              </div>
              <div>
                <span className="block text-[9px] text-zinc-600 uppercase">Bounty</span>
                <span className="text-success-emerald font-bold">${finding.reward || "0"}</span>
              </div>
              <div>
                <span className="block text-[9px] text-zinc-600 uppercase">CVE Node</span>
                <span className="text-zinc-400 font-semibold">{finding.cve || "NONE"}</span>
              </div>
            </div>

            {finding.reportUrl && (
              <div className="space-y-1.5 bg-zinc-950 border border-border-subtle p-3 rounded-md">
                <span className="block text-[9px] text-zinc-600 uppercase flex items-center gap-1"><Link size={10}/> External Disclosure Mapping Link</span>
                <a href={finding.reportUrl} target="_blank" rel="noreferrer" className="text-accent-cyan text-[11px] hover:underline flex items-center gap-1">
                  {finding.reportUrl} <ExternalLink size={11} />
                </a>
              </div>
            )}

            {/* REFERENCES SUB-SECTION BLOCKS */}
            <div className="space-y-2">
              <h4 className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-1.5"><Terminal size={12}/> Reference Material Vectors</h4>
              {(!finding.references || finding.references.length === 0) ? (
                <div className="text-[10px] text-zinc-600 font-mono tracking-tight py-2">// NO_EXTERNAL_REFERENCES_BOUND</div>
              ) : (
                <div className="space-y-1.5">
                  {finding.references.map((ref: string, i: number) => (
                    <a key={i} href={ref} target="_blank" rel="noreferrer" className="block text-[11px] text-zinc-400 border border-border-subtle p-2 rounded bg-zinc-950/40 hover:border-zinc-700 transition-colors truncate">
                      {ref}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DRAW VIEWPORT: MARKDOWN MANUAL TEXT NOTEBOOK */}
        {activeTab === "notes" && (
          <div className="space-y-3 animate-in fade-in duration-100">
            <h4 className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5"><StickyNote size={12}/> Proof-Of-Concept (PoC) & Reproduction Notebook</h4>
            <div className="border border-border-subtle bg-zinc-950/50 p-4 rounded-md font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {finding.notes || "// No proof-of-concept markdown documentation added to this finding tracker yet."}
            </div>
          </div>
        )}

        {/* DRAW VIEWPORT: TIME AUDITING TIMELINE */}
        {activeTab === "timeline" && (
          <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-border-subtle animate-in fade-in duration-100 pl-6 font-mono text-xs">
            {(!finding.timeline || finding.timeline.length === 0) ? (
              <div className="text-center text-zinc-600 text-[10px] py-6 -ml-6">// ZERO_TIMELINE_ENTRIES_INDEXED</div>
            ) : (
              finding.timeline.map((t: any, idx: number) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-6.5 top-1.5 h-2 w-2 rounded-full bg-zinc-800 border border-zinc-600 group-hover:bg-accent-cyan transition-colors" />
                  <div className="flex items-center justify-between gap-4 bg-zinc-950/40 p-2.5 rounded border border-border-subtle/40">
                    <span className="text-zinc-300">{t.action}</span>
                    <span className="text-[10px] text-zinc-600 shrink-0">{new Date(t.timestamp).toLocaleDateString()}</span>
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