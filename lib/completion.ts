type DailyEntry = {
  sleep_hours: number;
  bed_time: string;
  reading: number;
  focus_feeling: string;
};

export function calculateCompletion(entry: DailyEntry | null) {
  if (!entry) {
    return {
      percent: 0,
      missingCount: 4,
      missing: [
        "Sleep Hours",
        "Bed Time",
        "Reading",
        "Focus Feeling",
      ],
    };
  }

  const fields = [
    {
      name: "Sleep Hours",
      value: entry.sleep_hours,
    },
    {
      name: "Bed Time",
      value: entry.bed_time,
    },
    {
      name: "Reading",
      value: entry.reading,
    },
    {
      name: "Focus Feeling",
      value: entry.focus_feeling,
    },
  ];

  const missing = fields
    .filter((field) => {
      if (typeof field.value === "number") {
        return field.value === 0;
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