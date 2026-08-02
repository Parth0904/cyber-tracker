import {
  createSession,
  getCurrentSession,
  terminateSession,
} from "@/lib/repositories/targetSessions";

export async function startSession(
  targetId: number,
  type: "Recon" | "Testing" | "Reporting",
  description = ""
) {

  const active =
    await getCurrentSession();

  if (active) {
    throw new Error(
      "Another session is already running."
    );
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