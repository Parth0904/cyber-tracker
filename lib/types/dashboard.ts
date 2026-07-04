export type ActiveTarget = {
  name: string;
  status: string;
  hours: number;
  findings: number;
  reports: number;
};

export type CurrentSession = {
  active: boolean;
  type: string;
  target: string;
  duration: string;
};

export type TrendPoint = {
  day: string;
  score: number;
};

export type RecentActivity = {
  type: string;
  time: string;
};

export type DashboardInsight = string;

export type Productivity = {
  score: number;
  level: string;
  reason: string;
  contributors: {
    type: string;
    contribution: number;
  }[];
};

export type Focus = {
  habit: string;
  strength: string;
  recommendation: string;
  explanation: string;
  confidence: string;
};

export type Completion = {
  percent: number;
};

export type Streak = {
  current: number;
};

export type DashboardData = {
  updatedAt: string;

  productivity: Productivity;

  focus: Focus;

  completion: Completion;

  streak: Streak;

  todayActivities: {
    type: string;
  }[];

  activeTarget: ActiveTarget;

  currentSession: CurrentSession;

  weeklyTrend: TrendPoint[];

  recentActivity: RecentActivity[];

  insights: DashboardInsight[];
};