import Panel from "@/components/ui/Panel";

import {
  ProductiveHour,
} from "@/lib/analytics";

type Props = {
  data: ProductiveHour[];
};

export default function ProductiveHours({
  data,
}: Props) {

  const max =
    Math.max(
      ...data.map(
        (d) => d.activities
      ),
      1
    );

  return (

    <Panel>

      <h2 className="text-xl font-bold">

        Productive Hours

      </h2>

      <p className="mt-2 text-slate-400">

        Activity frequency throughout the day.

      </p>

      <div className="mt-8 space-y-3">

        {data.map((hour) => (

          <div
            key={hour.hour}
            className="flex items-center gap-4"
          >

            <div className="w-16 text-sm text-slate-400">

              {hour.label}

            </div>

            <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden">

              <div
                className="h-full rounded-full bg-cyan-500"
                style={{
                  width: `${
                    (hour.activities / max) *
                    100
                  }%`,
                }}
              />

            </div>

            <div className="w-10 text-right font-semibold">

              {hour.activities}

            </div>

          </div>

        ))}

      </div>

    </Panel>

  );

}