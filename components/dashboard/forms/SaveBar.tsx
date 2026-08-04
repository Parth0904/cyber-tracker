"use client";

import * as React from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Props = {
  isVisible: boolean;
  isSaving: boolean;
  saveSuccess: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

export function SaveBar({ isVisible, isSaving, saveSuccess, onSave, onDiscard }: Props) {
  if (!isVisible && !saveSuccess) return null;

  return (
    <div 
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 
        bg-zinc-950 px-5 py-4 min-w-[340px] md:min-w-[480px] font-mono text-xs rounded-xl
        border shadow-[0_0_30px_rgba(0,0,0,0.85)] transition-all duration-300 ease-out
        ${saveSuccess 
          ? "border-success-emerald animate-in fade-in zoom-in-95 duration-150" 
          : "border-warning-amber/80 ring-2 ring-warning-amber/10 animate-in fade-in slide-in-from-bottom-6 bounce-in"
        }`}
    >
      <div className="flex items-center justify-between gap-6">
        
        {/* TELEMETRY STATE MESSAGING */}
        <div className="flex items-center gap-2.5 min-w-0">
          {saveSuccess ? (
            <div className="flex items-center gap-2 text-success-emerald">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success-emerald/10 border border-success-emerald/30">
                <ShieldCheck size={13} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="font-bold uppercase tracking-wider block text-[11px]">METRICS SYNCED</span>
                <span className="text-[9px] text-zinc-500 block -mt-0.5">DB transaction committed clean</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-warning-amber">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-warning-amber/10 border border-warning-amber/30 animate-pulse">
                <ShieldAlert size={13} />
              </div>
              <div>
                <span className="font-bold uppercase tracking-wider block text-[11px]">UNCOMMITTED BUFFER</span>
                <span className="text-[9px] text-zinc-400 block -mt-0.5">Pending performance entries modified</span>
              </div>
            </div>
          )}
        </div>

        {/* INTERACTIVE CONTROLS ENGINE */}
        {!saveSuccess && (
          <div className="flex items-center gap-3 shrink-0">
            <button 
              type="button" 
              onClick={onDiscard} 
              disabled={isSaving}
              className="text-[11px] text-zinc-500 font-bold uppercase tracking-wide hover:text-zinc-300 transition-colors disabled:opacity-40 px-2 py-1"
            >
              Discard
            </button>
            <Button 
              variant="primary" 
              className="h-8 text-[11px] px-4 bg-warning-amber text-black border-warning-amber hover:bg-warning-amber/90 font-black tracking-wide uppercase shadow-[0_2px_10px_rgba(245,158,11,0.2)] rounded-md transition-all active:scale-[0.98]"
              onClick={onSave}
              isLoading={isSaving}
            >
              Commit Changes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}