import { NextRequest, NextResponse } from "next/server";
import { saveDayOverride, revertDayOverride } from "@/lib/services/calendar/monthlyCalendar";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, status, topic } = body;

    if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: "Valid date in YYYY-MM-DD format is required." },
        { status: 400 }
      );
    }

    if (status !== undefined && status !== null && status !== "WORKDAY" && status !== "HOLIDAY") {
      return NextResponse.json(
        { success: false, error: "Status must be 'WORKDAY', 'HOLIDAY', or null." },
        { status: 400 }
      );
    }

    await saveDayOverride(date, status, topic);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save calendar day override:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update day" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: "Valid date in YYYY-MM-DD format is required." },
        { status: 400 }
      );
    }

    await revertDayOverride(date);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to revert calendar day override:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to revert day" },
      { status: 500 }
    );
  }
}
