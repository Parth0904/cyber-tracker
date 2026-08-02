import { NextRequest, NextResponse } from "next/server";
import { getParentReportConfig, saveParentReportConfig } from "@/lib/repositories/parentReport";

export async function GET() {
  try {
    const config = await getParentReportConfig();
    return NextResponse.json({ success: true, config });
  } catch (err) {
    console.error("Get parent report config error:", err);
    return NextResponse.json({ error: "Failed to load parent report settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { enabled, parent_name, delivery_method, delivery_time, time_zone, email_address, telegram_chat_id } = body;

    await saveParentReportConfig({
      enabled: enabled ? 1 : 0,
      parent_name: parent_name || "",
      delivery_method: delivery_method || "Email",
      delivery_time: delivery_time || "20:00",
      time_zone: time_zone || "UTC",
      email_address: email_address || "",
      telegram_chat_id: telegram_chat_id || "",
    });

    return NextResponse.json({ success: true, message: "Parent report settings updated successfully." });
  } catch (err) {
    console.error("Save parent report config error:", err);
    return NextResponse.json({ error: "Failed to save parent report settings" }, { status: 500 });
  }
}
