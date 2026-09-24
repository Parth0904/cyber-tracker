export type MetricComparison = {
  current: number;
  previous: number;
};

export type ParentReportData = {
  weekNumber: number;
  overallStatus: "Excellent Week" | "Good Week" | "Needs Improvement";
  overallStatusColor: "Green" | "Amber" | "Red";
  overallStatusExplanation: string;
  consistencyScore: number;
  productiveDaysCount: number;

  // Weekly Activity Summary
  learningBlocksCompleted: number;
  bugReportStudyBlocks: number;
  reconSessions: number;
  targetsTested: number;
  reportsSubmitted: number;
  validReports: number;

  // Healthy Habits
  workoutDays: number;
  readingBeforeBedDays: number;

  // Narrative Feedback
  progressSummary: string;
  biggestAchievement: string;
  focusNextWeek: string;
};

export interface NotificationProvider {
  sendReport(
    parentName: string,
    recipient: string, // Email address or Chat ID
    reportData: ParentReportData
  ): Promise<{ success: boolean; error?: string }>;
}
