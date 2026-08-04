import { NextResponse } from "next/server";
import { getTodayEntry } from "@/lib/repositories/dailyEntries";
import { calculateConsistency } from "@/lib/services/consistency";
import { getActiveSessionWithAbandonedStatus } from "@/lib/repositories/targetSessions";
import { getActiveLearningSessionWithAbandonedStatus } from "@/lib/repositories/learning";
import { getAllTargets } from "@/lib/repositories/targets";
import { calculateCompletion } from "@/lib/completion";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const entry = (await getTodayEntry(today)) || null;

  // 1. Calculate completion state
  const completionInfo = calculateCompletion(entry);

  // 2. Fetch active session
  const huntingActive = await getActiveSessionWithAbandonedStatus();
  const learningActive = await getActiveLearningSessionWithAbandonedStatus();

  let activeMapped = {
    active: false,
    id: null as number | null,
    targetId: "",
    targetName: "",
    type: "",
    description: "",
    startedAt: "",
    isAbandoned: false,
    module: "",
  };

  if (huntingActive?.active) {
    const activeSession = huntingActive.active;
    activeMapped = {
      active: true,
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
      active: true,
      id: learningActive.id,
      targetId: "",
      targetName: learningActive.topicName,
      type: "Learning",
      description: "",
      startedAt: learningActive.startedAt,
      isAbandoned: learningActive.isAbandoned,
      module: "Learning",
    };
  }

  // 3. Calculate dynamic consistency
  const consistencyInfo = await calculateConsistency();

  // 4. Targets list for session engagement selector
  const targets = await getAllTargets();

  return NextResponse.json({
    completion: {
      percent: completionInfo.percent,
      completedCount: 6 - completionInfo.missingCount,
      totalCount: 6,
      missing: completionInfo.missing,
      entry: entry ? {
        bedTime: entry.bed_time || "",
        wakeTime: entry.wake_time || "",
        workout: Boolean(entry.workout),
        reading: Boolean(entry.reading),
        mobileScreenTime: entry.mobile_screen_time !== undefined && entry.mobile_screen_time !== null ? entry.mobile_screen_time : null,
        notes: entry.notes || "",
      } : {
        bedTime: "",
        wakeTime: "",
        workout: false,
        reading: false,
        mobileScreenTime: null,
        notes: "",
      }
    },
    activeSession: activeMapped,
    consistency: consistencyInfo,
    targets: targets.map(t => ({ id: String(t.id), name: t.name })),
  });
}