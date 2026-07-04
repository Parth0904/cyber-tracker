import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type = "text", icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500">
            {icon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={`flex h-8 w-full rounded-md border border-border-subtle bg-black px-3 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 transition-all focus:border-accent-cyan focus:outline-none ${icon ? "pl-8" : ""} ${className}`}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";