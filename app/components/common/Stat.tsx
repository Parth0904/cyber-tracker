type StatProps = {
  label: string;
  value: string | number;
};

export default function Stat({
  label,
  value,
}: StatProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="text-2xl font-bold text-cyan-400 mt-1">
        {value}
      </p>
    </div>
  );
}