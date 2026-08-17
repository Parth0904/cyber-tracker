import "dotenv/config";
import { generateWeeklyReviewReport } from "./lib/services/weeklyReview";

async function main() {
  console.log("Generating report...");
  const report = await generateWeeklyReviewReport(2026, 33);
  console.log("Report JSON executiveSummary:", report.executiveSummary);
}

main();
