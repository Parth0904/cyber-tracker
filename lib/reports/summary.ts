import { ActivityRow, DailyEntry } from "@/lib/types";

export type ReportSummary = {
  entries: DailyEntry[];
  activities: ActivityRow[];

  averageSleep: number;

  averageReading: number;

  totalActivities: number;
};

export function buildReportSummary(

entries: DailyEntry[],

activities: ActivityRow[]

): ReportSummary {

const averageSleep =
entries.length===0
?0
:
entries.reduce(
(sum,e)=>sum+e.sleep_hours,
0
)/entries.length;

const averageReading =
entries.length===0
?0
:
entries.reduce(
(sum,e)=>sum+e.reading,
0
)/entries.length;

return{

entries,

activities,

averageSleep:
Math.round(
averageSleep*10
)/10,

averageReading:
Math.round(
averageReading
),

totalActivities:
activities.length,

};

}