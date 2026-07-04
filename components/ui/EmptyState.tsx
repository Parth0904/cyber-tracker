import * as React from "react";
import { FolderOpen } from "lucide-react";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  className = "",
  title,
  description,
  action,
  icon,
  ...props
}) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-border-subtle rounded-lg bg-panel/30 min-h-[220px] ${className}`} 
      {...props}
    >
      <div className="text-zinc-600 mb-3">
        {icon || <FolderOpen size={28} strokeWidth={1.5} />}
      </div>
      <h3 className="text-xs font-semibold text-zinc-200 tracking-tight">{title}</h3>
      <p className="text-xs text-zinc-500 max-w-[260px] mt-1 mb-4 leading-relaxed">{description}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};