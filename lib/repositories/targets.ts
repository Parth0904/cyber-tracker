import {
  one,
  many,
  execute,
} from "@/lib/database";

import { Target } from "@/lib/targets/index";

export async function getAllTargets(): Promise<Target[]> {
  return await many<Target>(
    `
      SELECT *
      FROM targets
      WHERE archived = 0
      ORDER BY started_at DESC
    `
  );
}

export async function getTarget(
  id: number
): Promise<Target | undefined> {
  return await one<Target>(
    `
      SELECT *
      FROM targets
      WHERE id = ?
    `,
    id
  );
}

export async function createTarget(
  target: Omit<Target, "id">
) {
  const platform = target.platform ?? "General";
  const url = target.url ?? "";
  const status = target.status ?? "Active";
  const priority = target.priority ?? "Medium";
  const started_at = target.started_at ?? new Date().toISOString();
  const last_activity = target.last_activity ?? new Date().toISOString();
  const notes = target.notes ?? "";

  return await execute(
    `
      INSERT INTO targets (
        name,
        platform,
        url,
        status,
        priority,
        started_at,
        last_activity,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    target.name,
    platform,
    url,
    status,
    priority,
    started_at,
    last_activity,
    notes
  );
}

export async function updateTarget(
  id: number,
  target: Omit<Target, "id">
) {
  return await execute(
    `
      UPDATE targets
      SET
        name = ?,
        platform = ?,
        url = ?,
        status = ?,
        priority = ?,
        started_at = ?,
        last_activity = ?,
        notes = ?,
        category = ?,
        scope_url = ?,
        program_url = ?,
        created_by = ?,
        archived = ?
      WHERE id = ?
    `,
    target.name,
    target.platform ?? "General",
    target.url ?? null,
    target.status ?? "Recon",
    target.priority ?? "P2",
    target.started_at ?? new Date().toISOString(),
    target.last_activity ?? null,
    target.notes ?? "",
    target.category ?? null,
    target.scope_url ?? null,
    target.program_url ?? null,
    target.created_by ?? null,
    target.archived ?? 0,
    id
  );
}

export async function deleteTarget(
  id: number
) {
  await execute(
    `
      DELETE FROM target_findings
      WHERE target_id = ?
    `,
    id
  );

  await execute(
    `
      DELETE FROM target_sessions
      WHERE target_id = ?
    `,
    id
  );

  return await execute(
    `
      DELETE
      FROM targets
      WHERE id = ?
    `,
    id
  );
}

export async function archiveTarget(
  id: number
) {
  return await execute(
    `
      UPDATE targets
      SET archived = 1
      WHERE id = ?
    `,
    id
  );
}

export async function restoreTarget(
  id: number
) {
  return await execute(
    `
      UPDATE targets
      SET archived = 0
      WHERE id = ?
    `,
    id
  );
}

export async function getAllTargetsWithArchived(): Promise<Target[]> {
  return await many<Target>(
    `
      SELECT *
      FROM targets
      ORDER BY started_at DESC
    `
  );
}