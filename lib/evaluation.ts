type BreakdownItem = {
  type: string;
  contribution: number;
};

type ProductivityLevel =
  | "Excellent"
  | "Good"
  | "Normal"
  | "Low"
  | "Poor";

function classifyProductivity(
  today: number,
  average: number
): ProductivityLevel {
  if (average === 0) {
    return "Normal";
  }

  const ratio = today / average;

  if (ratio >= 1.5) return "Excellent";
  if (ratio >= 1.2) return "Good";
  if (ratio >= 0.8) return "Normal";
  if (ratio >= 0.5) return "Low";

  return "Poor";
}

export function evaluateDay(
  todayScore: number,
  averageScore: number,
  breakdown: BreakdownItem[]
) {
  const level = classifyProductivity(
    todayScore,
    averageScore
  );

  const contributors = [...breakdown]
    .filter((c) => c.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);

  const reasons: string[] = [];

  contributors.forEach((c) => {
    switch (c.type) {
      case "finding":
        reasons.push("A finding was submitted today.");
        break;

      case "target":
        reasons.push("Multiple targets were actively tested.");
        break;

      case "recon":
        reasons.push("Strong reconnaissance activity.");
        break;

      case "learning":
        reasons.push("Focused learning sessions were completed.");
        break;

      case "bug_report":
        reasons.push("Bug report study sessions were completed.");
        break;
    }
  });

  if (reasons.length === 0) {
    reasons.push("No work activities were recorded today.");
  }

  return {
    level,
    reason: reasons,
    contributors,
  };
}