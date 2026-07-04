import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "cyan" | "success" | "warning" | "danger";
}

export const Badge: React.FC<BadgeProps> = ({ 
  className = "", 
  variant = "neutral", 
  children, 
  ...props 
}) => {
  const variants = {
    neutral: "bg-zinc-800 text-zinc-400 border-zinc-700/50",
    cyan: "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20",
    success: "bg-success-emerald/10 text-success-emerald border-success-emerald/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-danger-rose/10 text-danger-rose border-danger-rose/20"
  };

  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium font-mono border ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};