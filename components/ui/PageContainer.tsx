import * as React from "react";

export const PageContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => {
  return (
    <main className={`min-h-screen bg-black text-zinc-200 px-4 py-6 md:px-8 max-w-7xl mx-auto space-y-6 ${className}`} {...props}>
      {children}
    </main>
  );
};