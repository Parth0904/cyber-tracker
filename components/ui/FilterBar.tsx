type Props = {
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

export default function FilterBar({
  value,
  options,
  onChange,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">

      {options.map((option) => (

        <button
          key={option}
          onClick={() =>
            onChange(option)
          }
          className={`
          rounded-xl
          px-4
          py-2
          transition-all
          ${
            value === option
              ? "bg-cyan-500 text-slate-950"
              : "border border-slate-800 bg-slate-900 hover:border-cyan-500"
          }
          `}
        >

          {option}

        </button>

      ))}

    </div>
  );
}