import { Milestone } from "@/lib/types/analytics";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";

type Props = {
  milestones: Milestone[];
};
export default function MilestonesCard({ milestones }: Props) {
  return (
    <Card title="Milestones">
      <div className="space-y-6">
        {milestones.map((milestone) => {
          // Calculate percentage (0-100)
          const percentage = (milestone.progress / milestone.goal) * 100;

          return (
            <div key={milestone.title}>
              <div className="flex justify-between mb-2">
                <span>{milestone.title}</span>
                <span>
                  {milestone.completed
                    ? "✓"
                    : `${milestone.progress}/${milestone.goal}`}
                </span>
              </div>
              <Progress
                value={percentage} // Pass the calculated 0-100 value
                // Remove the 'max' prop as it's not supported
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}