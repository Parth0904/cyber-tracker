import * as React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", label, ...props }, ref) => {
    return (
      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          ref={ref}
          className={`appearance-none h-4 w-4 rounded border border-border-subtle bg-black checked:bg-accent-cyan checked:border-accent-cyan flex items-center justify-center transition-all cursor-pointer focus:outline-none relative before:content-['✓'] before:absolute before:text-[10px] before:text-black before:font-bold before:opacity-0 checked:before:opacity-100 ${className}`}
          {...props}
        />
        {label && <span className="text-xs text-zinc-400 font-medium">{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";