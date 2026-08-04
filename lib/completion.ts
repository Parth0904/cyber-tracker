type DailyEntry = {
  bed_time: string;
  wake_time?: string;
  workout: number;
  reading: number;
  notes: string;
  mobile_screen_time?: number | null;
};

export function calculateCompletion(entry: DailyEntry | null) {
  if (!entry) {
    return {
      percent: 0,
      missingCount: 6,
      missing: [
        "Bed Time",
        "Wake Time",
        "Workout",
        "Reading",
        "Mobile Screen Time",
        "Daily Log",
      ],
    };
  }

  const fields = [
    {
      name: "Bed Time",
      value: entry.bed_time,
    },
    {
      name: "Wake Time",
      value: entry.wake_time,
    },
    {
      name: "Workout",
      value: entry.workout,
    },
    {
      name: "Reading",
      value: entry.reading,
    },
    {
      name: "Mobile Screen Time",
      value: entry.mobile_screen_time !== undefined && entry.mobile_screen_time !== null && entry.mobile_screen_time > 0 ? 1 : 0,
    },
    {
      name: "Daily Log",
      value: entry.notes,
    },
  ];

  const missing = fields
    .filter((field) => {
      if (field.name === "Workout" || field.name === "Reading" || field.name === "Mobile Screen Time") {
        return !field.value;
      }
      if (field.name === "Daily Log") {
        return !field.value || (typeof field.value === "string" && field.value.trim() === "");
      }
      return !field.value;
    })
    .map((field) => field.name);

  return {
    percent: Math.round(
      ((fields.length - missing.length) / fields.length) *
        100
    ),
    missingCount: missing.length,
    missing,
  };
}