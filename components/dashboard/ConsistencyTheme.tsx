"use client";

import * as React from "react";

type ConsistencyState = "green" | "amber" | "red";

type ConsistencyContextType = {
  state: ConsistencyState;
  refresh: () => Promise<void>;
};

const ConsistencyContext = React.createContext<ConsistencyContextType | undefined>(undefined);

export function ConsistencyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ConsistencyState>("red"); // default to lowest state

  const refresh = React.useCallback(async () => {
    if (typeof window !== "undefined" && window.location.pathname === "/login") return;
    try {
      const res = await fetch("/api/consistency");
      if (res.ok) {
        const data = await res.json();
        const level = data.state as ConsistencyState;
        
        let color = "#ef4444"; // red
        if (level === "green") {
          color = "#22c55e"; // green
        } else if (level === "amber") {
          color = "#f59e0b"; // amber
        }

        // Apply consistency color to the document root element
        document.documentElement.style.setProperty("--accent-color", color);
        setState(level);
      }
    } catch (err) {
      console.error("Failed to load consistency theme:", err);
    }
  }, []);

  React.useEffect(() => {
    refresh();

    // Listen to custom window event to sync dynamic events
    const handleRefresh = () => {
      refresh();
    };
    window.addEventListener("refresh-consistency-theme", handleRefresh);
    return () => {
      window.removeEventListener("refresh-consistency-theme", handleRefresh);
    };
  }, [refresh]);

  return (
    <ConsistencyContext.Provider value={{ state, refresh }}>
      {children}
    </ConsistencyContext.Provider>
  );
}

export function useConsistency() {
  const context = React.useContext(ConsistencyContext);
  if (context === undefined) {
    throw new Error("useConsistency must be used within a ConsistencyProvider");
  }
  return context;
}
