interface FailedAttempts {
  count: number;
  resetTime: number;
}

const failedAttemptsMap = new Map<string, FailedAttempts>();

/**
 * Check if the IP has exceeded 5 failed attempts in the last 15 minutes.
 */
export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = failedAttemptsMap.get(ip);
  if (!entry) return false;
  if (now > entry.resetTime) {
    failedAttemptsMap.delete(ip);
    return false;
  }
  return entry.count >= 5;
}

/**
 * Record a failed attempt for the IP.
 */
export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = failedAttemptsMap.get(ip);
  if (!entry || now > entry.resetTime) {
    failedAttemptsMap.set(ip, {
      count: 1,
      resetTime: now + 15 * 60 * 1000, // 15 minutes
    });
  } else {
    entry.count += 1;
  }
}

/**
 * Clear failed attempts for the IP on successful login.
 */
export function clearFailedAttempts(ip: string): void {
  failedAttemptsMap.delete(ip);
}
