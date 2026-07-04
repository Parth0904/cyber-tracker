export type WeeklyReport = {

  week: string;

  averageScore: number;

  totalActivities: number;

  totalSessions: number;

  totalTargets: number;

  learning: number;

  recon: number;

  testing: number;

  reporting: number;

  findings: number;

  reports: number;

  validReports: number;

  averageReading: number;

  averageSleep: number;

  totalHours: number;

  productivity: string;

  recommendation: string;

};

export type MonthlyReport = {

  month: string;

  averageScore: number;

  totalActivities: number;

  totalSessions: number;

  totalTargets: number;

  averageReading: number;

  averageSleep: number;

  bestHabit: string;

  weakestHabit: string;

  streak: number;

  findings: number;

  reports: number;

  validReports: number;

  totalHours: number;

  productivity: string;

  recommendation: string;

};

export type YearlyReport = {

  year: number;

  averageScore: number;

  totalActivities: number;

  totalSessions: number;

  totalTargets: number;

  totalFindings: number;

  totalReports: number;

  validReports: number;

  averageReading: number;

  averageSleep: number;

  totalHours: number;

  totalReward: number;

  bestMonth: string;

  topTarget: string;

  careerScore: number;

};