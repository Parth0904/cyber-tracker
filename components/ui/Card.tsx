import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", hoverable = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-lg border border-border-subtle bg-card p-4 transition-all duration-200 ease-out text-zinc-200
          ${hoverable ? "hover:-translate-y-[1px] hover:border-accent-cyan hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]" : ""}
          ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";