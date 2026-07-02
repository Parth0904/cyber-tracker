type CardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export default function Card({
  title,
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`bg-slate-900/40 border border-slate-800 rounded-xl shadow-lg p-6 ${className}`}
    >
      {title && (
        <h2 className="text-lg font-bold text-slate-100 mb-5">
          {title}
        </h2>
      )}

      {children}
    </div>
  );
}