"use client";

import * as React from "react";

type HabitOption = {
  id: string;
  name: string;
  icon?: React.ReactNode;
};

type HabitSelectorProps = {
  options: HabitOption[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function HabitSelector({ options, selectedId, onSelect }: HabitSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5 border-b border-border-subtle pb-3">
      {options.map((option) => {
        const isSelected = option.id === selectedId;
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all focus:outline-none border
              ${isSelected 
                ? "bg-white text-black border-white font-semibold shadow-sm" 
                : "bg-card text-zinc-400 border-border-subtle hover:border-zinc-700 hover:text-zinc-200"
              }`}
          >
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span>{option.name}</span>
          </button>
        );
      })}
    </div>
  );
}