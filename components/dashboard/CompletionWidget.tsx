import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";

type Props = {
  percent: number;
  missing: string[];
};

export default function CompletionCard({
  percent,
  missing,
}: Props) {
  return (
    <Card title="Daily Completion">

      <div className="space-y-6">

        <div>

          <div className="text-5xl font-black text-cyan-400">
            {percent}%
          </div>

          <p className="mt-2 text-slate-400">
            Complete your daily habits to improve insight quality.
          </p>

        </div>

        <Progress
          value={percent}
          max={100}
        />

        <div>

          <p className="mb-3 text-xs uppercase tracking-widest text-slate-500">
            Remaining
          </p>

          <div className="flex flex-wrap gap-2">

            {missing.length === 0 ? (

              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">

                Everything completed

              </span>

            ) : (

              missing.map((item) => (

                <span
                  key={item}
                  className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300"
                >
                  {item}
                </span>

              ))

            )}

          </div>

        </div>

      </div>

    </Card>
  );
}