import { NextResponse } from "next/server";

import {
  getAllSessions,
  getActiveSessionWithAbandonedStatus,
} from "@/lib/repositories/targetSessions";

import {
  getActiveLearningSessionWithAbandonedStatus,
} from "@/lib/repositories/learning";

export async function GET() {
  try {
    const sessions = await getAllSessions();
    const huntingActive = await getActiveSessionWithAbandonedStatus();
    const learningActive = await getActiveLearningSessionWithAbandonedStatus();

    let activeMapped = null;

    if (huntingActive?.active) {
      const activeSession = huntingActive.active;
      activeMapped = {
        id: activeSession.id,
        targetId: String(activeSession.target_id),
        targetName: activeSession.target,
        type: activeSession.type,
        description: activeSession.description ?? "",
        startedAt: activeSession.started_at,
        isAbandoned: huntingActive.isAbandoned,
        module: "Hunting",
      };
    } else if (learningActive) {
      activeMapped = {
        id: learningActive.id,
        type: "Learning",
        topicId: String(learningActive.topicId),
        topicName: learningActive.topicName,
        startedAt: learningActive.startedAt,
        isAbandoned: learningActive.isAbandoned,
        module: "Learning",
      };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;

    const completed = sessions.filter((s) => s.ended_at !== null);

    const todayMinutes = completed
      .filter((s) => new Date(s.started_at).getTime() >= todayStart)
      .reduce((acc, s) => acc + (s.duration || 0), 0);

    const weekMinutes = completed
      .filter((s) => new Date(s.started_at).getTime() >= weekStart)
      .reduce((acc, s) => acc + (s.duration || 0), 0);

    const totalMinutes = completed.reduce((acc, s) => acc + (s.duration || 0), 0);
    const avgMinutes = completed.length > 0 ? totalMinutes / completed.length : 0;

    const stats = {
      todayTotal: todayMinutes / 60,
      weekTotal: weekMinutes / 60,
      totalHours: totalMinutes / 60,
      avgLengthHours: avgMinutes / 60,
    };

    return NextResponse.json({
      active: activeMapped,
      stats,
      sessions: sessions.map(session => ({
        id: String(session.id),
        targetId: String(session.target_id),
        targetName: session.target,
        type: session.type,
        description: session.description ?? "",
        start: session.started_at,
        end: session.ended_at,
        durationHours: session.duration / 60,
        status: session.ended_at ? "Completed" : "Running",
      })),
    });
  } catch (err) {
    console.error("Failed to fetch sessions overview:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}