import { NextResponse } from "next/server";

import {
  getEntries,
} from "@/lib/repositories/dailyEntries";

export async function GET(
  req: Request
) {

  const { searchParams } =
    new URL(req.url);

  const scope =
    searchParams.get("scope");

  const entries =
    getEntries("all");

  if (scope === "yesterday") {

    const yesterday =
      new Date();

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    const yesterdayKey =
      yesterday
        .toISOString()
        .split("T")[0];

    const entry =
      entries.find(
        e => e.date === yesterdayKey
      );

    return NextResponse.json(
      entry ?? {}
    );

  }

  return NextResponse.json({
    entries,
  });

}