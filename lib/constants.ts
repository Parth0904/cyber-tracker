export const ACTIVITY_TYPES = [
  "learning",
  "bug_report",
  "recon",
  "target",
  "finding",
] as const;

export type ActivityType =
  typeof ACTIVITY_TYPES[number];