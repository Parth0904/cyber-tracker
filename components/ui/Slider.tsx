import * as React from "react";

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  suffix?: string;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className = "", label, suffix = "", min = "0", max = "100", value, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {(label || value !== undefined) && (
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-zinc-400">{label}</span>
            <span className="text-zinc-200 font-mono">{value}{suffix}</span>
          </div>
        )}
        <input
          type="range"
          ref={ref}
          min={min}
          max={max}
          value={value}
          className={`w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-accent-cyan focus:outline-none ${className}`}
          {...props}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";