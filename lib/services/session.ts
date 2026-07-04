import {
  createSession,
  getCurrentSession,
  terminateSession,
} from "@/lib/repositories/targetSessions";

export function startSession(
  targetId: number,
  type: "Recon" | "Testing" | "Reporting",
  description = ""
) {

  const active =
    getCurrentSession();

  if (active) {
    throw new Error(
      "Another session is already running."
    );
  }

  return createSession(
    targetId,
    type,
    description
  );

}

export function stopSession() {

  const active =
    getCurrentSession();

  if (!active) {
    throw new Error(
      "No active session."
    );
  }

  return terminateSession(
    active.id
  );

}