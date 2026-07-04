import * as React from "react";

export const Panel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-xl border border-border-subtle bg-panel p-6 text-zinc-200 shadow-sm ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Panel.displayName = "Panel";