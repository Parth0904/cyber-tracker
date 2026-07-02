import { NextResponse } from "next/server";
import { ActivityType } from "@/lib/constants";

export async function POST(req: Request) {

  const body = await req.json() as {
    type: ActivityType;
  };

  const today = new Date().toISOString().split("T")[0];

  // import dynamically to avoid TypeScript export mismatch errors
  const mod = await import("@/lib/repositories/activities");
  const incrementActivity = (mod as any).incrementActivity ?? (mod as any).default?.incrementActivity;
  if (typeof incrementActivity === "function") {
    await incrementActivity(today, body.type);
  } else {
    return NextResponse.json({ success: false, error: 'incrementActivity not found' }, { status: 500 });
  }

return NextResponse.json({
  success: true,
});
}