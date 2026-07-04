import Input from "@/components/ui/Input";

type Props = {
  scope_url: string;
  program_url: string;
  onChange: (field: string, value: string) => void;
};

export default function TargetProgram({
  scope_url,
  program_url,
  onChange,
}: Props) {
  return (
    <div className="space-y-4">

      <Input
        placeholder="Scope URL"
        value={scope_url}
        onChange={(e) =>
          onChange(
            "scope_url",
            e.target.value
          )
        }
      />

      <Input
        placeholder="Program URL"
        value={program_url}
        onChange={(e) =>
          onChange(
            "program_url",
            e.target.value
          )
        }
      />

    </div>
  );
}