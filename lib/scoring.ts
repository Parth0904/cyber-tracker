export const ACTIVITY_WEIGHTS = {
  learning: 1,
  bug_report: 1,
  recon: 1,
  target: 2,
  finding: 10,
} as const;

import { ActivityType } from "./constants";

export type Activity = {
  type: ActivityType;
  count: number;
};

export function calculateDailyScore(
  activities: Activity[]
) {
  return activities.reduce(
    (score, activity) =>
      score +
      ACTIVITY_WEIGHTS[activity.type] *
        activity.count,
    0
  );
}

export function getActivityBreakdown(
  activities: Activity[]
) {
  return activities.map((activity) => ({
    ...activity,
    weight: ACTIVITY_WEIGHTS[activity.type],
    contribution:
      ACTIVITY_WEIGHTS[activity.type] *
      activity.count,
  }));
}

export function buildDailyScoreMap(
  activities: {
    date: string;
    type: ActivityType;
    count: number;
  }[]
) {
  const scores: Record<string, number> = {};

  activities.forEach((activity) => {
    if (!scores[activity.date]) {
      scores[activity.date] = 0;
    }

    scores[activity.date] +=
      ACTIVITY_WEIGHTS[activity.type] *
      activity.count;
  });

  return scores;
}

export function calculateAverageDailyScore(
  activities: {
    date: string;
    type: ActivityType;
    count: number;
  }[]
) {
  const dates = [
    ...new Set(
      activities.map((activity) => activity.date)
    ),
  ];

  const scores = dates.map((date) => {

    const dailyActivities = activities
      .filter((activity) => activity.date === date)
      .map((activity) => ({
        type: activity.type,
        count: activity.count,
      }));

    return calculateDailyScore(
      dailyActivities
    );
  });

  if (scores.length === 0) {
    return 0;
  }

  return (
    scores.reduce(
      (total, score) => total + score,
      0
    ) / scores.length
  );
}
