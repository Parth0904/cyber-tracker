import ActivityPieChart from "@/components/charts/PieChart";
import { Card } from "@/components/ui/Card";

import {
  ActivityDistribution,
} from "@/lib/types/analytics";

type Props = {
  distribution: ActivityDistribution;
};

export default function ActivityDistributionCard({
  distribution,
}: Props) {

  const data =
    Object.entries(
      distribution
    ).map(([name, value]) => ({
      name,
      value,
    }));

  return (
    <Card title="Activity Distribution">

      <ActivityPieChart
        data={data}
      />

    </Card>
  );
}