import * as React from "react";

export interface ProgressRingProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number;
  value: number; // 0 to 100
  variant?: "cyan" | "success";
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  size = 36,
  strokeWidth = 3.5,
  value,
  variant = "cyan",
  className = "",
  ...props
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (clampedValue / 100) * circumference;

  const colors = {
    cyan: "stroke-accent-cyan",
    success: "stroke-success-emerald",
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`transform -rotate-90 ${className}`}
      {...props}
    >
      {/* Track Ring */}
      <circle
        className="stroke-zinc-800/60"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      {/* Progress Indicator Ring */}
      <circle
        className={`transition-all duration-500 ease-out ${colors[variant]}`}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
    </svg>
  );
};
ProgressRing.displayName = "ProgressRing";