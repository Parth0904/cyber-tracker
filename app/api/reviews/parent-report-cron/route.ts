import { NextRequest, NextResponse } from "next/server";
import { checkAndQueueReport } from "@/lib/services/parentReport";

export async function GET() {
  return await runCron();
}

export async function POST() {
  return await runCron();
}

async function runCron() {
  try {
    await checkAndQueueReport();
    return NextResponse.json({ success: true, message: "Parent reports cron job checked and executed successfully." });
  } catch (err) {
    console.error("Parent reports cron job error:", err);
    return NextResponse.json(
      { error: "Parent reports cron job execution failed", details: String(err) },
      { status: 500 }
    );
  }
}
