import { getAllTargets } from "@/lib/repositories/targets";
import { getAllActivities } from "@/lib/repositories/activities";
import { getAllSessions } from "@/lib/repositories/targetSessions";
import { getAllFindings } from "@/lib/repositories/targetFindings";

export function generateCareerSummary() {

  const targets = getAllTargets();

  const activities = getAllActivities();

  const sessions = getAllSessions();

  const findings = getAllFindings();

  const totalHours =
    sessions.reduce(

      (sum, session) =>

        sum + session.duration,

      0

    ) / 3600;

  const valid =
    findings.filter(

      finding =>
        finding.status === "Valid"

    ).length;

  const submitted =
    findings.filter(

      finding =>
        finding.status === "Submitted"

    ).length;

  const totalReward =
    findings.reduce(

      (sum, finding) =>

        sum + finding.reward,

      0

    );

  const careerScore = Math.min(

    100,

    Math.round(

      totalHours * 0.2 +

      findings.length * 5 +

      valid * 10 +

      submitted * 4

    )

  );

  const rank =

    careerScore >= 90
      ? "Elite Hunter"

    : careerScore >= 75
      ? "Senior Hunter"

    : careerScore >= 60
      ? "Hunter"

    : careerScore >= 40
      ? "Junior Hunter"

    : "Learning";

  return {

    overview: {

      totalHours,

      totalTargets: targets.length,

      totalActivities: activities.length,

      totalSessions: sessions.length,

      totalFindings: findings.length,

      validReports: valid,

      submittedReports: submitted,

      totalReward,

    },

    milestones: [

      {

        title: "First Target",

        completed:
          targets.length >= 1,

      },

      {

        title: "10 Hunting Sessions",

        completed:
          sessions.length >= 10,

      },

      {

        title: "First Finding",

        completed:
          findings.length >= 1,

      },

      {

        title: "First Valid Report",

        completed:
          valid >= 1,

      },

      {

        title: "100 Hunting Hours",

        completed:
          totalHours >= 100,

      },

    ],

    nextGoal: {

      title:
        totalHours < 100

          ? "Reach 100 Hunting Hours"

          : "Submit 10 Valid Reports",

      progress:

        totalHours < 100

          ? Math.min(
              100,
              Math.round(
                totalHours
              )
            )

          : Math.min(
              100,
              valid * 10
            ),

    },

    careerScore,

    rank,

  };

}