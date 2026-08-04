import {
  createSession,
  getCurrentSession,
  terminateSession,
} from "@/lib/repositories/targetSessions";

import { one } from "@/lib/database/query";

export async function startSession(
  targetId: number,
  type: "Recon" | "Testing" | "Reporting",
  description = ""
) {
  // Terminate any active target hunting sessions
  const activeHunting = await getCurrentSession();
  if (activeHunting) {
    await terminateSession(activeHunting.id);
  }

  // Terminate any active learning sessions
  const activeLearning = await one<any>("SELECT id FROM learning_sessions WHERE ended_at IS NULL LIMIT 1");
  if (activeLearning) {
    const { terminateLearningSession } = await import("@/lib/repositories/learning");
    await terminateLearningSession(activeLearning.id);
  }

  return await createSession(
    targetId,
    type,
    description
  );
}

export async function stopSession() {

  const active =
    await getCurrentSession();

  if (!active) {
    throw new Error(
      "No active session."
    );
  }

  return await terminateSession(
    active.id
  );

}