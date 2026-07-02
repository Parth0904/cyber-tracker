import { Insight } from "@/lib/insights/index";

export type DashboardData = {
  completion: {
    percent: number;
    missingCount: number;
    missing: string[];
  };

  productivity: {
    level: string;
    color: string;
    reason: string;
    contributors: {
      type: string;
      contribution: number;
    }[];
  };

  focus: Insight;

  insights: Insight[];
};