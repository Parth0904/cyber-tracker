import { one } from "@/lib/database/query";

export type TargetStatistics = {
  totalSessions: number;
  totalHours: number;
  totalHuntingHours: number;
  totalFindings: number;
  totalReports: number;
  totalValidReports: number;
  totalReward: number;
};

export async function generateTargetStatistics(
  targetId: number
): Promise<TargetStatistics> {
  const sessions = await one<{
    totalSessions: number;
    totalMinutes: number;
    huntingMinutes: number;
  }>(
    `
      SELECT
        COUNT(*) as "totalSessions",
        COALESCE(SUM(duration),0) as "totalMinutes",
        COALESCE(SUM(CASE WHEN LOWER(type) IN ('hunting', 'recon', 'testing', 'reporting') THEN duration ELSE 0 END), 0) as "huntingMinutes"
      FROM target_sessions
      WHERE target_id = ?
    `,
    targetId
  );

  const findings = await one<{
    totalFindings: number;
    totalReports: number;
    totalValidReports: number;
    totalReward: number;
  }>(
    `
      SELECT
        COUNT(*) as "totalFindings",
        SUM(
          CASE
            WHEN status != 'Draft'
            THEN 1
            ELSE 0
          END
        ) as "totalReports",

        SUM(
          CASE
            WHEN status = 'Valid'
            THEN 1
            ELSE 0
          END
        ) as "totalValidReports",

        COALESCE(SUM(reward),0) as "totalReward"

      FROM target_findings
      WHERE target_id=?
    `,
    targetId
  );

  const s = sessions || { totalSessions: 0, totalMinutes: 0, huntingMinutes: 0 };
  const f = findings || { totalFindings: 0, totalReports: 0, totalValidReports: 0, totalReward: 0 };

  return {
    totalSessions: s.totalSessions ?? 0,
    totalHours: Math.round((s.totalMinutes ?? 0) / 60),
    totalHuntingHours: Math.round(((s.huntingMinutes ?? 0) / 60) * 10) / 10,
    totalFindings: f.totalFindings ?? 0,
    totalReports: f.totalReports ?? 0,
    totalValidReports: f.totalValidReports ?? 0,
    totalReward: f.totalReward ?? 0,
  };
}