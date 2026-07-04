import Input from "@/components/ui/Input";

type Props = {
  name: string;
  platform: string;
  onChange: (field: string, value: string) => void;
};

export default function TargetInfo({
  name,
  platform,
  onChange,
}: Props) {
  return (
    <div className="space-y-4">

      <Input
        placeholder="Target Name"
        value={name}
        onChange={(e) =>
          onChange("name", e.target.value)
        }
      />

      <Input
        placeholder="Platform (HackerOne, Bugcrowd...)"
        value={platform}
        onChange={(e) =>
          onChange("platform", e.target.value)
        }
      />

    </div>
  );
}