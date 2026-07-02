type Props = {
  value: string;

  onChange: (value: string) => void;
};

export default function HistorySearch({
  value,
  onChange,
}: Props) {
  return (
    <input
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
      placeholder="Search notes or dates..."
      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 outline-none focus:border-cyan-500"
    />
  );
}