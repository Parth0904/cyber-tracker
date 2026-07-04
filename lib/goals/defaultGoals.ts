export type DailyGoals = {
  learning: number;
  recon: number;
  target: number;
  finding: number;
  bug_report: number;

  reading: number;
  sleep: number;
  steps: number;
};

export const defaultGoals: DailyGoals = {
  learning: 3,
  recon: 2,
  target: 1,
  finding: 1,
  bug_report: 1,

  reading: 45,
  sleep: 8,
  steps: 8000,
};