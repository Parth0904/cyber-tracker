import * as React from "react";

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ 
  items, 
  activeId, 
  onChange, 
  className = "" 
}) => {
  return (
    <div className={`flex border-b border-border-subtle overflow-x-auto scrollbar-none ${className}`}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-[2px] transition-colors whitespace-nowrap focus:outline-none
              ${isActive 
                ? "border-accent-cyan text-white font-semibold" 
                : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};