import { Card } from "@/components/ui/Card";
import ScoreLineChart from "@/components/charts/LineChart";

import { ScorePoint } from "@/lib/types/analytics";

type Props = {
  trend: ScorePoint[];
};

export default function TrendChartCard({
  trend,
}: Props) {
  return (
    <Card title="Productivity Trend">
      <ScoreLineChart
        data={trend}
      />
    </Card>
  );
}