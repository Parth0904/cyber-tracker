import {
  one,
  many,
  execute,
} from "@/lib/database";
import { invalidateConsistencyCache, invalidateDiagnosticsCache } from "@/lib/services/cache";

export type TargetSession = {
  id: number;
  target_id: number;
  type: string;
  description: string | null;
  started_at: string;
  ended_at: string | null;
  duration: number;
  last_active_at?: string | null;
};

export type TargetSessionWithTarget =
  TargetSession & {
    target: string;
  };

export async function getSessions(
  targetId: number
): Promise<TargetSession[]> {
  return await many<TargetSession>(
    `
      SELECT *
      FROM target_sessions
      WHERE target_id = ?
      ORDER BY started_at DESC
    `,
    targetId
  );
}

export async function getActiveSession(
  targetId: number
): Promise<TargetSession | undefined> {
  return await one<TargetSession>(
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

export async function createSession(
  targetId: number,
  type: string,
  description: string = ""
) {
  const now = new Date().toISOString();

  const result = await execute(
    `
      INSERT INTO target_sessions (
        target_id,
        type,
        description,
        started_at,
        last_active_at
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    targetId,
    type,
    description,
    now,
    now
  );
  invalidateConsistencyCache();
  invalidateDiagnosticsCache();
  return result;
}

export async function finishSession(
  id: number,
  endedAt: string,
  duration: number
) {
  const result = await execute(
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
  invalidateConsistencyCache();
  invalidateDiagnosticsCache();
  return result;
}

export async function getAllSessions(): Promise<TargetSessionWithTarget[]> {
  return await many<TargetSessionWithTarget>(
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

export async function getCurrentSession(): Promise<TargetSession | undefined> {
  return await one<TargetSession>(
    `
      SELECT *
      FROM target_sessions
      WHERE ended_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
    `
  );
}

export async function getCurrentSessionWithTarget(): Promise<TargetSessionWithTarget | undefined> {
  return await one<TargetSessionWithTarget>(
    `
      SELECT
        target_sessions.*,
        targets.name AS target
      FROM target_sessions
      LEFT JOIN targets
        ON targets.id = target_sessions.target_id
      WHERE target_sessions.ended_at IS NULL
      ORDER BY target_sessions.started_at DESC
      LIMIT 1
    `
  );
}

export async function terminateSession(
  id: number
) {
  const ended = new Date().toISOString();

  const session = await one<TargetSession>(
    `
      SELECT *
      FROM target_sessions
      WHERE id = ?
    `,
    id
  );

  if (!session) return;

  const duration = Math.round(
    (new Date(ended).getTime() - new Date(session.started_at).getTime()) / 60000
  );

  const result = await execute(
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
  invalidateConsistencyCache();
  invalidateDiagnosticsCache();
  return result;
}

export async function getSession(id: number): Promise<TargetSession | undefined> {
  return await one<TargetSession>(
    `
      SELECT *
      FROM target_sessions
      WHERE id = ?
    `,
    id
  );
}

export async function touchSession(id: number) {
  return await execute(
    `
      UPDATE target_sessions
      SET last_active_at = ?
      WHERE id = ?
    `,
    new Date().toISOString(),
    id
  );
}

export async function finishSessionAtLastActive(id: number) {
  const session = await getSession(id);
  if (!session) return;

  const endedAt = session.last_active_at || session.started_at;
  const duration = Math.round(
    (new Date(endedAt).getTime() - new Date(session.started_at).getTime()) / 60000
  );

  const result = await execute(
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
  invalidateConsistencyCache();
  invalidateDiagnosticsCache();
  return result;
}

export async function updateSessionTimes(
  id: number,
  startedAt: string,
  endedAt: string
) {
  const duration = Math.round(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000
  );

  const result = await execute(
    `
      UPDATE target_sessions
      SET
        started_at = ?,
        ended_at = ?,
        duration = ?
      WHERE id = ?
    `,
    startedAt,
    endedAt,
    duration,
    id
  );
  invalidateConsistencyCache();
  invalidateDiagnosticsCache();
  return result;
}

export async function getActiveSessionWithAbandonedStatus() {
  const active = await getCurrentSessionWithTarget();
  if (!active) return { active: null, isAbandoned: false };

  const lastActive = active.last_active_at
    ? new Date(active.last_active_at).getTime()
    : new Date(active.started_at).getTime();

  const now = Date.now();
  const diffMinutes = (now - lastActive) / 60000;

  // Abandoned threshold: > 15 minutes of inactivity
  const isAbandoned = diffMinutes > 15;

  if (!isAbandoned) {
    await touchSession(active.id);
  }

  return { active, isAbandoned };
}