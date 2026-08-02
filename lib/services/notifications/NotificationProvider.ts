export type ParentReportData = {
  weekNumber: number;
  consistencyState: "Green" | "Amber" | "Red";
  huntingHours: number;
  learningHours: number;
  reportsSubmitted: number;
  validReports: number;
};

export interface NotificationProvider {
  sendReport(
    parentName: string,
    recipient: string, // Email address or Chat ID
    reportData: ParentReportData
  ): Promise<{ success: boolean; error?: string }>;
}
