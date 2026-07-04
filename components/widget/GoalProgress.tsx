import Panel from "@/components/ui/Panel";
import ProgressBar from "@/components/ui/ProgressBar";

import { GoalProgress } from "@/lib/goals";

type Props = {
  goals: GoalProgress[];
};

export default function GoalsProgress({
  goals,
}: Props) {
  return (
    <Panel>

      <h2 className="text-xl font-bold">

        Today's Goals

      </h2>

      <div className="mt-6 space-y-6">

        {goals.map((goal) => (

          <div key={goal.title}>

            <div className="mb-2 flex justify-between">

              <span>

                {goal.title}

              </span>

              <span className="text-slate-400">

                {goal.current}/{goal.target}

              </span>

            </div>

            <ProgressBar
              value={goal.percentage}
              max={100}
            />

          </div>

        ))}

      </div>

    </Panel>
  );
}