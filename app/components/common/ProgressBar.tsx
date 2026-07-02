type ProgressBarProps = {
  value: number;
  max: number;
};

export default function ProgressBar({
  value,
  max,
}: ProgressBarProps) {
  const percent =
    max === 0
      ? 0
      : Math.min(
          100,
          Math.round((value / max) * 100)
        );

  return (
    <div className="w-full">
      <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-cyan-500 transition-all"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-slate-500">
        <span>{value}</span>

        <span>{max}</span>
      </div>
    </div>
  );
}