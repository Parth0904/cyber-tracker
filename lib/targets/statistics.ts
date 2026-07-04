import db from "@/lib/db";

export type TargetStatistics = {
  totalSessions: number;
  totalHours: number;
  totalFindings: number;
  totalReports: number;
  totalValidReports: number;
  totalReward: number;
};

export function generateTargetStatistics(
  targetId: number
): TargetStatistics {

  const sessions = db.prepare(`
    SELECT
      COUNT(*) as totalSessions,
      COALESCE(SUM(duration),0) as totalMinutes
    FROM target_sessions
    WHERE target_id = ?
  `).get(targetId) as {
    totalSessions: number;
    totalMinutes: number;
  };

  const findings = db.prepare(`
    SELECT
      COUNT(*) as totalFindings,
      SUM(
        CASE
          WHEN status='Submitted'
          THEN 1
          ELSE 0
        END
      ) as totalReports,

      SUM(
        CASE
          WHEN status='Valid'
          THEN 1
          ELSE 0
        END
      ) as totalValidReports,

      COALESCE(SUM(reward),0) as totalReward

    FROM target_findings
    WHERE target_id=?
  `).get(targetId) as any;

  return {

    totalSessions:
      sessions.totalSessions,

    totalHours:
      Math.round(
        sessions.totalMinutes / 60
      ),

    totalFindings:
      findings.totalFindings ?? 0,

    totalReports:
      findings.totalReports ?? 0,

    totalValidReports:
      findings.totalValidReports ?? 0,

    totalReward:
      findings.totalReward ?? 0,

  };

}