"use client";

import * as React from "react";
import { FileText, BarChart3, TrendingUp, Award, Lightbulb, Download } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import LineChart from "@/components/charts/LineChart";

type ReportNode = {
  id: string;
  targetName: string;
  findingTitle: string;
  status: "Resolved" | "Triaged" | "Pending" | "Duplicate" | "Informative";
  severity: "Critical" | "High" | "Medium" | "Low";
  reward: number;
  submittedAt: string;
  resolutionText: string;
};

type MetricAggregate = {
  totalSubmitted: number;
  validCount: number;
  duplicateCount: number;
  informativeCount: number;
  grossBounty: number;
  averageBounty: number;
  successRate: number;
};

type ReportWorkspaceTelemetry = {
  metrics: MetricAggregate;
  timeline: ReportNode[];
  achievements: { title: string; desc: string; date: string }[];
  insights: string[];
  chartData: { label: string; value: number }[];
};

export default function ReportsCenterPage() {
  const [data, setData] = React.useState<ReportWorkspaceTelemetry | null>(null);
  const [timeframeTab, setTimeframeTab] = React.useState<"weekly" | "monthly" | "yearly">("monthly");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function syncReportsTelemetryCenter() {
      try {
        const res = await fetch(`/api/reports?timeframe=${timeframeTab}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Reports intelligence syncing fault:", err);
      } finally {
        setLoading(false);
      }
    }
    syncReportsTelemetryCenter();
  }, [timeframeTab]);

  const handleExportData = async () => {
    try {
      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeframe: timeframeTab })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cyber-tracker-report-${timeframeTab}.csv`;
        a.click();
      }
    } catch (err) {
      console.error("Report spreadsheet stream compilation failed:", err);
    }
  };

  const getSeverityVariant = (sev: string) => {
    if (sev === "Critical" || sev === "High") return "danger";
    if (sev === "Medium") return "warning";
    return "neutral";
  };

  const getStatusVariant = (status: string) => {
    if (status === "Resolved" || status === "Triaged") return "success";
    if (status === "Pending") return "cyan";
    return "neutral";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        // DEPLOYING_ANALYTICS_INTELLIGENCE_FABRICS...
      </div>
    );
  }

  const metrics = data?.metrics || { totalSubmitted: 0, validCount: 0, duplicateCount: 0, informativeCount: 0, grossBounty: 0, averageBounty: 0, successRate: 0 };
  const timeline = data?.timeline || [];
  const achievements = data?.achievements || [];
  const insights = data?.insights || [];
  const chartData = data?.chartData || [];

  if (!data || timeline.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <EmptyState 
          title="Operational Reports System Uninitialized" 
          description="Your disclosure log profile is blank. Deploy your first audited target vulnerability to fire your career analytics engine."
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-zinc-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-mono flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent-cyan" /> Executive Intelligence Command Center
          </h1>
        </div>

        <div className="flex items-center bg-black border border-border-subtle p-1 rounded-md self-start md:self-auto font-mono text-[10px]">
          {(["weekly", "monthly", "yearly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframeTab(t)}
              className={`px-3 py-1 uppercase font-medium rounded transition-all ${timeframeTab === t ? "bg-white text-black font-bold" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              {t} PROFILE
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 font-mono">
        <div className="border border-border-subtle bg-black rounded-lg p-3.5">
          <span className="block text-[9px] text-zinc-500 uppercase">Gross Submissions</span>
          <span className="block text-lg font-bold text-white mt-1">{metrics.totalSubmitted}</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3.5">
          <span className="block text-[9px] text-zinc-500 uppercase">Valid Coverage</span>
          <span className="block text-lg font-bold text-success-emerald mt-1">{metrics.validCount} Conf</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3.5">
          <span className="block text-[9px] text-zinc-500 uppercase">Signals Resolution</span>
          <span className="block text-lg font-bold text-white mt-1">{metrics.successRate}%</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3.5">
          <span className="block text-[9px] text-zinc-500 uppercase">Total Rewards</span>
          <span className="block text-lg font-bold text-success-emerald mt-1">${metrics.grossBounty.toLocaleString()}</span>
        </div>
        <div className="border border-border-subtle bg-black rounded-lg p-3.5 text-zinc-300">
          <span className="block text-[9px] text-zinc-500 uppercase">Average Payout</span>
          <span className="block text-lg font-bold text-accent-cyan mt-1">${metrics.averageBounty.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Panel>
            <div className="mb-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <BarChart3 size={13} className="text-accent-cyan" /> Payout & Yield Trend Velocity
              </h3>
            </div>
            {chartData.length >= 2 ? (
              <LineChart data={chartData} height={180} />
            ) : (
              <div className="text-center py-8 font-mono text-[10px] text-zinc-600">// CORE_VELOCITY_DATA_INSUFFICIENT</div>
            )}
          </Panel>

          <Panel>
            <div className="mb-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <TrendingUp size={13} /> Continuous Disclosure History Stream
              </h3>
            </div>
            <div className="space-y-3">
              {timeline.map((report) => (
                <div key={report.id} className="border border-border-subtle bg-black p-4 rounded-md flex flex-col sm:flex-row justify-between sm:items-center gap-3 font-mono text-xs">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold truncate max-w-[140px]">{report.targetName}</span>
                      <span className="text-zinc-600">//</span>
                      <span className="text-zinc-400 truncate max-w-[200px]">{report.findingTitle}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <Badge variant={getSeverityVariant(report.severity)}>{report.severity}</Badge>
                    <Badge variant={getStatusVariant(report.status)}>{report.status}</Badge>
                    <span className="text-success-emerald font-bold font-mono text-xs">${report.reward}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Panel>
            <div className="mb-3 border-b border-border-subtle pb-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Lightbulb size={13} className="text-warning-amber" /> Habit Correlation Recommendations
              </h3>
            </div>
            <ul className="space-y-3">
              {insights.map((insight, idx) => (
                <li key={idx} className="text-xs text-zinc-300 leading-relaxed flex items-start gap-2 bg-zinc-950 p-2.5 rounded border border-border-subtle/50">
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <div className="mb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Download size={13} /> Data & Audits Export Engine
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
              <Button variant="secondary" className="h-8 gap-1" onClick={() => window.print()}>
                PRINT SUMMARY
              </Button>
              <Button variant="secondary" className="h-8 gap-1" onClick={handleExportData}>
                EXPORT TO CSV
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}