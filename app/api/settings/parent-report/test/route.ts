import { NextRequest, NextResponse } from "next/server";
import { sendTestReport } from "@/lib/services/parentReport";

export async function POST() {
  try {
    const result = await sendTestReport();
    if (result.success) {
      return NextResponse.json({ success: true, message: "Test report dispatched successfully." });
    } else {
      return NextResponse.json({ error: result.error || "Failed to dispatch test report." }, { status: 400 });
    }
  } catch (err) {
    console.error("Test dispatch route error:", err);
    return NextResponse.json({ error: "Failed to initiate test report dispatch" }, { status: 500 });
  }
}
