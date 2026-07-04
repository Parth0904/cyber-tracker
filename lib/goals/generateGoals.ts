import { ActivityRow, DailyEntry } from "@/lib/types";
import { DailyGoals, defaultGoals } from "./defaultGoals";
import { GoalProgress } from "./types";
import { calculateGoalProgress } from "./calculateGoalProgress";

export function generateGoals(
  activities: ActivityRow[],
  daily: DailyEntry,
  goals: DailyGoals = defaultGoals
): GoalProgress[] {

  const learning =
    activities.filter(
      (a) => a.type === "learning"
    ).length;

  const recon =
    activities.filter(
      (a) => a.type === "recon"
    ).length;

  const target =
    activities.filter(
      (a) => a.type === "target"
    ).length;

  const finding =
    activities.filter(
      (a) => a.type === "finding"
    ).length;

  const report =
    activities.filter(
      (a) => a.type === "bug_report"
    ).length;

  return [

    calculateGoalProgress(
      "Learning",
      learning,
      goals.learning
    ),

    calculateGoalProgress(
      "Recon",
      recon,
      goals.recon
    ),

    calculateGoalProgress(
      "Targets",
      target,
      goals.target
    ),

    calculateGoalProgress(
      "Findings",
      finding,
      goals.finding
    ),

    calculateGoalProgress(
      "Reports",
      report,
      goals.bug_report
    ),

    calculateGoalProgress(
      "Reading",
      daily.reading,
      goals.reading
    ),

    calculateGoalProgress(
      "Sleep",
      daily.sleep_hours,
      goals.sleep
    ),

    calculateGoalProgress(
      "Steps",
      daily.steps,
      goals.steps
    ),

  ];

}