import { calculateCompletion } from "@/lib/completion";
import { calculateDailyScore, calculateAverageDailyScore } from "@/lib/scoring";
import { ActivityRow, DailyEntry } from "@/lib/types";

export type HistoryTimelineItem = {
  id: string;
  date: string;
  completion: number;
  productivityScore: number;
  performance: string;
  habits: {
    sleepHours: number;
    wakeTime: string;
    reading: boolean;
    workout: boolean;
    screenTimeMinutes: number | null;
  };
  learning: {
    learningBlocks: number;
    bugReportStudyBlocks: number;
  };
  hunting: {
    reconSessions: number;
    targetsTested: number;
    findings: number;
  };
  comparison: {
    productivity: string;
    completion: string;
    sleep: string;
    learningBlocks: string;
    reconSessions: string;
  };
  summary: string;
  notes: string;
};

function generateDailySummary(
  entry: DailyEntry,
  activityCounts: { learning: number; bug_report: number; recon: number; target: number; finding: number },
  performance: string,
  completion: number
): string {
  const sentences: string[] = [];

  // Sentence 1: Performance rating & focus
  if (performance === "Recovery Day") {
    if (entry.sleep_hours >= 7.5) {
      sentences.push("A recovery-focused rest day prioritizing physical recovery and sleep.");
    } else {
      sentences.push("A quiet rest day with lower activity to recover energy.");
    }
  } else if (performance === "Exceptional" || performance === "Above Average") {
    const isHunting = (activityCounts.recon + activityCounts.target + activityCounts.finding) > (activityCounts.learning + activityCounts.bug_report);
    if (isHunting) {
      sentences.push("An excellent active day focused on research, evaluations, and security testing.");
    } else {
      sentences.push("A highly productive learning-focused day with excellent study progress.");
    }
  } else {
    const hasWork = (activityCounts.recon + activityCounts.target + activityCounts.finding + activityCounts.learning + activityCounts.bug_report) > 0;
    if (hasWork) {
      sentences.push("A steady work day maintaining a consistent operational routine.");
    } else {
      sentences.push("A quiet day with minimal logged items, maintaining basic habits.");
    }
  }

  // Sentence 2: Specific work completed
  const actions: string[] = [];
  if (activityCounts.finding > 0) {
    actions.push(`logged ${activityCounts.finding} security report${activityCounts.finding > 1 ? "s" : ""}`);
  }
  if (activityCounts.target > 0) {
    actions.push(`evaluated ${activityCounts.target} target system${activityCounts.target > 1 ? "s" : ""}`);
  }
  if (activityCounts.learning > 0) {
    actions.push(`completed ${activityCounts.learning} learning session${activityCounts.learning > 1 ? "s" : ""}`);
  }
  if (activityCounts.bug_report > 0) {
    actions.push(`studied ${activityCounts.bug_report} security report publication${activityCounts.bug_report > 1 ? "s" : ""}`);
  }

  if (actions.length > 0) {
    sentences.push(`Parth ${actions.slice(0, 2).join(" and ")}.`);
  }

  // Sentence 3: Habits / Sleep recovery
  if (completion >= 80) {
    if (entry.workout === 1 && entry.reading === 1) {
      sentences.push("He maintained optimal lifestyle habits, completing both regular exercise and bedtime reading.");
    } else {
      sentences.push(`He maintained strong recovery habits, completing ${completion}% of his daily routines.`);
    }
  } else if (entry.sleep_hours > 0) {
    sentences.push(`He averaged ${entry.sleep_hours.toFixed(1)} hours of sleep, ensuring adequate overnight rest.`);
  }

  return sentences.join(" ");
}

export function generateHistoryTimeline(
  entries: DailyEntry[],
  activities: ActivityRow[]
): HistoryTimelineItem[] {
  if (entries.length === 0) {
    return [];
  }

  // Calculate global historical averages
  const avgProductivity = calculateAverageDailyScore(activities) || 1.0;

  const entryCompletions = entries.map(entry => calculateCompletion(entry).percent);
  const avgCompletion = entryCompletions.length > 0 ? entryCompletions.reduce((a, b) => a + b, 0) / entryCompletions.length : 0;

  const validSleepEntries = entries.filter(e => e.sleep_hours !== undefined && e.sleep_hours !== null);
  const avgSleep = validSleepEntries.length > 0 ? validSleepEntries.reduce((acc, e) => acc + e.sleep_hours, 0) / validSleepEntries.length : 0;

  const totalLearning = activities.filter(a => a.type === "learning").reduce((acc, a) => acc + a.count, 0);
  const avgLearning = entries.length > 0 ? totalLearning / entries.length : 0;

  const totalRecon = activities.filter(a => a.type === "recon").reduce((acc, a) => acc + a.count, 0);
  const avgRecon = entries.length > 0 ? totalRecon / entries.length : 0;

  return entries
    .map((entry) => {
      const dayActivities = activities.filter(a => a.date === entry.date);
      
      const activityCounts = {
        learning: 0,
        bug_report: 0,
        recon: 0,
        target: 0,
        finding: 0,
      };

      dayActivities.forEach(activity => {
        if (activity.type in activityCounts) {
          activityCounts[activity.type as keyof typeof activityCounts] += activity.count;
        }
      });

      const score = calculateDailyScore(dayActivities);
      const completion = calculateCompletion(entry).percent;

      // Dynamic Performance Rating based on ratio to baseline average
      const ratio = score / avgProductivity;
      let performance = "Average";

      if (score === 0 || ratio < 0.25) {
        performance = "Recovery Day";
      } else if (ratio >= 1.50) {
        performance = "Exceptional";
      } else if (ratio >= 1.15) {
        performance = "Above Average";
      } else if (ratio >= 0.75) {
        performance = "Average";
      } else {
        performance = "Below Average";
      }

      // Comparison vs Rolling averages
      const prodDiffPercent = avgProductivity > 0 ? Math.round(((score - avgProductivity) / avgProductivity) * 100) : 0;
      const compDiff = Math.round(completion - avgCompletion);
      const sleepDiff = entry.sleep_hours - avgSleep;
      const learningDiff = activityCounts.learning - avgLearning;
      const reconDiff = activityCounts.recon - avgRecon;

      const comparison = {
        productivity: prodDiffPercent >= 0 ? `+${prodDiffPercent}%` : `${prodDiffPercent}%`,
        completion: compDiff >= 0 ? `+${compDiff}%` : `${compDiff}%`,
        sleep: sleepDiff >= 0 ? `+${sleepDiff.toFixed(1)}h` : `${sleepDiff.toFixed(1)}h`,
        learningBlocks: learningDiff >= 0 ? `+${learningDiff.toFixed(1)}` : `${learningDiff.toFixed(1)}`,
        reconSessions: reconDiff >= 0 ? `+${reconDiff.toFixed(1)}` : `${reconDiff.toFixed(1)}`,
      };

      const summary = generateDailySummary(entry, activityCounts, performance, completion);

      return {
        id: entry.date,
        date: entry.date,
        completion,
        productivityScore: score,
        performance,
        habits: {
          sleepHours: entry.sleep_hours,
          wakeTime: entry.wake_time || "--:--",
          reading: entry.reading === 1,
          workout: entry.workout === 1,
          screenTimeMinutes: entry.mobile_screen_time ?? null,
        },
        learning: {
          learningBlocks: activityCounts.learning,
          bugReportStudyBlocks: activityCounts.bug_report,
        },
        hunting: {
          reconSessions: activityCounts.recon,
          targetsTested: activityCounts.target,
          findings: activityCounts.finding,
        },
        comparison,
        summary,
        notes: entry.notes || "",
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}