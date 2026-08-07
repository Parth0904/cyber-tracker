"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Terminal, Target, Layers, 
  FileText, Activity, Brain, History, BookOpen, Settings
} from "lucide-react";

export default function TopNavbar() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  // FIXED: Integrated the "/history" path into the core tracking array
  const navItems = [
    { href: "/", label: "Console", icon: <Terminal size={13} /> },
    { href: "/targets", label: "Targets", icon: <Target size={13} /> },
    { href: "/learning", label: "Learning", icon: <BookOpen size={13} /> },
    { href: "/sessions", label: "Sessions", icon: <Layers size={13} /> },
    { href: "/reviews", label: "Weekly Review", icon: <FileText size={13} /> },
    { href: "/history", label: "History Log", icon: <History size={13} /> },
    { href: "/analytics", label: "Analytics", icon: <Activity size={13} /> },
    { href: "/insights", label: "Performance Intelligence", icon: <Brain size={13} /> },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur-md border-b border-border-subtle font-mono text-xs">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-12 items-center justify-between gap-4">
          
          {/* PLATFORM BRAND MARQUEE */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-5 w-5 rounded bg-white flex items-center justify-center">
              <span className="text-black font-black text-[10px] tracking-tighter">CT</span>
            </div>
            <span className="text-white font-bold tracking-wider hidden sm:inline uppercase text-[11px]">
              Cyber_Tracker
            </span>
          </Link>

          {/* DYNAMIC SCROLLABLE NAVIGATION LINKS RUNWAY */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1 mask-image-fade">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap border text-[11px]
                    ${isActive 
                      ? "bg-zinc-900 border-border-subtle text-accent-cyan font-bold" 
                      : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-800"
                    }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* STATUS CHANNEL TELEMETRY BADGE & SETTINGS */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-zinc-600 bg-zinc-950 px-2 py-1 border border-border-subtle rounded">
              <div className="h-1.5 w-1.5 rounded-full bg-success-emerald animate-pulse" />
              <span>CORE_ONLINE</span>
            </div>
            
            <Link
              href="/settings"
              className={`p-1.5 rounded-md border transition-all text-zinc-500 hover:text-zinc-300 hover:border-zinc-800
                ${pathname === "/settings" 
                  ? "bg-zinc-900 border-border-subtle text-accent-cyan" 
                  : "bg-transparent border-transparent"
                }`}
              title="Settings"
            >
              <Settings size={14} />
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}