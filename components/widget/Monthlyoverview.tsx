import Panel from "@/components/ui/Panel";

type Props = {
  monthly: any;
};

export default function MonthlyOverview({
  monthly,
}: Props) {

  return (

    <Panel>

      <h2 className="text-xl font-bold">

        Monthly Review

      </h2>

      <div className="mt-6 space-y-4">

        <div className="flex justify-between">

          <span>Best Habit</span>

          <span className="font-semibold">

            {monthly.bestHabit}

          </span>

        </div>

        <div className="flex justify-between">

          <span>Weakest Habit</span>

          <span className="font-semibold">

            {monthly.weakestHabit}

          </span>

        </div>

        <div className="flex justify-between">

          <span>Reading</span>

          <span>

            {monthly.averageReading} min

          </span>

        </div>

        <div className="flex justify-between">

          <span>Sleep</span>

          <span>

            {monthly.averageSleep} hrs

          </span>

        </div>

        <div className="flex justify-between">

          <span>Findings</span>

          <span>

            {monthly.findings}

          </span>

        </div>

        <div className="flex justify-between">

          <span>Reports</span>

          <span>

            {monthly.reports}

          </span>

        </div>

      </div>

    </Panel>

  );

}