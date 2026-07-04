import {
  one,
  many,
  execute,
} from "@/lib/database";

import { Target } from "@/lib/targets/index";

export function getAllTargets(): Target[] {

  return many<Target>(
    `
      SELECT *
      FROM targets
      WHERE archived = 0
      ORDER BY started_at DESC
    `
  );

}

export function getTarget(
  id: number
): Target | undefined {

  return one<Target>(
    `
      SELECT *
      FROM targets
      WHERE id = ?
    `,
    id
  );

}

export function createTarget(
  target: Omit<Target, "id">
) {

  return execute(
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
    target.platform,
    target.url,
    target.status,
    target.priority,
    target.started_at,
    target.last_activity,
    target.notes
  );

}

export function updateTarget(
  id: number,
  target: Omit<Target, "id">
) {

  return execute(
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

        notes = ?

      WHERE id = ?
    `,
    target.name,
    target.platform,
    target.url,
    target.status,
    target.priority,
    target.started_at,
    target.last_activity,
    target.notes,
    id
  );

}

export function deleteTarget(
  id: number
) {

  return execute(
    `
      DELETE
      FROM targets
      WHERE id = ?
    `,
    id
  );

}

export function archiveTarget(
  id: number
) {

  return execute(
    `
      UPDATE targets
      SET archived = 1
      WHERE id = ?
    `,
    id
  );

}

export function restoreTarget(
  id: number
) {

  return execute(
    `
      UPDATE targets
      SET archived = 0
      WHERE id = ?
    `,
    id
  );

}

export function getAllTargetsWithArchived(): Target[] {
  return many<Target>(
    `
      SELECT *
      FROM targets
      ORDER BY started_at DESC
    `
  );
}