"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function NewLearningTopicPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      await fetch("/api/learning/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicName: name, onlyCreate: true }),
      });
      router.push("/learning");
      router.refresh();
    } catch (err) {
      console.error("Failed to deploy new learning topic:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6 text-zinc-200">
      {/* Navigation Header */}
      <div className="flex items-center gap-3">
        <Button variant="secondary" className="p-2 h-auto" onClick={() => router.push("/learning")}>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Button>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-mono flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-success-emerald" /> Track // New Study Topic
          </h1>
          <p className="text-[11px] text-zinc-500">Initialize a permanent container to accumulate learning time.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Panel>
          <div className="space-y-4 font-mono text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white border-b border-border-subtle pb-2 font-mono">
              Topic Parameters
            </h3>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono text-zinc-500 uppercase">Topic Name</label>
              <Input
                placeholder="e.g., ARM Exploitation, WebSockets Security..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>
        </Panel>

        <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle font-mono text-xs">
          <Button type="button" variant="secondary" onClick={() => router.push("/learning")}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading} className="px-6 bg-success-emerald text-black border-success-emerald hover:opacity-90 font-bold">
            Create Topic
          </Button>
        </div>
      </form>
    </div>
  );
}
