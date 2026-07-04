import * as React from "react";
import { Textarea } from "@/components/ui/Textarea";

type Props = {
  notes: string;
  onChange: (value: string) => void;
};

export default function TargetNotes({
  notes,
  onChange,
}: Props) {
  return (
    <Textarea
      rows={8}
      placeholder="Notes..."
      value={notes}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
        onChange(e.target.value)
      }
    />
  );
}