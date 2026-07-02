import { ActivityRow } from "@/lib/types";

import {
  ActivityDistribution,
} from "@/lib/types/analytics";

export function generateActivityDistribution(
  activities: ActivityRow[]
): ActivityDistribution {

  const distribution: ActivityDistribution = {
    learning: 0,
    bug_report: 0,
    recon: 0,
    target: 0,
    finding: 0,
  };

  activities.forEach((activity) => {
    distribution[activity.type] +=
      activity.count;
  });

  return distribution;
}