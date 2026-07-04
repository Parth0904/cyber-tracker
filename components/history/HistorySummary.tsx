import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";

type Props = {
  trackedDays: number;

  averageScore: number;

  bestScore: number;
};

export default function HistorySummary({
  trackedDays,
  averageScore,
  bestScore,
}: Props) {
  return (
    <Card title="History Summary">

      <div className="grid grid-cols-3 gap-6">

        <Stat
          label="Tracked Days"
          value={trackedDays}
        />

        <Stat
          label="Average Score"
          value={averageScore}
        />

        <Stat
          label="Best Score"
          value={bestScore}
        />

      </div>

    </Card>
  );
}