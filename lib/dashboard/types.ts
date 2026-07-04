import { Insight } from "@/lib/insights";

export type DashboardResponse = {

  completion: {
    percent: number;
    missingCount: number;
    missing: string[];
  };

  productivity: {
    score: number;
    level: string;
    reason: string;
    contributors: {
      type: string;
      contribution: number;
    }[];
  };

  focus: Insight;

  insights: Insight[];

  updatedAt: string;

  streak: {
    current: number;
  };

  todayActivities: {
    type: string;
  }[];

  activeTarget: {
    name: string;
    status: string;
    hours: number;
    findings: number;
    reports: number;
  };

  currentSession: {
    active: boolean;
    type: string;
    target: string;
    duration: string;
  };

  weeklyTrend: {
    day: string;
    score: number;
  }[];

  recentActivity: {
    type: string;
    time: string;
  }[];

};