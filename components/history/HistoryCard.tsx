import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { HistoryDay } from "@/lib/history";

type Props = {
  day: HistoryDay;
};

export default function HistoryCard({
  day,
}: Props) {

  return (

    <Card>

      <div className="flex justify-between">

        <div>

          <h2 className="text-xl font-bold">
            {day.date}
          </h2>

          <p className="text-slate-400">

            Score {day.score}

          </p>

        </div>

       <Badge
  variant={
    day.productivity.level === "Excellent"
      ? "success"
      : day.productivity.level === "Good"
      ? "cyan"
      : day.productivity.level === "Normal"
      ? "warning"
      : "danger"
  }
>
  {day.productivity.level}
</Badge>

      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">

        <div>

          <h3 className="font-semibold mb-2">
            Habits
          </h3>

          <p>😴 Sleep: {day.daily.sleep_hours}h</p>

          <p>⏰ Sleep Window: {day.daily.bed_time || "--"} - {day.daily.wake_time || "--"}</p>

          <p>📚 Reading: {day.daily.reading ? "Yes" : "No"}</p>

          <p>
            🏋 Workout:
            {" "}
            {day.daily.workout
              ? "Yes"
              : "No"}
          </p>

          <p>📱 Screen Time: {day.daily.mobile_screen_time !== undefined && day.daily.mobile_screen_time !== null ? `${Math.floor(day.daily.mobile_screen_time / 60)}h ${day.daily.mobile_screen_time % 60}m` : "Not Logged"}</p>

        </div>

        <div>

          <h3 className="font-semibold mb-2">
            Activities
          </h3>

          <p>Learning: {day.activities.learning}</p>

          <p>Recon: {day.activities.recon}</p>

          <p>Target: {day.activities.target}</p>

          <p>Reports: {day.activities.bug_report}</p>

          <p>Findings: {day.activities.finding}</p>

        </div>

      </div>

      {day.focus && (

        <div className="mt-6 border-t border-slate-800 pt-4">

          <h3 className="font-semibold">

            Focus

          </h3>

          <p className="mt-2">

            {day.focus.recommendation}

          </p>

        </div>

      )}

      {day.daily.notes && (

        <div className="mt-6 border-t border-slate-800 pt-4">

          <h3 className="font-semibold">

            Notes

          </h3>

          <p className="mt-2 text-slate-400">

            {day.daily.notes}

          </p>

        </div>

      )}

    </Card>

  );

}