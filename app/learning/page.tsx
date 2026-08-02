"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, BookOpen, Archive, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";

type TopicListItem = {
  id: number;
  name: string;
  archived?: number;
  totalMinutes: number;
  sessionsCount: number;
  lastStudiedAt: string | null;
  created_at: string;
};

export default function LearningDashboardPage() {
  const router = useRouter();
  const [topics, setTopics] = React.useState<TopicListItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const loadTopics = async () => {
    try {
      const response = await fetch("/api/learning/topics");
      if (response.ok) {
        const data = await response.json();
        setTopics(data || []);
      }
    } catch (err) {
      console.error("Failed to load learning topics:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { loadTopics(); }, []);

  const filteredTopics = (topics || []).filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase())
  );

  const activeTopics = filteredTopics.filter((t) => t.archived !== 1);
  const archivedTopics = filteredTopics.filter((t) => t.archived === 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        // INDEXING_LEARNING_TOPICS_ENVIRONMENT...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 text-zinc-200">

      {/* HEADER CONTROLS BAR — mirrors Target Mission Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-mono flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-success-emerald" /> Learning Study Center
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
            Your permanent learning history containers. Click any topic to manage its study timeline.
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-1.5 self-start md:self-auto h-9 text-xs bg-success-emerald text-black border-success-emerald hover:opacity-90 font-mono font-bold"
          onClick={() => router.push("/learning/new")}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Track New Topic</span>
        </Button>
      </div>

      {/* SEARCH */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-black p-3 border border-border-subtle rounded-lg">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      {/* GRID */}
      {topics.length === 0 ? (
        <EmptyState
          title="No Learning Topics Deployed"
          description="Your study timeline is clear. Initialize your workspace by tracking your first learning topic."
        />
      ) : (
        <div className="space-y-8">

          {/* ACTIVE TOPICS */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-500 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-success-emerald" /> Active Topics ({activeTopics.length})
            </h2>
            {activeTopics.length === 0 ? (
              <div className="text-[11px] font-mono text-zinc-600">// NO_ACTIVE_TOPICS_IN_GRID</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTopics.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => router.push(`/learning/${topic.id}`)}
                    className="group bg-card border border-border-subtle rounded-lg p-5 space-y-4 hover:border-success-emerald/60 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-semibold text-white group-hover:text-success-emerald transition-colors truncate max-w-xs font-mono uppercase">
                          {topic.name}
                        </h3>
                      </div>

                      {/* 3-column stat grid — mirrors targets card exactly */}
                      <div className="grid grid-cols-3 gap-1.5 py-4 border-y border-border-subtle/50 my-4 text-center font-mono">
                        <div>
                          <span className="block text-[8px] text-zinc-600 uppercase">Study Time</span>
                          <span className="text-xs font-semibold text-zinc-300">
                            {(topic.totalMinutes / 60).toFixed(1)}h
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-zinc-600 uppercase">Sessions</span>
                          <span className="text-xs font-semibold text-success-emerald">
                            {topic.sessionsCount ?? 0}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-zinc-600 uppercase">Last Studied</span>
                          <span className="text-xs font-semibold text-zinc-300 truncate block">
                            {topic.lastStudiedAt
                              ? new Date(topic.lastStudiedAt).toLocaleDateString([], { dateStyle: "short" })
                              : "Never"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer row — mirrors targets card footer */}
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-success-emerald" />
                        {topic.sessionsCount ?? 0} Sessions logged
                      </span>
                      <span className="group-hover:text-success-emerald transition-colors">
                        Open Timeline &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* VAULTED TOPICS — mirrors archived targets section */}
          {archivedTopics.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border-subtle">
              <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-600 flex items-center gap-2">
                <Archive className="w-3.5 h-3.5" /> Vaulted / Archived Topics ({archivedTopics.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
                {archivedTopics.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => router.push(`/learning/${topic.id}`)}
                    className="group bg-card border border-border-subtle rounded-lg p-5 space-y-4 hover:border-success-emerald/40 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-semibold text-zinc-400 group-hover:text-success-emerald transition-colors truncate max-w-xs font-mono uppercase">
                          {topic.name}
                        </h3>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 py-4 border-y border-border-subtle/50 my-4 text-center font-mono">
                        <div>
                          <span className="block text-[8px] text-zinc-600 uppercase">Study Time</span>
                          <span className="text-xs font-semibold text-zinc-400">
                            {(topic.totalMinutes / 60).toFixed(1)}h
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-zinc-600 uppercase">Sessions</span>
                          <span className="text-xs font-semibold text-zinc-400">
                            {topic.sessionsCount ?? 0}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-zinc-600 uppercase">Last Studied</span>
                          <span className="text-xs font-semibold text-zinc-400 truncate block">
                            {topic.lastStudiedAt
                              ? new Date(topic.lastStudiedAt).toLocaleDateString([], { dateStyle: "short" })
                              : "Never"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-zinc-600 font-mono">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {topic.sessionsCount ?? 0} Sessions logged
                      </span>
                      <span className="group-hover:text-success-emerald transition-colors">
                        Open Timeline &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
