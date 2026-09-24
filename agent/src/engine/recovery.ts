import type { IAgentRepository } from "../storage/repository";
import { logger } from "../logger";

export interface RecoveryResult {
  recoveredCount: number;
  recoveredSessionIds: string[];
}

/**
 * Recovers any dangling sessions left in 'ACTIVE' status from a previous crash,
 * sudden reboot, or power outage. Finalizes them at their last durable checkpoint.
 * Never invents or assumes work time while the agent was offline.
 */
export function runStartupRecovery(repository: IAgentRepository): RecoveryResult {
  const activeSessions = repository.getActiveSessions();
  const recoveredSessionIds: string[] = [];

  for (const session of activeSessions) {
    const finalEndedAt = session.last_checkpoint || session.started_at;
    logger.warn("Recovering unfinished session from previous run", {
      sessionId: session.id,
      startedAt: session.started_at,
      lastCheckpoint: session.last_checkpoint,
      activeSeconds: session.active_seconds,
    });

    repository.finalizeSession(
      session.id,
      finalEndedAt,
      session.active_seconds,
      "INTERRUPTED"
    );

    recoveredSessionIds.push(session.id);
  }

  if (recoveredSessionIds.length > 0) {
    logger.info("Startup crash recovery completed", {
      recoveredCount: recoveredSessionIds.length,
      sessionIds: recoveredSessionIds,
    });
  }

  return {
    recoveredCount: recoveredSessionIds.length,
    recoveredSessionIds,
  };
}
