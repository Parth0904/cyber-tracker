/**
 * Timezone utilities for Asia/Kolkata (IST = UTC+05:30, fixed offset, no DST).
 * Designed to be completely immune to the host machine's local timezone.
 */

export const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // +05:30 in ms = 19,800,000 ms

/**
 * Returns the calendar date string (YYYY-MM-DD) for a given timestamp in Asia/Kolkata.
 */
export function getKolkataDateString(date: Date | number | string): string {
  const d = typeof date === "number" ? new Date(date) : typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";

  const istTime = new Date(d.getTime() + IST_OFFSET_MS);
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istTime.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Returns the next midnight instant in Asia/Kolkata as a UTC Date object.
 * Useful for splitting an active session cleanly when crossing midnight IST.
 */
export function getNextKolkataMidnightUtc(date: Date | number): Date {
  const time = typeof date === "number" ? date : date.getTime();
  const istDate = new Date(time + IST_OFFSET_MS);

  const nextDayIstMidnightMs = Date.UTC(
    istDate.getUTCFullYear(),
    istDate.getUTCMonth(),
    istDate.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );

  return new Date(nextDayIstMidnightMs - IST_OFFSET_MS);
}

/**
 * Checks whether two timestamps fall on different calendar dates in Asia/Kolkata.
 */
export function isDifferentKolkataDay(timeA: number | Date, timeB: number | Date): boolean {
  return getKolkataDateString(timeA) !== getKolkataDateString(timeB);
}

/**
 * Formats total seconds into HH:MM:SS.
 */
export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
}

/**
 * Formats a timestamp into human-readable IST format: "HH:MM:SS IST".
 */
export function formatIstTime(date: Date | number | string): string {
  const d = typeof date === "number" ? new Date(date) : typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "--:--:-- IST";

  const istTime = new Date(d.getTime() + IST_OFFSET_MS);
  const hours = String(istTime.getUTCHours()).padStart(2, "0");
  const minutes = String(istTime.getUTCMinutes()).padStart(2, "0");
  const seconds = String(istTime.getUTCSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds} IST`;
}
