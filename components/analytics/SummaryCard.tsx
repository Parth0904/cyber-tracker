import { AnalyticsSummary } from "@/lib/types/analytics";
import { Card } from "@/components/ui/Card";

type Props = {
  summary: AnalyticsSummary;
};

type StatProps = {
  label: string;
  value: string | number;
};

function Stat({ label, value }: StatProps) {
  return (
    <div className="p-4 border border-zinc-800/80 rounded-lg bg-zinc-950/40">
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block">{label}</span>
      <span className="text-xl font-bold text-white mt-1 block">{value}</span>
    </div>
  );
}

export default function SummaryCard({
  summary,
}: Props) {
  return (
    <Card title="Performance Summary">

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">

        <Stat
          label="Average Score"
          value={summary.averageScore}
        />

        <Stat
          label="Highest Score"
          value={summary.highestScore}
        />

        <Stat
          label="Completion"
          value={`${summary.completionRate}%`}
        />

        <Stat
          label="Consistency"
          value={`${summary.consistency}%`}
        />

        <Stat
          label="Best Day"
          value={summary.bestDay || "-"}
        />

        <Stat
          label="Tracked Days"
          value={summary.totalDays}
        />

      </div>

    </Card>
  );
}