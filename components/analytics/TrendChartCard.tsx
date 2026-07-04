import { Card } from "@/components/ui/Card";
import ScoreLineChart from "@/components/charts/LineChart";

import { ScorePoint } from "@/lib/types/analytics";

type Props = {
  trend: ScorePoint[];
};

export default function TrendChartCard({
  trend,
}: Props) {
  const chartData = trend.map((p) => ({
    label: p.date,
    value: p.score,
  }));

  return (
    <Card title="Productivity Trend">
      <ScoreLineChart
        data={chartData}
      />
    </Card>
  );
}