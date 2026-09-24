/**
 * Canonical Date & Period Service
 * 
 * Central source of truth for:
 * - Application canonical timezone (Asia/Kolkata)
 * - Timezone-aware date string formatting (YYYY-MM-DD)
 * - "Today" and "Yesterday" resolution in Asia/Kolkata
 * - ISO Monday-to-Sunday reporting week calculations
 * - Rolling date ranges
 * - Bidirectional <input type="datetime-local"> formatting and parsing
 */

export const APP_TIMEZONE = "Asia/Kolkata";

/**
 * Formats a Date or timestamp string into YYYY-MM-DD in the given timezone (defaults to Asia/Kolkata).
 */
export function formatDateInTimezone(date: Date | string, timezone = APP_TIMEZONE): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(d);
    const yyyy = parts.find((p) => p.type === "year")?.value;
    const mm = parts.find((p) => p.type === "month")?.value;
    const dd = parts.find((p) => p.type === "day")?.value;
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    const d = typeof date === "string" ? new Date(date) : date;
    return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
  }
}

/**
 * Returns today's date string YYYY-MM-DD in Asia/Kolkata.
 */
export function getTodayDateString(timezone = APP_TIMEZONE): string {
  return formatDateInTimezone(new Date(), timezone);
}

/**
 * Returns yesterday's date string YYYY-MM-DD in Asia/Kolkata.
 */
export function getYesterdayDateString(timezone = APP_TIMEZONE): string {
  const todayStr = getTodayDateString(timezone);
  const [y, m, d] = todayStr.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() - 1);
  const yyyy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Computes the ISO 8601 week number and week-year for a timestamp
 * based on its calendar date in the specified timezone (defaults to Asia/Kolkata).
 * 
 * This avoids midnight UTC boundary issues where early Monday morning (00:00 - 05:30 IST)
 * would otherwise be misclassified into the previous week.
 */
export function getISOWeekAndYear(date: Date | string, timezone = APP_TIMEZONE): { week: number; year: number } {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const dateStr = formatDateInTimezone(dateObj, timezone);
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1, d));

  // Monday = 0, Sunday = 6
  const dayNr = (target.getUTCDay() + 6) % 7;

  // Set to nearest Thursday: current date - dayNr + 3
  target.setUTCDate(target.getUTCDate() - dayNr + 3);

  const firstThursday = target.getTime();
  const year = new Date(firstThursday).getUTCFullYear();

  target.setUTCFullYear(year, 0, 4);
  const firstThursdayOfYear = target.getTime();
  const dayNrFirst = (target.getUTCDay() + 6) % 7;
  const mondayW1 = firstThursdayOfYear - dayNrFirst * 24 * 60 * 60 * 1000;

  const week = 1 + Math.round((firstThursday - (mondayW1 + 3 * 24 * 60 * 60 * 1000)) / 604800000);

  return { week, year };
}

/**
 * Returns the ISO week number for a date in Asia/Kolkata.
 */
export function getISOWeekUTC(date: Date | string, timezone = APP_TIMEZONE): number {
  return getISOWeekAndYear(date, timezone).week;
}

/**
 * Returns the ISO week-year for a date in Asia/Kolkata.
 */
export function getISOWeekYearUTC(date: Date | string, timezone = APP_TIMEZONE): number {
  return getISOWeekAndYear(date, timezone).year;
}

/**
 * Converts a local datetime string (YYYY-MM-DDTHH:mm:ss) in a given timezone
 * into the corresponding UTC Date instant.
 */
export function getUtcDateForLocalTime(dateStr: string, timezone = APP_TIMEZONE): Date {
  const parts = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(\.(\d{3}))?$/);
  if (!parts) return new Date(dateStr);

  const y = parseInt(parts[1], 10);
  const m = parseInt(parts[2], 10) - 1;
  const d = parseInt(parts[3], 10);
  const hr = parseInt(parts[4], 10);
  const min = parseInt(parts[5], 10);
  const sec = parts[6] ? parseInt(parts[6], 10) : 0;
  const ms = parts[8] ? parseInt(parts[8], 10) : 0;

  if (timezone === "Asia/Kolkata") {
    // Asia/Kolkata has a constant, fixed UTC offset of +05:30 (no DST)
    const targetUtc = Date.UTC(y, m, d, hr, min, sec, ms);
    return new Date(targetUtc - (5 * 60 + 30) * 60 * 1000);
  }

  const targetUtcTime = Date.UTC(y, m, d, hr, min, sec, ms);
  let testDate = new Date(targetUtcTime);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
    hourCycle: "h23",
  });

  for (let iter = 0; iter < 5; iter++) {
    const formattedParts = formatter.formatToParts(testDate);
    const fy = parseInt(formattedParts.find((p) => p.type === "year")!.value, 10);
    const fm = parseInt(formattedParts.find((p) => p.type === "month")!.value, 10) - 1;
    const fd = parseInt(formattedParts.find((p) => p.type === "day")!.value, 10);
    let fhr = parseInt(formattedParts.find((p) => p.type === "hour")!.value, 10);
    if (fhr === 24) fhr = 0;
    const fmin = parseInt(formattedParts.find((p) => p.type === "minute")!.value, 10);
    const fsec = parseInt(formattedParts.find((p) => p.type === "second")!.value, 10);

    const formattedUtc = Date.UTC(fy, fm, fd, fhr, fmin, fsec, ms);
    const diff = targetUtcTime - formattedUtc;
    if (diff === 0) break;
    testDate = new Date(testDate.getTime() + diff);
  }

  return testDate;
}

export interface ReportingWeek {
  start: Date;
  end: Date;
  startStr: string;
  endStr: string;
  dates: string[];
}

/**
 * Returns Monday-to-Sunday boundaries for a given ISO week and year in Asia/Kolkata.
 */
export function getReportingWeek(year: number, week: number, timezone = APP_TIMEZONE): ReportingWeek {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const mondayOfW1 = new Date(jan4.getTime() + diffToMonday * 24 * 60 * 60 * 1000);

  const monday = new Date(mondayOfW1.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);

  const startStr = monday.toISOString().split("T")[0];
  const endStr = sunday.toISOString().split("T")[0];

  const start = getUtcDateForLocalTime(`${startStr}T00:00:00`, timezone);
  const end = getUtcDateForLocalTime(`${endStr}T23:59:59.999`, timezone);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(d.toISOString().split("T")[0]);
  }

  return { start, end, startStr, endStr, dates };
}

export const getDatesForWeek = getReportingWeek;

/**
 * Returns the Monday start of the week for a given date in Asia/Kolkata.
 */
export function getStartOfIsoWeek(date: Date | string, timezone = APP_TIMEZONE): Date {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const dateStr = formatDateInTimezone(dateObj, timezone);
  const [y, m, d] = dateStr.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const day = utc.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + diffToMonday);

  const mondayStr = `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`;
  return getUtcDateForLocalTime(`${mondayStr}T00:00:00`, timezone);
}

/**
 * Returns a rolling range of N calendar days ending today in Asia/Kolkata.
 */
export function getRollingDateRange(days: number, timezone = APP_TIMEZONE): { startStr: string; endStr: string; dates: string[] } {
  const dates: string[] = [];
  const todayStr = getTodayDateString(timezone);
  const [y, m, d] = todayStr.split("-").map(Number);
  const current = new Date(Date.UTC(y, m - 1, d));

  for (let i = days - 1; i >= 0; i--) {
    const dayDate = new Date(current.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStr = `${dayDate.getUTCFullYear()}-${String(dayDate.getUTCMonth() + 1).padStart(2, "0")}-${String(dayDate.getUTCDate()).padStart(2, "0")}`;
    dates.push(dayStr);
  }

  return {
    startStr: dates[0],
    endStr: dates[dates.length - 1],
    dates,
  };
}

export interface MonthRange {
  startStr: string;
  endStr: string;
  daysInMonth: number;
  dates: string[];
}

/**
 * Returns the calendar month range for today (or a specified date) in Asia/Kolkata.
 */
export function getCurrentMonthRange(date?: Date | string, timezone = APP_TIMEZONE): MonthRange {
  const baseDateStr = date ? formatDateInTimezone(date, timezone) : getTodayDateString(timezone);
  const [y, m] = baseDateStr.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const startStr = `${y}-${String(m).padStart(2, "0")}-01`;
  const endStr = `${y}-${String(m).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const dates: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }

  return { startStr, endStr, daysInMonth, dates };
}

/**
 * Formats a timestamp into YYYY-MM-DDTHH:mm representation in Asia/Kolkata
 * suitable for <input type="datetime-local"> value attribute.
 */
export function formatDateTimeInTimezone(date: Date | string, timezone = APP_TIMEZONE): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(d);
  const yyyy = parts.find((p) => p.type === "year")?.value;
  const mm = parts.find((p) => p.type === "month")?.value;
  const dd = parts.find((p) => p.type === "day")?.value;
  let hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  if (hh === "24") hh = "00";
  const min = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

/**
 * Parses a <input type="datetime-local"> value (YYYY-MM-DDTHH:mm) as an Asia/Kolkata
 * local time, converting it into a standard UTC ISO string (...Z) for database storage.
 * 
 * Ensures non-IST browser devices do not distort user-entered timestamps.
 */
export function parseDateTimeLocalInTimezone(dateTimeStr: string, timezone = APP_TIMEZONE): string {
  if (!dateTimeStr) return "";
  const strWithSec = dateTimeStr.length === 16 ? `${dateTimeStr}:00` : dateTimeStr;
  const utcDate = getUtcDateForLocalTime(strWithSec, timezone);
  return utcDate.toISOString();
}

/**
 * Formats a timestamp into a human-readable 12-hour time string in Asia/Kolkata (e.g. "2:30 PM").
 */
export function formatTimeInTimezone(date: Date | string, timezone = APP_TIMEZONE): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}
