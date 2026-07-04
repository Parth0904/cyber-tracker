import { ActivityRow } from "@/lib/types";

export type ProductiveHour = {
  hour: number;
  label: string;
  activities: number;
};

export function generateProductiveHours(
  activities: ActivityRow[]
): ProductiveHour[] {

  const hours = Array.from(
    { length: 24 },
    (_, hour) => ({
      hour,
      label: `${hour.toString().padStart(2, "0")}:00`,
      activities: 0,
    })
  );

  for (const activity of activities) {

    if (!activity.created_at) continue;

    const date = new Date(activity.created_at);

    if (Number.isNaN(date.getTime())) continue;

    hours[date.getHours()].activities++;

  }

  return hours;
}