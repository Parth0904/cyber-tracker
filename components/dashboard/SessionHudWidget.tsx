"use client";

import * as React from "react";
import { Play, Pause, Square, Layers, Terminal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type ActiveSessionState = {
  id: number;
  targetId: string;
  targetName: string;
  type: string;
  startedAt: string;
  description: string;
};

export function SessionHudWidget() {
  const [active, setActive] = React.useState<ActiveSessionState | null>(null);
  const [elapsed, setElapsed] = React.useState("00:00:00");
  const [isPaused, setIsPaused] = React.useState(false);

  React.useEffect(() => {
    // Poll local storage or session endpoint to capture status across tab navigations
    async function checkActiveSession() {
      try {
        const res = await fetch("/api/sessions");
        if (res.ok) {
          const data = await res.json();
          if (data?.active) {
            setActive(data.active);
            setIsPaused(data.isPaused || false);
          } else {
            setActive(null);
          }
        }
      } catch (err) {
        console.error("Session sync fault:", err);
      }
    }
    checkActiveSession();
    const interval = setInterval(checkActiveSession, 10000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (!active || isPaused) return;
    
    const start = new Date(active.startedAt).getTime();
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = now - start;
      
      const hrs = Math.floor(diff / 3600000).toString().padStart(2, "0");
      const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, "0");
      const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
      
      setElapsed(`${hrs}:${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [active, isPaused]);

  if (!active) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black border border-accent-cyan/40 rounded-lg p-4 shadow-2xl w-80 font-mono text-xs text-zinc-200 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-2">
        <div className="flex items-center gap-1.5 text-accent-cyan">
          <Terminal size={12} className="animate-pulse" />
          <span className="font-bold uppercase tracking-tight text-[10px]">Active Session</span>
        </div>
        <span className="text-white text-sm font-bold tracking-tight">{elapsed}</span>
      </div>

      <div className="space-y-1 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-zinc-400 font-sans font-medium truncate max-w-[160px]">
            {active.targetName || (active as any).topicName || "Topic"}
          </span>
          <Badge variant={active.type === "Hunting" ? "cyan" : active.type === "Learning" ? "success" : "neutral"}>
            {active.type}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {isPaused ? (
          <Button variant="secondary" className="h-7 text-[10px] gap-1" onClick={() => setIsPaused(false)}>
            <Play size={10} fill="currentColor" /> Resume
          </Button>
        ) : (
          <Button variant="secondary" className="h-7 text-[10px] gap-1" onClick={() => setIsPaused(true)}>
            <Pause size={10} fill="currentColor" /> Pause
          </Button>
        )}
        <Button 
          variant="primary" 
          className="h-7 text-[10px] gap-1 bg-danger-rose text-white border-danger-rose hover:opacity-90"
          onClick={async () => {
            try {
              const url = (active as any).module === "Learning"
                ? `/api/learning/sessions/${active.id}/terminate`
                : `/api/sessions/${active.id}/terminate`;
              const res = await fetch(url, {
                method: "PATCH",
              });
              if (res.ok) {
                setActive(null);
                window.dispatchEvent(new Event("refresh-consistency-theme"));
                window.location.reload();
              }
            } catch (err) {
              console.error("Terminate active session error:", err);
            }
          }}
        >
          <Square size={10} fill="currentColor" /> Terminate
        </Button>
      </div>
    </div>
  );
}