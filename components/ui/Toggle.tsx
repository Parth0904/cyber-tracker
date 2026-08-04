import * as React from "react";

export interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ className = "", label, checked, onChange, ...props }, ref) => {
    return (
      <label className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}>
        <div className="relative">
          <input
            type="checkbox"
            ref={ref}
            checked={checked}
            onChange={onChange}
            className="sr-only peer"
            {...props}
          />
          <div className="w-7 h-4 bg-zinc-800 rounded-full transition-colors peer-checked:bg-accent-cyan border border-border-subtle" />
          <div className="absolute top-[2px] left-[2px] w-3 h-3 bg-zinc-400 rounded-full transition-transform peer-checked:translate-x-3 peer-checked:bg-black" />
        </div>
        {label && <span className="text-xs text-zinc-400 font-medium">{label}</span>}
      </label>
    );
  }
);
Toggle.displayName = "Toggle";