import { Insight } from "@/lib/insights";

export type DashboardResponse = {
  completion: {
    percent: number;
    missingCount: number;
    missing: string[];
  };

  productivity: {
    level: string;
    reason: string[];
    contributors: {
      type: string;
      contribution: number;
    }[];
  };

  focus: Insight | null;

  insights: Insight[];
};