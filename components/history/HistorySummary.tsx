import { Card } from "@/components/ui/Card";

type Props = {
  trackedDays: number;

  averageScore: number;

  bestScore: number;
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