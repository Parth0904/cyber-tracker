export type TimeRange =
  | "week"
  | "month"
  | "year"
  | "all";

export type Priority =
  | "Low"
  | "Medium"
  | "High";

export type Severity =
  | "Low"
  | "Medium"
  | "High"
  | "Critical";

export type FindingStatus =
  | "Draft"
  | "Submitted"
  | "Triaged"
  | "Valid"
  | "Duplicate"
  | "Informative"
  | "Resolved";