import { NextResponse } from "next/server";
import { createFinding } from "@/lib/repositories/targetFindings";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.target_id || !body.title || !body.status) {
      return NextResponse.json({ error: "target_id, title, and status are required" }, { status: 400 });
    }

    const finding = {
      target_id: Number(body.target_id),
      title: body.title,
      type: body.type || "Web",
      severity: body.severity || "Medium",
      status: body.status,
      submitted_at: body.submitted_at || new Date().toISOString(),
      reward: Number(body.reward) || 0,
      cve: body.cve || "",
      report_url: body.report_url || "",
      notes: body.notes || "",
    };

    const id = await createFinding(finding);
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("Failed to log finding:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
