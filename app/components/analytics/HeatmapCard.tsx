import Card from "@/app/components/common/Card";
import { HeatmapDay } from "@/lib/types/analytics";

type Props = {
  heatmap: HeatmapDay[];
};

export default function HeatmapCard({
  heatmap,
}: Props) {
  return (
    <Card title="Activity Heatmap">

      <div className="grid grid-cols-7 gap-2">

        {heatmap.map((day) => (

          <div
            key={day.date}
            className="rounded bg-cyan-500/20 p-2 text-center"
          >

            <div className="text-xs">
              {day.date.slice(-2)}
            </div>

            <div className="font-bold">
              {day.score}
            </div>

          </div>

        ))}

      </div>

    </Card>
  );
}