import { one, many, execute } from "@/lib/database";

export type WeeklyReviewRow = {
  id: number;
  year: number;
  week_number: number;
  start_date: string;
  end_date: string;
  report_json: string;
  created_at: string;
};

export async function getWeeklyReview(year: number, week: number): Promise<WeeklyReviewRow | undefined> {
  return await one<WeeklyReviewRow>(
    "SELECT * FROM weekly_reviews WHERE year = ? AND week_number = ?",
    year,
    week
  );
}

export async function saveWeeklyReview(
  year: number,
  week: number,
  startDate: string,
  endDate: string,
  reportJson: string
) {
  return await execute(
    `
      INSERT INTO weekly_reviews (year, week_number, start_date, end_date, report_json)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(year, week_number)
      DO UPDATE SET
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        report_json = excluded.report_json,
        created_at = CURRENT_TIMESTAMP
    `,
    year,
    week,
    startDate,
    endDate,
    reportJson
  );
}

export async function getAllWeeklyReviews(): Promise<WeeklyReviewRow[]> {
  return await many<WeeklyReviewRow>(
    "SELECT * FROM weekly_reviews ORDER BY year DESC, week_number DESC"
  );
}
