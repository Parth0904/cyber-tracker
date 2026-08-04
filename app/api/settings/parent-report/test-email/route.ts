import { NextResponse } from "next/server";
import { sendTestEmailDirect } from "@/lib/services/parentReport";

export async function POST() {
  try {
    const result = await sendTestEmailDirect();
    if (result.success) {
      return NextResponse.json({ success: true, message: "Test email sent successfully." });
    } else {
      return NextResponse.json({ error: result.error || "Failed to send test email." }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Test email dispatch route error:", err);
    return NextResponse.json({ error: err.message || "Failed to initiate test email dispatch" }, { status: 500 });
  }
}
