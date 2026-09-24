/**
 * Canonical Consistency Metrics Service
 * 
 * Re-exports the authoritative consistency calculations:
 * - 100% Productive Activity (Cybersecurity Sessions, Activities, Findings)
 * - 0% Workout / 0% Reading (Decoupled from active tracking)
 */

export {
  calculateConsistency,
  calculateConsistencyForPeriod,
  type ConsistencyResult,
} from "@/lib/services/consistency";
