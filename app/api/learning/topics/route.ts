import { NextResponse } from "next/server";
import { getAllTopics, getOrCreateTopic, createLearningSession } from "@/lib/repositories/learning";

export async function GET() {
  try {
    const topics = await getAllTopics();
    return NextResponse.json(topics);
  } catch (err) {
    console.error("Failed to fetch learning topics:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { topicName, onlyCreate } = await req.json();
    if (!topicName || !topicName.trim()) {
      return NextResponse.json({ error: "Topic name is required" }, { status: 400 });
    }

    // Get or create topic
    const topic = await getOrCreateTopic(topicName.trim());
    
    // Start active learning session for this topic unless onlyCreate is true
    let sessionId = null;
    if (!onlyCreate) {
      sessionId = await createLearningSession(topic.id);
    }

    return NextResponse.json({
      success: true,
      topicId: topic.id,
      sessionId
    });
  } catch (err) {
    console.error("Failed to start learning session:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
