type Props = {
  children: React.ReactNode;
};

export default function StatGrid({
  children,
}: Props) {
  return (
    <div
      className="
      grid
      grid-cols-1
      sm:grid-cols-2
      xl:grid-cols-4
      gap-6
      "
    >
      {children}
    </div>
  );
}