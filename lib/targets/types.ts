export type TargetStatus =
  | "Recon"
  | "Testing"
  | "Reporting"
  | "Paused"
  | "Completed";

export type TargetPriority =
  | "Low"
  | "Medium"
  | "High"
  | "Critical";

export type Target = {
  id: number;

  name: string;

  platform: string;

  url: string | null;

  status: TargetStatus;

  priority: TargetPriority;

  started_at: string;

  last_activity: string | null;

  notes: string;

  category: string | null;

  scope_url: string | null;

  program_url: string | null;

  created_by: string | null;

  archived: number;
};