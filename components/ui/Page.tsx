type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function Page({
  title,
  subtitle,
  children,
}: Props) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">

      <div className="mb-10">

        <h1 className="text-4xl font-black">

          {title}

        </h1>

        {subtitle && (

          <p className="mt-3 text-slate-400">

            {subtitle}

          </p>

        )}

      </div>

      {children}

    </div>
  );
}