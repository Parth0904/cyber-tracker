import { NextResponse } from "next/server";
import {
  getAllLearningSessions,
  getActiveLearningSessionWithAbandonedStatus,
} from "@/lib/repositories/learning";

export async function GET() {
  try {
    const sessions = await getAllLearningSessions();
    const learningActive = await getActiveLearningSessionWithAbandonedStatus();

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
      totalSessions: sessions.length,
      totalHours: totalMinutes / 60,
      avgLengthHours: avgMinutes / 60,
      isStudying: !!learningActive,
    };

    const mapped = sessions.map((s) => ({
      id: String(s.id),
      topicId: String(s.topic_id),
      topicName: s.topicName,
      start: s.started_at,
      end: s.ended_at,
      durationHours: (s.duration || 0) / 60,
      status: s.ended_at ? "Completed" : "Running",
    }));

    return NextResponse.json({
      active: learningActive,
      sessions: mapped,
      stats,
    });
  } catch (err) {
    console.error("Failed to fetch learning sessions:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
