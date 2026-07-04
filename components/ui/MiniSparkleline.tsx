import * as React from "react";

export interface MiniSparklineProps extends React.SVGProps<SVGSVGElement> {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  variant?: "cyan" | "success" | "danger";
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data,
  width = 120,
  height = 30,
  strokeWidth = 1.5,
  variant = "cyan",
  className = "",
  ...props
}) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min === 0 ? 1 : max - min;

  // Map historical array data into crisp coordinates inside the bounding box
  const points = data
    .map((val, index) => {
      const x = (index / (data.length - 1)) * width;
      // Invert Y axis so higher numbers climb higher towards the top border line
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const colors = {
    cyan: "stroke-accent-cyan",
    success: "stroke-success-emerald",
    danger: "stroke-danger-rose",
  };

  return (
    <svg 
      width={width} 
      height={height} 
      className={`overflow-visible ${className}`} 
      {...props}
    >
      <polyline
        fill="none"
        className={colors[variant]}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};
MiniSparkline.displayName = "MiniSparkline";