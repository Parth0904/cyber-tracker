import Heatmap from "@/components/charts/Heatmap";
import { Card } from "@/components/ui/Card";

type Props = {
  heatmap: {
    date: string;
    count: number;
  }[];
};

export default function HeatmapCard({ heatmap }: Props) {
  return (
    <Card title="Activity Heatmap">
      {/* Changed 'values' to 'nodes' to match the Heatmap component's props */}
      <Heatmap nodes={heatmap} />
    </Card>
  );
}