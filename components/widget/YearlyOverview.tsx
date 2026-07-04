import Panel from "@/components/ui/Panel";

type Props = {
  yearly: any;
};

export default function YearlyOverview({
  yearly,
}: Props) {

  return (

    <Panel>

      <h2 className="text-xl font-bold">

        Yearly Review

      </h2>

      <div className="mt-6 grid grid-cols-2 gap-6">

        <div>

          <p className="text-slate-500">

            Activities

          </p>

          <p className="text-3xl font-bold">

            {yearly.totalActivities}

          </p>

        </div>

        <div>

          <p className="text-slate-500">

            Findings

          </p>

          <p className="text-3xl font-bold">

            {yearly.findings}

          </p>

        </div>

        <div>

          <p className="text-slate-500">

            Reports

          </p>

          <p className="text-3xl font-bold">

            {yearly.reports}

          </p>

        </div>

        <div>

          <p className="text-slate-500">

            Reward

          </p>

          <p className="text-3xl font-bold">

            ${yearly.reward}

          </p>

        </div>

        <div>

          <p className="text-slate-500">

            Reading

          </p>

          <p className="text-xl font-semibold">

            {yearly.averageReading} min/day

          </p>

        </div>

        <div>

          <p className="text-slate-500">

            Sleep

          </p>

          <p className="text-xl font-semibold">

            {yearly.averageSleep} hrs/day

          </p>

        </div>

      </div>

    </Panel>

  );

}