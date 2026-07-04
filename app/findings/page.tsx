"use client";

import * as React from "react";
import { 
  AlertCircle, Search, Plus, Filter, ShieldAlert, 
  ExternalLink, DollarSign, Calendar, Eye, Edit2, Archive 
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FindingDetailsDrawer } from "@/components/history/FindingDetailsDrawer";

// --- STRICT WORKSPACE COMPONENT ENGINE TYPES ---
export type FindingNode = {
  id: string;
  title: string;
  targetId: string;
  targetName: string;
  platform: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Draft" | "Submitted" | "Valid" | "Duplicate" | "Closed";
  reward?: number;
  cve?: string;
  reportUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  timeline: { action: string; timestamp: string }[];
  references: string[];
};

type MetricsSummary = {
  total: number;
  draft: number;
  submitted: number;
  valid: number;
  duplicate: number;
  totalPayout: number;
};

export default function FindingsPage() {
  // --- STATE LAYER (Starts pristine & binds dynamically) ---
  const [findings, setFindings] = React.useState<FindingNode[]>([]);
  const [metrics, setMetrics] = React.useState<MetricsSummary>({ total: 0, draft: 0, submitted: 0, valid: 0, duplicate: 0, totalPayout: 0 });
  const [search, setSearch] = React.useState("");
  const [severityFilter, setSeverityFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [sortOrder, setSortOrder] = React.useState("newest");
  const [selectedFinding, setSelectedFinding] = React.useState<FindingNode | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function synchronizeFindingsTelemetry() {
      try {
        const res = await fetch("/api/findings");
        if (res.ok) {
          const data = await res.json();
          setFindings(data.items || []);
          if (data.metrics) setMetrics(data.metrics);
        }
      } catch (err) {
        console.error("Findings matrix sync crash:", err);
      } finally {
        setLoading(false);
      }
    }
    synchronizeFindingsTelemetry();
  }, []);

  // Structural sorting/filtering pipelines
  const processedFindings = findings
    .filter(f => {
      const query = search.toLowerCase();
      const matchesSearch = f.title?.toLowerCase().includes(query) || 
                            f.targetName?.toLowerCase().includes(query) || 
                            f.cve?.toLowerCase().includes(query);
      const matchesSeverity = severityFilter === "All" || f.severity === severityFilter;
      const matchesStatus = statusFilter === "All" || f.status === statusFilter;
      return matchesSearch && matchesSeverity && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOrder === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOrder === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOrder === "reward") return (b.reward || 0) - (a.reward || 0);
      if (sortOrder === "severity") {
        const weight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return weight[b.severity] - weight[a.severity];
      }
      return 0;
    });

  const getSeverityVariant = (sev: string) => {
    if (sev === "Critical" || sev === "High") return "danger";
    if (sev === "Medium") return "warning";
    return "neutral";
  };

  const getStatusVariant = (status: string) => {
    if (status === "Valid") return "success";
    if (status === "Submitted") return "cyan";
    return "neutral";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        // MOUNTING_THREAT_REGISTRY_METRIC_FABRICS...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-zinc-200">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-mono flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-accent-cyan" /> Vulnerability & Findings Core
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">Track lifecycle states, disclosures, and bounty reward matrices.</p>
        </div>
        <Button variant="primary" className="h-9 text-xs gap-1.5 self-start sm:self-auto">
          <Plus className="w-3.5 h-3.5" /> Document Finding
        </Button>
      </div>

      {/* 1. JIRA/LINEAR STYLE OVERVIEW METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 font-mono">
        <div className="border border-border-subtle bg-black rounded-lg p-3">
          <span className="block text-[9px] text-zinc-500 uppercase">Total Logged</span>
          <span className="block text-md font-bold text-white mt-1">{metrics.total} Bugs</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3">
          <span className="block text-[9px] text-zinc-500 uppercase">Draft State</span>
          <span className="block text-md font-bold text-zinc-400 mt-1">{metrics.draft} Logs</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3">
          <span className="block text-[9px] text-zinc-500 uppercase">Disclosed</span>
          <span className="block text-md font-bold text-accent-cyan mt-1">{metrics.submitted} Out</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3">
          <span className="block text-[9px] text-zinc-500 uppercase">Accepted Valid</span>
          <span className="block text-md font-bold text-success-emerald mt-1">{metrics.valid} Conf</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3">
          <span className="block text-[9px] text-zinc-500 uppercase">Duplicates</span>
          <span className="block text-md font-bold text-warning-amber mt-1">{metrics.duplicate} Rpt</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3 col-span-2 md:col-span-1">
          <span className="block text-[9px] text-zinc-500 uppercase">Gross Payout</span>
          <span className="block text-md font-bold text-success-emerald mt-1">${metrics.totalPayout.toLocaleString()}</span>
        </div>
      </div>

      {/* 2. INSTANT SEARCH & FILTER COMMAND BAR */}
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-black p-3 border border-border-subtle rounded-lg">
        <div className="w-full lg:w-96">
          <Input 
            placeholder="Filter issues by title, scope target, or CVE vector..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={13} />}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end font-mono">
          <select 
            value={severityFilter} 
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-zinc-950 border border-border-subtle rounded-md text-[11px] px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-accent-cyan"
          >
            <option value="All">SEVERITY: ALL</option>
            <option value="Critical">CRITICAL</option>
            <option value="High">HIGH</option>
            <option value="Medium">MEDIUM</option>
            <option value="Low">LOW</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950 border border-border-subtle rounded-md text-[11px] px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-accent-cyan"
          >
            <option value="All">STATUS: ALL</option>
            <option value="Draft">DRAFT</option>
            <option value="Submitted">SUBMITTED</option>
            <option value="Valid">VALID</option>
            <option value="Duplicate">DUPLICATE</option>
            <option value="Closed">CLOSED</option>
          </select>

          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-zinc-950 border border-border-subtle rounded-md text-[11px] px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-accent-cyan"
          >
            <option value="newest">SORT: NEWEST</option>
            <option value="oldest">SORT: OLDEST</option>
            <option value="reward">SORT: HIGHEST BOUNTY</option>
            <option value="severity">SORT: SEVERITY WEIGHT</option>
          </select>
        </div>
      </div>

      {/* 3. GITHUB ISSUES REPLICATED INTERACTIVE STREAM GRID */}
      <Panel>
        {processedFindings.length === 0 ? (
          <EmptyState 
            title="No Flaws Indexed" 
            description="Your vulnerability inventory database is empty. Register discovered security vulnerabilities to track metrics logs."
          />
        ) : (
          <div className="divide-y divide-border-subtle border border-border-subtle rounded-md overflow-hidden bg-black/40">
            {processedFindings.map(finding => (
              <div 
                key={finding.id}
                className="flex items-center justify-between p-3.5 hover:bg-card/40 transition-colors cursor-pointer group"
                onClick={() => setSelectedFinding(finding)}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="text-zinc-600 shrink-0 mt-0.5 group-hover:text-accent-cyan transition-colors">
                    <AlertCircle size={14} />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-xs font-semibold text-white group-hover:text-accent-cyan transition-colors truncate max-w-xl">
                      {finding.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-zinc-500">
                      <span className="text-zinc-400 font-semibold">{finding.targetName}</span>
                      <span>•</span>
                      <span>Updated {new Date(finding.updatedAt).toLocaleDateString()}</span>
                      {finding.cve && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-600">{finding.cve}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4 font-mono text-xs">
                  <Badge variant={getSeverityVariant(finding.severity)}>{finding.severity}</Badge>
                  <Badge variant={getStatusVariant(finding.status)}>{finding.status}</Badge>
                  <span className={`font-bold min-w-[50px] text-right ${finding.reward ? "text-success-emerald" : "text-zinc-600"}`}>
                    {finding.reward ? `$${finding.reward}` : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* 4. INDUSTRIAL DEEP INSPECTION SIDE DRAWER PANEL */}
      {selectedFinding && (
        <FindingDetailsDrawer 
          finding={selectedFinding} 
          onClose={() => setSelectedFinding(null)} 
        />
      )}

    </div>
  );
}