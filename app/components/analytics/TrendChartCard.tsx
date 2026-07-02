import Card from "@/app/components/common/Card";
import { ScorePoint } from "@/lib/types/analytics";

type Props = {
  trend: ScorePoint[];
};

export default function TrendChartCard({
  trend,
}: Props) {
  return (
    <Card title="Score Trend">

      <div className="space-y-3">

        {trend.map((day) => (

          <div
            key={day.date}
            className="flex justify-between border-b border-slate-800 pb-2"
          >

            <span>{day.date}</span>

            <span className="font-bold">
              {day.score}
            </span>

          </div>

        ))}

      </div>

    </Card>
  );
}