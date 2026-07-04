import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "secondary", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-cyan disabled:pointer-events-none disabled:opacity-50 h-8 px-3";
    
    const variants = {
      primary: "bg-white text-black hover:bg-zinc-200 shadow-sm",
      secondary: "bg-card text-zinc-200 border border-border-subtle hover:border-accent-cyan hover:text-white shadow-sm",
      danger: "bg-danger-rose/10 text-danger-rose border border-danger-rose/20 hover:bg-danger-rose/20",
      ghost: "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
      icon: "h-8 w-8 p-0 text-zinc-400 border border-border-subtle bg-card hover:border-accent-cyan hover:text-white"
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : children}
      </button>
    );
  }
);
Button.displayName = "Button";