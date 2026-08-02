import { one, many, execute } from "@/lib/database";

export type ParentReportConfig = {
  id: number;
  enabled: number;
  parent_name: string;
  delivery_method: string;
  delivery_time: string;
  time_zone: string;
  email_address: string;
  telegram_chat_id: string;
};

export type ParentReportLog = {
  id: number;
  year: number;
  week_number: number;
  sent_at: string | null;
  status: "Pending" | "Sent" | "Failed";
  attempts: number;
  last_attempt_at: string | null;
  error_message: string | null;
};

export async function getParentReportConfig(): Promise<ParentReportConfig> {
  const config = await one<ParentReportConfig>(
    "SELECT * FROM parent_report_config WHERE id = 1"
  );

  if (config) return config;

  // Return default fallbacks
  return {
    id: 1,
    enabled: 0,
    parent_name: "",
    delivery_method: "Email",
    delivery_time: "20:00",
    time_zone: "UTC",
    email_address: "",
    telegram_chat_id: "",
  };
}

export async function saveParentReportConfig(config: Omit<ParentReportConfig, "id">) {
  return await execute(
    `
      INSERT INTO parent_report_config (
        id, enabled, parent_name, delivery_method, delivery_time, time_zone, email_address, telegram_chat_id
      )
      VALUES (1, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id)
      DO UPDATE SET
        enabled = excluded.enabled,
        parent_name = excluded.parent_name,
        delivery_method = excluded.delivery_method,
        delivery_time = excluded.delivery_time,
        time_zone = excluded.time_zone,
        email_address = excluded.email_address,
        telegram_chat_id = excluded.telegram_chat_id
    `,
    config.enabled ? 1 : 0,
    config.parent_name || "",
    config.delivery_method || "Email",
    config.delivery_time || "20:00",
    config.time_zone || "UTC",
    config.email_address || "",
    config.telegram_chat_id || ""
  );
}

export async function getPendingReportLogs(): Promise<ParentReportLog[]> {
  return await many<ParentReportLog>(
    `
      SELECT *
      FROM parent_report_log
      WHERE status IN ('Pending', 'Failed')
      AND attempts < 5
      ORDER BY year ASC, week_number ASC
    `
  );
}

export async function getReportLog(year: number, week: number): Promise<ParentReportLog | undefined> {
  return await one<ParentReportLog>(
    "SELECT * FROM parent_report_log WHERE year = ? AND week_number = ?",
    year,
    week
  );
}

export async function createReportLog(year: number, week: number): Promise<void> {
  await execute(
    `
      INSERT INTO parent_report_log (year, week_number, status, attempts)
      VALUES (?, ?, 'Pending', 0)
      ON CONFLICT(year, week_number) DO NOTHING
    `,
    year,
    week
  );
}

export async function updateReportLog(
  id: number,
  status: "Pending" | "Sent" | "Failed",
  errorMessage: string | null = null
): Promise<void> {
  const now = new Date().toISOString();
  await execute(
    `
      UPDATE parent_report_log
      SET
        status = ?,
        attempts = attempts + 1,
        last_attempt_at = ?,
        error_message = ?,
        sent_at = CASE WHEN ? = 'Sent' THEN ? ELSE sent_at END
      WHERE id = ?
    `,
    status,
    now,
    errorMessage,
    status,
    now,
    id
  );
}
