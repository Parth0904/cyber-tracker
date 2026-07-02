import { NextResponse } from "next/server";

import {
  getEntries,
  getTodayEntry,
} from "@/lib/repositories/dailyEntries";

import {
  getActivities,
  getTodayActivities,
} from "@/lib/repositories/activities";

import {
  generateDashboard,
} from "@/lib/dashboard";

import { DailyEntry, ActivityRow } from "@/lib/types";

export async function GET() {

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const defaultEntry: DailyEntry = {
    date: today,
    sleep_hours: 0,
    bed_time: "",
    reading: 0,
    focus_feeling: "",
    workout: 0,
    steps: 0,
    notes: "",
  };

  const todayEntry =
    getTodayEntry(today) ??
    defaultEntry;

  const response =
    generateDashboard(

      todayEntry,

      getEntries("all"),

      (getTodayActivities(today) as ActivityRow[]),

      getActivities("all")

    );

  return NextResponse.json(
    response
  );

}