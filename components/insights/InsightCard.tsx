type InsightCardProps = {
  habit: string;
  recommendation: string;
  explanation: string;
  confidence: "High" | "Medium" | "Low";
  strength: "Very Strong" | "Strong" | "Moderate" | "Weak";
  completed: boolean;
  impact: number;
};

const confidenceStyles = {
  High: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Low: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const strengthStyles = {
  "Very Strong": "text-emerald-400",
  Strong: "text-cyan-400",
  Moderate: "text-amber-400",
  Weak: "text-rose-400",
};

export default function InsightCard({
  habit,
  recommendation,
  explanation,
  confidence,
  strength,
  completed,
  impact,
}: InsightCardProps) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-lg">

      <div className="flex items-start justify-between">

        <div>

          <h2 className="text-xl font-bold text-slate-100">
            {habit}
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            {recommendation}
          </p>

        </div>

        <div className="flex flex-col gap-2 items-end">

          <span
            className={`px-3 py-1 rounded-full border text-xs font-semibold ${confidenceStyles[confidence]}`}
          >
            {confidence}
          </span>

          <span
            className={`text-sm font-semibold ${strengthStyles[strength]}`}
          >
            {strength}
          </span>

        </div>

      </div>

      <div className="mt-6">

        <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">
          Why?
        </h3>

        <p className="text-slate-300 leading-relaxed">
          {explanation}
        </p>

      </div>

      <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">

        <div>

          <p className="text-xs uppercase tracking-wider text-slate-500">
            Estimated Impact
          </p>

          <p className="text-lg font-bold text-cyan-400">
            +{impact}
          </p>

        </div>

        <div className="text-right">

          <p className="text-xs uppercase tracking-wider text-slate-500">
            Status
          </p>

          <p
            className={`font-semibold ${
              completed
                ? "text-emerald-400"
                : "text-rose-400"
            }`}
          >
            {completed ? "Completed Today" : "Pending"}
          </p>

        </div>

      </div>

    </div>
  );
}