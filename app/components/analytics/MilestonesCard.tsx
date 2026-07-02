import Card from "@/app/components/common/Card";
import ProgressBar from "@/app/components/common/ProgressBar";
import { Milestone } from "@/lib/types/analytics";

type Props = {
  milestones: Milestone[];
};

export default function MilestonesCard({
  milestones,
}: Props) {
  return (
    <Card title="Milestones">

      <div className="space-y-6">

        {milestones.map((milestone) => (

          <div key={milestone.title}>

            <div className="flex justify-between mb-2">

              <span>
                {milestone.title}
              </span>

              <span>

                {milestone.completed
                  ? "✓"
                  : `${milestone.progress}/${milestone.goal}`}

              </span>

            </div>

            <ProgressBar
              value={milestone.progress}
              max={milestone.goal}
            />

          </div>

        ))}

      </div>

    </Card>
  );
}