"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

type HistorySearchProps = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
};

export default function HistorySearch({ value, onChange, placeholder = "Filter audit records by scope token..." }: HistorySearchProps) {
  return (
    <div className="w-full">
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        icon={<Search size={13} />}
      />
    </div>
  );
}