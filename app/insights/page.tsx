"use client";

import * as React from "react";
import { Brain, Send, Sparkles, TrendingUp, Terminal } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

type AiInsight = { pattern: string; confidence: number; metricImpact: string; rationale: string };
type MentorGoal = { id: string; targetObjective: string; rationale: string; status: "pending" | "achieved" };
type StrategicReview = { summary: string; victories: string[]; blockers: string[]; focusDirectives: string[] };
type ChatMessage = { sender: "user" | "mentor"; text: string; timestamp: string };

export default function AiIntelligenceTerminal() {
  const [reviewPeriod, setReviewPeriod] = React.useState<"daily" | "weekly" | "monthly">("weekly");
  const [review, setReview] = React.useState<StrategicReview | null>(null);
  const [patterns, setPatterns] = React.useState<AiInsight[]>([]);
  const [goals, setGoals] = React.useState<MentorGoal[]>([]);
  const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = React.useState("");
  
  const [loadingText, setLoadingText] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);

  React.useEffect(() => {
    async function syncAiTelemetryStream() {
      setLoadingText(true);
      try {
        const res = await fetch(`/api/insights?period=${reviewPeriod}`);
        if (res.ok) {
          const json = await res.json();
          setReview(json.review || null);
          setPatterns(json.patterns || []);
          setGoals(json.goals || []);
        }
      } catch (err) {
        console.error("AI Insights data pull failure:", err);
      } finally {
        setLoadingText(false);
      }
    }
    syncAiTelemetryStream();
  }, [reviewPeriod]);

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userPrompt = inputMessage;
    setInputMessage("");
    
    setChatHistory(prev => [...prev, { sender: "user", text: userPrompt, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setIsSending(true);

    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt, timeframe: reviewPeriod })
      });

      if (res.ok) {
        const json = await res.json();
        setChatHistory(prev => [...prev, { sender: "mentor", text: json.reply || json.text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      }
    } catch (err) {
      console.error("Coach thread transmission fault:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (loadingText) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-xs text-zinc-500 uppercase tracking-widest animate-pulse">
        // DEPLOYING_AI_MENTOR_ANALYTIC_ENGINES...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-zinc-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-mono flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent-cyan animate-pulse" /> Strategic AI Intelligence Hub
          </h1>
        </div>

        <div className="flex items-center bg-black border border-border-subtle p-1 rounded-md self-start md:self-auto font-mono text-[10px]">
          {(["daily", "weekly", "monthly"] as const).map((period) => (
            <button key={period} onClick={() => setReviewPeriod(period)} className={`px-3 py-1 uppercase rounded ${reviewPeriod === period ? "bg-white text-black font-bold" : "text-zinc-500"}`}>
              {period} AUDIT
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Panel>
            <div className="mb-4 border-b border-border-subtle pb-2 flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase text-zinc-400 flex items-center gap-1.5"><Sparkles size={13}/> Senior Mentor Review Triage</h3>
            </div>
            {!review ? (
              <EmptyState title="Review Generation Pending" description="Insufficient hunting timelines tracked during this interval zone." />
            ) : (
              <div className="space-y-4 text-xs font-sans">
                <p className="text-zinc-300 leading-relaxed italic border-l-2 border-accent-cyan pl-3">"{review.summary}"</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 font-mono text-[11px]">
                  <div className="bg-zinc-950 p-3 rounded border border-border-subtle/40">
                    <span className="text-success-emerald font-bold uppercase block">✓ Victories</span>
                    <ul className="space-y-1 list-disc pl-4 text-zinc-400 font-sans text-xs">
                      {review.victories.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded border border-border-subtle/40">
                    <span className="text-danger-rose font-bold uppercase block">✗ Blockers</span>
                    <ul className="space-y-1 list-disc pl-4 text-zinc-400 font-sans text-xs">
                      {review.blockers.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <Panel className="flex flex-col h-[400px] p-0 overflow-hidden bg-black border border-border-subtle">
            <div className="p-3 bg-zinc-950 border-b border-border-subtle">
              <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5"><Terminal size={12}/> Interactive AI Coach Terminal</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}>
                  <div className={`p-2.5 rounded text-xs ${msg.sender === "user" ? "bg-accent-cyan text-black" : "bg-zinc-950 border border-border-subtle text-zinc-300"}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isSending && <div className="text-[10px] font-mono text-zinc-600 animate-pulse">// MENTOR_IS_COMPUTING...</div>}
            </div>
            <form onSubmit={handleSendPrompt} className="p-2 bg-zinc-950 border-t border-border-subtle flex gap-2">
              <Input placeholder="Ask mentor..." value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} className="h-8 text-xs font-sans" required />
              <button type="submit" disabled={isSending} className="p-1.5 bg-zinc-900 text-accent-cyan border border-border-subtle rounded-md"><Send size={12} /></button>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
}