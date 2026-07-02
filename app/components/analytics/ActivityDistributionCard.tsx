import Card from "@/app/components/common/Card";
import ProgressBar from "@/app/components/common/ProgressBar";
import { ActivityDistribution } from "@/lib/types/analytics";

type Props = {
  distribution: ActivityDistribution;
};

export default function ActivityDistributionCard({
  distribution,
}: Props) {

  const max = Math.max(
    ...Object.values(distribution),
    1
  );

  return (
    <Card title="Activity Distribution">

      <div className="space-y-5">

        {Object.entries(distribution).map(
          ([name, value]) => (

            <div key={name}>

              <div className="flex justify-between mb-2">

                <span className="capitalize">
                  {name.replace("_", " ")}
                </span>

                <span>{value}</span>

              </div>

              <ProgressBar
                value={value}
                max={max}
              />

            </div>

          )
        )}

      </div>

    </Card>
  );
}