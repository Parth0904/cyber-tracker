import Card from "@/app/components/common/Card";
import Stat from "@/app/components/common/Stat";
import { AnalyticsSummary } from "@/lib/types/analytics";

type Props = {
  summary: AnalyticsSummary;
};

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