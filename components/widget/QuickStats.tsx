import {
  BookOpen,
  Radar,
  Target,
  Bug,
} from "lucide-react";

type Props = {
  learning: number;
  recon: number;
  target: number;
  finding: number;
};

export default function QuickStats({
  learning,
  recon,
  target,
  finding,
}: Props) {
  const stats = [
    {
      label: "Learning",
      value: learning,
      icon: <BookOpen size={18} />,
    },
    {
      label: "Recon",
      value: recon,
      icon: <Radar size={18} />,
    },
    {
      label: "Targets",
      value: target,
      icon: <Target size={18} />,
    },
    {
      label: "Findings",
      value: finding,
      icon: <Bug size={18} />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">

      {stats.map((item) => (

        <div
          key={item.label}
          className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
        >

          <div className="flex justify-between">

            {item.icon}

            <span className="text-2xl font-black">

              {item.value}

            </span>

          </div>

          <p className="mt-3 text-sm text-slate-400">

            {item.label}

          </p>

        </div>

      ))}

    </div>
  );
}