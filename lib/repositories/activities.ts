import { many, execute } from "@/lib/database";
import { ActivityRow } from "@/lib/types";
import { TimeRange } from "@/lib/types/analytics";
import { ActivityType } from "@/lib/constants";

export async function getTodayActivities(
  date: string
): Promise<ActivityRow[]> {
  const all = await getAllActivities();
  return all.filter(a => a.date === date);
}

export async function getAllActivities(): Promise<ActivityRow[]> {
  const [
    dbActivities,
    targetSessions,
    learningSessions,
    targetFindings
  ] = await Promise.all([
    many<{ date: string; type: string }>("SELECT date, type FROM activities"),
    many<{ started_at: string; type: string }>("SELECT started_at, type FROM target_sessions WHERE ended_at IS NOT NULL"),
    many<{ started_at: string }>("SELECT started_at FROM learning_sessions WHERE ended_at IS NOT NULL"),
    many<{ submitted_at: string }>("SELECT submitted_at FROM target_findings")
  ]);

  const merged: ActivityRow[] = [];

  for (const act of dbActivities) {
    let mappedType = act.type;
    if (mappedType === "session_start") mappedType = "recon";
    else if (mappedType === "target_check") mappedType = "target";
    else if (mappedType === "finding_log") mappedType = "finding";

    merged.push({
      date: act.date,
      type: mappedType as ActivityType,
      count: 1,
    });
  }

  for (const session of targetSessions) {
    if (!session.started_at) continue;
    const date = session.started_at.split("T")[0];
    const type = session.type === "Recon" ? "recon" : "target";
    merged.push({
      date,
      type,
      count: 1,
    });
  }

  for (const session of learningSessions) {
    if (!session.started_at) continue;
    const date = session.started_at.split("T")[0];
    merged.push({
      date,
      type: "learning",
      count: 1,
    });
  }

  for (const finding of targetFindings) {
    if (!finding.submitted_at) continue;
    const date = finding.submitted_at.split("T")[0];
    merged.push({
      date,
      type: "finding",
      count: 1,
    });
  }

  return merged;
}

export async function getActivities(
  range: TimeRange
): Promise<ActivityRow[]> {
  if (range === "all") {
    return await getAllActivities();
  }

  const days = {
    week: 7,
    month: 30,
    year: 365,
  }[range];

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - days);
  const thresholdDateStr = thresholdDate.toISOString().split("T")[0];

  const all = await getAllActivities();
  return all.filter(a => a.date >= thresholdDateStr).sort((a, b) => a.date.localeCompare(b.date));
}

export async function incrementActivity(
  date: string,
  type: string
): Promise<void> {
  let mappedType = type;
  if (mappedType === "session_start") mappedType = "recon";
  else if (mappedType === "target_check") mappedType = "target";
  else if (mappedType === "finding_log") mappedType = "finding";

  await execute(
    `
      INSERT INTO activities (date, type)
      VALUES (?, ?)
    `,
    date,
    mappedType
  );
}