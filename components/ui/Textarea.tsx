import * as React from "react";
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`flex min-h-[60px] w-full rounded-md border border-border-subtle bg-black px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 transition-all focus:border-accent-cyan focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";