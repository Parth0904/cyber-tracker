type Props = {
  status: string;
  priority: string;
  onChange: (field: string, value: string) => void;
};

export default function TargetStatus({
  status,
  priority,
  onChange,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">

      <select
        value={status}
        onChange={(e) =>
          onChange("status", e.target.value)
        }
        className="rounded-xl border border-slate-800 bg-slate-950 p-3"
      >
        <option>Recon</option>
        <option>Testing</option>
        <option>Reporting</option>
        <option>Paused</option>
        <option>Completed</option>
      </select>

      <select
        value={priority}
        onChange={(e) =>
          onChange("priority", e.target.value)
        }
        className="rounded-xl border border-slate-800 bg-slate-950 p-3"
      >
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
        <option>Critical</option>
      </select>

    </div>
  );
}