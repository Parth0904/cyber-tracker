"use client";

import { useState } from "react";

import Button from "@/components/ui/Button";

import TargetInfo from "./TargetInfo";
import TargetProgram from "./TargetProgram";
import TargetStatus from "./TargetStatus";
import TargetNotes from "./TargetNotes";

import { Target } from "@/lib/targets/types";

type Props = {
  initialData: Omit<Target, "id">;
  onSubmit: (target: Omit<Target, "id">) => void;
  submitLabel?: string;
};

export default function TargetForm({
  initialData,
  onSubmit,
  submitLabel = "Save Target",
}: Props) {

  const [target, setTarget] =
    useState(initialData);

  function update(
    field: keyof Omit<Target, "id">,
    value: any
  ) {
    setTarget((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();
    onSubmit(target);
  }

  return (

    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >

      <TargetInfo
        name={target.name}
        platform={target.platform}
        onChange={update}
      />

      <TargetProgram
        scope_url={target.scope_url}
        program_url={target.program_url}
        onChange={update}
      />

      <TargetStatus
        status={target.status}
        priority={target.priority}
        onChange={update}
      />

      <TargetNotes
        notes={target.notes}
        onChange={(value) =>
          update("notes", value)
        }
      />

      <Button
        type="submit"
        className="w-full"
      >
        {submitLabel}
      </Button>

    </form>

  );

}