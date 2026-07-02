type BadgeProps = {
  text: string;
  color?: "green" | "yellow" | "red" | "blue" | "gray";
};

const colors = {
  green:
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",

  yellow:
    "bg-amber-500/10 text-amber-400 border-amber-500/20",

  red:
    "bg-rose-500/10 text-rose-400 border-rose-500/20",

  blue:
    "bg-blue-500/10 text-blue-400 border-blue-500/20",

  gray:
    "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function Badge({
  text,
  color = "gray",
}: BadgeProps) {
  return (
    <span
      className={`px-3 py-1 rounded-full border text-xs font-semibold ${colors[color]}`}
    >
      {text}
    </span>
  );
}