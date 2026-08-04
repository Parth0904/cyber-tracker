export type MetricComparison = {
  current: number;
  previous: number;
};

export type ParentReportData = {
  weekNumber: number;
  consistencyState: "Green" | "Amber" | "Red";
  consistencyScore: number;
  reportsSubmitted: number;
  validReports: number;
  dailyLogsCompleted: number;

  hunting: MetricComparison;
  learning: MetricComparison;
  reading: MetricComparison;
  workout: MetricComparison;
  sleep: MetricComparison;
  screenTime: MetricComparison;
};

export interface NotificationProvider {
  sendReport(
    parentName: string,
    recipient: string, // Email address or Chat ID
    reportData: ParentReportData
  ): Promise<{ success: boolean; error?: string }>;
}
