import { HabitRanking } from "@/lib/types/analytics";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { JSX } from "react/jsx-runtime";

type Props = {
  habits: HabitRanking[];
};

export default function HabitRankingCard({
  habits,
}: Props) {
  const AnyBadge = Badge as unknown as (props: any) => JSX.Element;
  return (
    <Card title="Habit Ranking">

      <div className="space-y-4">

        {habits.map((habit) => (

          <div
            key={habit.habit}
            className="flex items-center justify-between border-b border-slate-800 pb-3"
          >

            <div>

              <p className="font-semibold">
                {habit.habit}
              </p>

              <p className="text-sm text-slate-400">
                Impact +{habit.impact}
              </p>

            </div>

            <div className="flex gap-2">

              <AnyBadge color="cyan">
                {habit.strength}
              </AnyBadge>

              <AnyBadge
                color={
                  habit.confidence === "High"
                    ? "green"
                    : habit.confidence ===
                      "Medium"
                    ? "yellow"
                    : "red"
                }
              >
                {habit.confidence}
              </AnyBadge>

            </div>

          </div>

        ))}

      </div>

    </Card>
  );
}