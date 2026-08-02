import { NextResponse } from "next/server";
import { getHealthConnectConfig, updateHealthConnectConfig } from "@/lib/repositories/health";
import { syncHealthDataToday } from "@/lib/services/health";

export async function GET() {
  try {
    // Automatically trigger health synchronization on query
    const syncResult = await syncHealthDataToday();
    const config = await getHealthConnectConfig();

    return NextResponse.json({
      status: config.status,
      simulatedWorkout: config.simulated_workout === 1,
      syncResult
    });
  } catch (err) {
    console.error("Failed to query Health Connect config:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { status, simulatedWorkout } = body;

    if (
      status &&
      !["Not Connected", "Connected", "Permission Denied", "Unsupported Device"].includes(status)
    ) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const currentConfig = await getHealthConnectConfig();
    const nextStatus = status !== undefined ? status : currentConfig.status;
    const nextSimulated =
      simulatedWorkout !== undefined ? (simulatedWorkout ? 1 : 0) : currentConfig.simulated_workout;

    await updateHealthConnectConfig(nextStatus, nextSimulated);

    // If newly connected or simulated workout toggled, trigger an immediate synchronization
    let syncResult = null;
    if (nextStatus === "Connected") {
      syncResult = await syncHealthDataToday();
    }

    return NextResponse.json({
      success: true,
      status: nextStatus,
      simulatedWorkout: nextSimulated === 1,
      syncResult
    });
  } catch (err) {
    console.error("Failed to update Health Connect config:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
