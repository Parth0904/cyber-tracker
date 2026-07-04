import { NextResponse } from "next/server";

import { generateInsights } from "@/lib/insights";

import { getEntries } from "@/lib/repositories/dailyEntries";
import { getActivities } from "@/lib/repositories/activities";

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url);

  const period =
    searchParams.get("period") ?? "weekly";

  const entries =
    getEntries("all");

  const activities =
    getActivities("all");

  const latest =
    entries.length
      ? entries[entries.length - 1]
      : null;

  const result = latest
    ? generateInsights(
        entries,
        activities,
        latest
      )
    : {
        focus: null,
        insights: [],
      };

  return NextResponse.json({

    period,

    focus: result.focus,

    insights: result.insights,

  });

}

export async function POST(req: Request) {

  const body =
    await req.json();

  return NextResponse.json({

    success: true,

    reply:
      "AI Coach will be available in a future update.",

    prompt:
      body.prompt ?? "",

  });

}