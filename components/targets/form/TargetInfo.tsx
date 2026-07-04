import * as React from "react";
import { Input } from "@/components/ui/Input";

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
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange("name", e.target.value)
        }
      />

      <Input
        placeholder="Platform (HackerOne, Bugcrowd...)"
        value={platform}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange("platform", e.target.value)
        }
      />

    </div>
  );
}