export type TimeRange =
  | "week"
  | "month"
  | "year"
  | "all";

export type AnalyticsSummary = {
  averageScore: number;

  highestScore: number;

  totalDays: number;

  completionRate: number;

  bestDay: string;

  consistency: number;
};

export type ScorePoint = {
  date: string;

  score: number;
};

export type ActivityDistribution = {
  learning: number;

  bug_report: number;

  recon: number;

  target: number;

  finding: number;
};

export type HabitRanking = {
  habit: string;

  impact: number;

  confidence:
    | "Low"
    | "Medium"
    | "High";

  strength:
    | "Weak"
    | "Moderate"
    | "Strong"
    | "Very Strong";
};

export type PeriodReport = {
  averageScore: number;

  bestScore: number;

  completion: number;

  totalActivities: number;

  bestHabit: string;

  weakestHabit: string;
};

export type Milestone = {
  title: string;

  progress: number;

  goal: number;

  completed: boolean;
};

export type PersonalRecord = {
  title: string;

  value: number | string;
};

export type HeatmapDay = {
  date: string;

  score: number;
};

export type AnalyticsResponse = {
  range: TimeRange;

  summary: AnalyticsSummary;

  scoreTrend: ScorePoint[];

  activityDistribution: ActivityDistribution;

  habitRanking: HabitRanking[];

  weekly?: PeriodReport;

  monthly?: PeriodReport;

  yearly?: PeriodReport;

  milestones: Milestone[];

  personalRecords: PersonalRecord[];

  heatmap: HeatmapDay[];
};