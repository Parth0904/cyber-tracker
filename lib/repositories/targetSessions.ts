import db, {
  one,
  many,
  execute,
} from "@/lib/database";

export type TargetSession = {
  id: number;
  target_id: number;
  type: "Recon" | "Testing" | "Reporting";
  description: string | null;
  started_at: string;
  ended_at: string | null;
  duration: number;
};

export function getSessions(
  targetId: number
): TargetSession[] {

  return many<TargetSession>(
    `
      SELECT *
      FROM target_sessions
      WHERE target_id = ?
      ORDER BY started_at DESC
    `,
    targetId
  );

}

export function getActiveSession(
  targetId: number
): TargetSession | undefined {

  return one<TargetSession>(
    `
      SELECT *
      FROM target_sessions
      WHERE target_id = ?
      AND ended_at IS NULL
      LIMIT 1
    `,
    targetId
  );

}

export function createSession(
  targetId: number,
  type: TargetSession["type"],
  description: string = ""
) {

  return execute(
    `
      INSERT INTO target_sessions (

        target_id,

        type,

        description,

        started_at

      )

      VALUES (?, ?, ?, ?)
    `,
    targetId,
    type,
    description,
    new Date().toISOString()
  );

}

export function finishSession(
  id: number,
  endedAt: string,
  duration: number
) {

  return execute(
    `
      UPDATE target_sessions

      SET

        ended_at = ?,

        duration = ?

      WHERE id = ?
    `,
    endedAt,
    duration,
    id
  );

}

export function getAllSessions(): TargetSessionWithTarget[] {

  return many<TargetSessionWithTarget>(
    `
      SELECT
        target_sessions.*,
        targets.name AS target
      FROM target_sessions
      LEFT JOIN targets
        ON targets.id = target_sessions.target_id
      ORDER BY started_at DESC
    `
  );

}

export type TargetSessionWithTarget =
  TargetSession & {
    target: string;
  };

export function getCurrentSession() {

  return one<TargetSession>(
    `
      SELECT *
      FROM target_sessions
      WHERE ended_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
    `
  );

}

export function terminateSession(
  id: number
) {

  const ended =
    new Date().toISOString();

  const session =
    one<TargetSession>(
      `
        SELECT *
        FROM target_sessions
        WHERE id = ?
      `,
      id
    );

  if (!session) return;

  const duration =
    Math.round(
      (
        new Date(ended).getTime() -
        new Date(session.started_at).getTime()
      ) / 60000
    );

  return execute(
    `
      UPDATE target_sessions

      SET

        ended_at = ?,

        duration = ?

      WHERE id = ?
    `,
    ended,
    duration,
    id
  );

}