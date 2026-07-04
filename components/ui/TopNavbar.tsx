import * as React from "react";

export interface TopNavbarProps {
  logo?: React.ReactNode;
  navigation?: React.ReactNode;
  actions?: React.ReactNode;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ 
  logo, 
  navigation, 
  actions 
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-black/70 backdrop-blur-md">
      <div className="flex h-12 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          {logo && <div className="flex items-center text-white font-semibold text-xs tracking-tight">{logo}</div>}
          {navigation && <nav className="hidden md:flex items-center gap-4">{navigation}</nav>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
};