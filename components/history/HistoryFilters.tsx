"use client";

import * as React from "react";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";

type FilterProps = {
  currentCategory: string;
  onCategoryChange: (id: string) => void;
  onClearAll: () => void;
};

export default function HistoryFilters({ currentCategory, onCategoryChange, onClearAll }: FilterProps) {
  const categories = [
    { id: "all", label: "All Operations" },
    { id: "target", label: "Target Logs" },
    { id: "habit", label: "Habit Tracker" },
    { id: "system", label: "System Audits" },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
      {/* Category Tabs Selection */}
      <Tabs 
        items={categories} 
        activeId={currentCategory} 
        onChange={onCategoryChange} 
      />

      {/* Auxiliary Reset Trigger */}
      <Button 
        variant="ghost" 
        onClick={onClearAll} 
        className="h-7 text-[11px] self-end sm:self-auto"
      >
        Reset Filters
      </Button>
    </div>
  );
}