import * as React from "react";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  variant?: "cyan" | "success";
}

export const Progress: React.FC<ProgressProps> = ({ 
  className = "", 
  value, 
  variant = "cyan", 
  ...props 
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  
  const colors = {
    cyan: "bg-accent-cyan",
    success: "bg-success-emerald"
  };

  return (
    <div className={`h-1.5 w-full rounded-full bg-zinc-800/80 overflow-hidden ${className}`} {...props}>
      <div
        className={`h-full transition-all duration-300 ease-out ${colors[variant]}`}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
};