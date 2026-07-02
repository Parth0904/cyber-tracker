import { ActivityRow } from "@/lib/types";
import { Milestone } from "@/lib/types/analytics";

export function generateMilestones(
  activities: ActivityRow[]
): Milestone[] {

  const totals = {
    learning: 0,
    bug_report: 0,
    recon: 0,
    target: 0,
    finding: 0,
  };

  activities.forEach((activity) => {
    totals[activity.type] +=
      activity.count;
  });

  return [
    {
      title: "100 Learning Sessions",
      progress: totals.learning,
      goal: 100,
      completed:
        totals.learning >= 100,
    },
    {
      title: "100 Recon Sessions",
      progress: totals.recon,
      goal: 100,
      completed:
        totals.recon >= 100,
    },
    {
      title: "50 Targets",
      progress: totals.target,
      goal: 50,
      completed:
        totals.target >= 50,
    },
    {
      title: "10 Findings",
      progress: totals.finding,
      goal: 10,
      completed:
        totals.finding >= 10,
    },
  ];
}