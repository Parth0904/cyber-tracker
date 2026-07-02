type SectionHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function SectionHeader({
  title,
  subtitle,
}: SectionHeaderProps) {
  return (
    <div className="mb-8">

      <h1 className="text-3xl font-black text-slate-100">
        {title}
      </h1>

      {subtitle && (
        <p className="mt-2 text-slate-400 max-w-3xl">
          {subtitle}
        </p>
      )}

    </div>
  );
}