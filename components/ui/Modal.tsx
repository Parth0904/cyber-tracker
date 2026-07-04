import * as React from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer
}) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Panel */}
      <div className="relative z-10 flex flex-col w-full max-w-md rounded-xl border border-border-subtle bg-panel shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>
          <Button variant="ghost" onClick={onClose} className="h-7 w-7 p-0 rounded-md">
            <X size={14} />
          </Button>
        </div>
        
        <div className="p-5 overflow-y-auto text-xs text-zinc-400 space-y-4 leading-relaxed">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border-subtle bg-black/20">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};