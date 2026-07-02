type Props = {
  value: string;

  onChange: (value: string) => void;
};

const filters = [
  "all",
  "week",
  "month",
  "year",
];

export default function HistoryFilters({
  value,
  onChange,
}: Props) {
  return (
    <div className="flex gap-3 flex-wrap">

      {filters.map((filter) => (

        <button
          key={filter}
          onClick={() =>
            onChange(filter)
          }
          className={`px-4 py-2 rounded-lg transition ${
            value === filter
              ? "bg-cyan-500 text-slate-950"
              : "bg-slate-900 border border-slate-800"
          }`}
        >
          {filter}
        </button>

      ))}

    </div>
  );
}