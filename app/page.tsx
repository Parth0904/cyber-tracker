import * as React from "react";
import MonthlyCalendarView from "@/components/calendar/MonthlyCalendarView";

export const metadata = {
  title: "Monthly Calendar Planner | Cyber Tracker",
  description:
    "Primary monthly planning interface for Cyber Tracker with authoritative Windows Work Time Agent integration.",
};

export default function HomePage() {
  return (
    <main className="flex-1 min-h-[calc(100vh-3rem)] bg-black py-4">
      <MonthlyCalendarView />
    </main>
  );
}