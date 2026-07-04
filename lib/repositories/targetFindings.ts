import {
  one,
  many,
  execute,
} from "@/lib/database";

export type FindingStatus =
  | "Draft"
  | "Submitted"
  | "Triaged"
  | "Valid"
  | "Duplicate"
  | "Informative"
  | "Resolved";

export type Severity =
  | "Low"
  | "Medium"
  | "High"
  | "Critical";

export type TargetFinding = {
  id: number;

  target_id: number;

  title: string;

  type: string;

  severity: Severity;

  status: FindingStatus;

  submitted_at: string;

  reward: number;

  cve: string;

  report_url: string;

  notes: string;
};

export function getFindings(
  targetId: number
): TargetFinding[] {

  return many<TargetFinding>(
    `
      SELECT *
      FROM target_findings
      WHERE target_id = ?
      ORDER BY submitted_at DESC
    `,
    targetId
  );

}

export function getFinding(
  id: number
): TargetFinding | undefined {

  return one<TargetFinding>(
    `
      SELECT *
      FROM target_findings
      WHERE id = ?
    `,
    id
  );

}

export function createFinding(
  finding: Omit<TargetFinding, "id">
) {

  return execute(
    `
      INSERT INTO target_findings (

        target_id,

        title,

        type,

        severity,

        status,

        submitted_at,

        reward,

        cve,

        report_url,

        notes

      )

      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    finding.target_id,
    finding.title,
    finding.type,
    finding.severity,
    finding.status,
    finding.submitted_at,
    finding.reward,
    finding.cve,
    finding.report_url,
    finding.notes
  );

}

export function updateFinding(
  id: number,
  finding: Omit<TargetFinding, "id">
) {

  return execute(
    `
      UPDATE target_findings

      SET

        title = ?,

        type = ?,

        severity = ?,

        status = ?,

        submitted_at = ?,

        reward = ?,

        cve = ?,

        report_url = ?,

        notes = ?

      WHERE id = ?
    `,
    finding.title,
    finding.type,
    finding.severity,
    finding.status,
    finding.submitted_at,
    finding.reward,
    finding.cve,
    finding.report_url,
    finding.notes,
    id
  );

}

export function deleteFinding(
  id: number
) {

  return execute(
    `
      DELETE
      FROM target_findings
      WHERE id = ?
    `,
    id
  );

}

export function getAllFindings(): TargetFinding[] {

  return many<TargetFinding>(
    `
      SELECT *
      FROM target_findings
      ORDER BY submitted_at DESC
    `
  );

}