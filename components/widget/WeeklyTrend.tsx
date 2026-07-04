import { Panel } from "@/components/ui/Panel";
import ScoreLineChart from "@/components/charts/LineChart";

type Point = {
  date: string;
  score: number;
};

type Props = {
  trend: Point[];
};

export default function WeeklyTrend({
  trend,
}: Props) {
  const chartData = trend.map((p) => ({
    label: p.date,
    value: p.score,
  }));

  return (
    <Panel>

      <div className="mb-6">

        <h2 className="text-xl font-bold">
          Weekly Trend
        </h2>

        <p className="mt-2 text-slate-400">
          Your productivity over the last seven days.
        </p>

      </div>

      <ScoreLineChart data={chartData} />

    </Panel>
  );
}