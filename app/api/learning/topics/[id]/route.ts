import { NextResponse } from "next/server";
import { getTopic, getTopicSessions, deleteTopic, archiveTopic, restoreTopic } from "@/lib/repositories/learning";
import { execute } from "@/lib/database/query";

export async function GET(
  _: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await params;
    const topicId = Number(id);
    
    const topic = await getTopic(topicId);
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const sessions = await getTopicSessions(topicId);
    
    // Compute stats dynamically from sessions
    const completedSessions = sessions.filter(s => s.ended_at !== null);
    const totalMinutes = completedSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const sessionsCount = sessions.length;
    const lastStudiedAt = completedSessions.length > 0 ? completedSessions[0].ended_at : null;

    return NextResponse.json({
      topic,
      stats: {
        totalHours,
        sessionsCount,
        lastStudiedAt
      },
      sessions
    });
  } catch (err) {
    console.error("Failed to fetch topic overview details:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await params;
    const topicId = Number(id);
    const { name, archived } = await req.json();

    if (archived === 1) {
      await archiveTopic(topicId);
    } else if (archived === 0) {
      await restoreTopic(topicId);
    }

    if (name && name.trim()) {
      await execute("UPDATE learning_topics SET name = ? WHERE id = ?", name.trim(), topicId);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to update learning topic:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await params;
    await deleteTopic(Number(id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete learning topic:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
