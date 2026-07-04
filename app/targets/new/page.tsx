"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, ShieldAlert } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type ScopeInput = { type: string; pattern: string };

export default function NewTargetPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  
  // Core State
  const [name, setName] = React.useState("");
  const [platform, setPlatform] = React.useState("HackerOne");
  const [priority, setPriority] = React.useState("P2");
  const [url, setUrl] = React.useState("");
  const [scope, setScope] = React.useState<ScopeInput[]>([{ type: "Wildcard Domain", pattern: "" }]);

  // Scope Management Actions
  const addScopeRow = () => setScope([...scope, { type: "Wildcard Domain", pattern: "" }]);
  const removeScopeRow = (index: number) => setScope(scope.filter((_, i) => i !== index));
  const updateScopePattern = (index: number, val: string) => {
    const updated = [...scope];
    updated[index].pattern = val;
    setScope(updated);
  };
  const updateScopeType = (index: number, val: string) => {
    const updated = [...scope];
    updated[index].type = val;
    setScope(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Connects seamlessly to your existing backend architecture route
    await fetch("/api/targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, platform, priority, url, scope }),
    });

    setLoading(false);
    router.push("/targets");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 text-zinc-200">
      
      {/* Navigation Header */}
      <div className="flex items-center gap-3">
        <Button variant="secondary" className="p-2 h-auto" onClick={() => router.push("/targets")}>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Button>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-mono">
            Deploy // New Target Workspace
          </h1>
          <p className="text-[11px] text-zinc-500">Initialize scoping indices and asset configurations.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Panel>
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white border-b border-border-subtle pb-2">
              Program Parameters
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-zinc-500 uppercase">Program Identity Name</label>
                <Input placeholder="e.g., Fintech Core Enterprise" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-zinc-500 uppercase">Tracking Platform Hub</label>
                <select 
                  value={platform} 
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-black border border-border-subtle rounded-md text-xs px-3 py-2 text-zinc-300 focus:outline-none focus:border-accent-cyan font-mono h-9"
                >
                  <option value="HackerOne">HackerOne</option>
                  <option value="Bugcrowd">Bugcrowd</option>
                  <option value="Intigriti">Intigriti</option>
                  <option value="Private VDP">Private VDP</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-zinc-500 uppercase">Initial Severity Escalation Tier</label>
                <select 
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-black border border-border-subtle rounded-md text-xs px-3 py-2 text-zinc-300 focus:outline-none focus:border-accent-cyan font-mono h-9"
                >
                  <option value="P1">P1 // CRITICAL STRATEGIC</option>
                  <option value="P2">P2 // HIGH OPERATIONAL</option>
                  <option value="P3">P3 // MEDIUM BALANCED</option>
                  <option value="P4">P4 // LOW INFORMATIONAL</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-zinc-500 uppercase">Program Reference URL</label>
                <Input placeholder="https://hackerone.com/program" value={url} onChange={(e) => setUrl(e.target.value)} required />
              </div>
            </div>
          </div>
        </Panel>

        {/* Dynamic Scope Engine Grid */}
        <Panel>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                Initial Attack Surface / Asset Scope Definition
              </h3>
              <Button type="button" variant="secondary" className="h-6 text-[10px] px-2 gap-1" onClick={addScopeRow}>
                <Plus className="w-3 h-3" /> Add Asset
              </Button>
            </div>

            <div className="space-y-2">
              {scope.map((row, index) => (
                <div key={index} className="flex gap-2 items-center group animate-in fade-in duration-100">
                  <select
                    value={row.type}
                    onChange={(e) => updateScopeType(index, e.target.value)}
                    className="bg-black border border-border-subtle rounded-md text-xs px-2 py-2 text-zinc-400 focus:outline-none focus:border-accent-cyan font-mono h-9 w-40"
                  >
                    <option value="Wildcard Domain">*. Wildcard</option>
                    <option value="Single Host">Host / IP</option>
                    <option value="CIDR Network">CIDR Block</option>
                    <option value="Mobile App">Mobile Binary</option>
                    <option value="Source Code">Repository</option>
                  </select>
                  
                  <div className="flex-1">
                    <Input 
                      placeholder="*.api.target.com or 192.168.1.0/24" 
                      value={row.pattern} 
                      onChange={(e) => updateScopePattern(index, e.target.value)}
                      required
                    />
                  </div>

                  {scope.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeScopeRow(index)}
                      className="p-2 border border-border-subtle text-zinc-500 hover:text-danger-rose hover:border-danger-rose/30 bg-zinc-950 rounded-md transition-colors h-9"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
          <Button type="button" variant="secondary" onClick={() => router.push("/targets")}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading} className="px-6">
            Initialize Program Workspace
          </Button>
        </div>
      </form>
    </div>
  );
}