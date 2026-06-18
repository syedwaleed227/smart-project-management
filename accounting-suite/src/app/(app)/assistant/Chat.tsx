"use client";

import { useState, useRef, useEffect } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
  source?: string;
}

const SUGGESTIONS = [
  "What are my most urgent deadlines this week?",
  "Which engagements are at risk of slipping?",
  "Summarise the team's current workload.",
  "Draft a plan for a new VAT registration engagement.",
];

export function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your practice co-pilot. I can see your clients, engagements, tasks and deadlines. Ask me to prioritise work, summarise workload, flag risks, or plan an engagement.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.answer ?? data.error ?? "No response.", source: data.source }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network error — please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex h-[calc(100vh-12rem)] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-800"
              }`}
            >
              {m.content}
              {m.source && <div className="mt-1 text-[10px] opacity-60">via {m.source}</div>}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-slate-400">Thinking…</div>}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 px-5 pb-3">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-slate-100 p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the co-pilot…"
          className="input"
          disabled={loading}
        />
        <button className="btn-primary" disabled={loading}>Send</button>
      </form>
    </div>
  );
}
