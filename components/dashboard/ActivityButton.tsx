type Props = {
  icon: React.ReactNode;
  label: string;
  count?: number;
  onClick: () => void;
};

export default function ActivityButton({
  icon,
  label,
  count,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className="
      group
      relative
      overflow-hidden
      rounded-2xl
      border
      border-slate-800
      bg-slate-900/60
      p-5
      transition-all
      duration-300
      hover:-translate-y-1
      hover:border-cyan-500/50
      hover:shadow-lg
      hover:shadow-cyan-500/10
      active:scale-95
      "
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />

      <div className="flex flex-col items-center gap-4">

        <div className="text-4xl transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>

        <div className="text-center">

          <p className="font-semibold text-slate-100">
            {label}
          </p>

          <p className="mt-1 text-xs text-cyan-400">
            +1 Activity
          </p>

        </div>

        {count !== undefined && (
          <div className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
            Today {count}
          </div>
        )}

      </div>
    </button>
  );
}