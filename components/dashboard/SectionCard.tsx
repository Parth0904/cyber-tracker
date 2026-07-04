type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export default function SectionCard({
  title,
  description,
  action,
  children,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 shadow-xl backdrop-blur-md">

      <div className="mb-6 flex items-start justify-between">

        <div>

          <h2 className="text-lg font-bold text-slate-100">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm text-slate-400">
              {description}
            </p>
          )}

        </div>

        {action}

      </div>

      {children}

    </div>
  );
}