import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ServiceLine } from "@prisma/client";
import { defaultTasksFor, serviceLabel } from "./domain";

const MODEL = process.env.AI_MODEL || "claude-opus-4-8";

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function client(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const SYSTEM_CONTEXT = `You are the AI co-pilot inside a practice-management system for an
accounting firm. The firm delivers bookkeeping, accounting, audit, corporate tax
(registration, filing, deregistration), VAT (registration, filing, deregistration)
and legal/corporate services. You help staff plan engagements, prioritise work,
hit statutory deadlines and collaborate. Be concise, practical and accurate.
Never invent legal/tax figures; describe process steps rather than giving binding advice.`;

export interface GeneratedTask {
  title: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

// Generate a task plan for an engagement. Falls back to the built-in playbook.
export async function generateTaskPlan(input: {
  serviceLine: ServiceLine;
  clientName: string;
  periodLabel?: string | null;
  context?: string | null;
}): Promise<{ tasks: GeneratedTask[]; source: "ai" | "playbook" }> {
  const ai = client();
  if (!ai) {
    return {
      tasks: defaultTasksFor(input.serviceLine).map((title) => ({ title, priority: "MEDIUM" })),
      source: "playbook",
    };
  }

  try {
    const prompt = `Create a practical, ordered task checklist to deliver this engagement.
Service line: ${serviceLabel(input.serviceLine)}
Client: ${input.clientName}
Period: ${input.periodLabel ?? "n/a"}
Extra context: ${input.context ?? "none"}

Return ONLY a JSON array of objects: [{"title": string, "priority": "LOW"|"MEDIUM"|"HIGH"|"URGENT"}].
6-9 concrete tasks. No prose, no markdown fences.`;

    const res = await ai.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_CONTEXT,
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const json = extractJson(text);
    const parsed = JSON.parse(json) as GeneratedTask[];
    if (Array.isArray(parsed) && parsed.length) {
      return { tasks: parsed.slice(0, 12), source: "ai" };
    }
  } catch {
    // fall through to playbook
  }
  return {
    tasks: defaultTasksFor(input.serviceLine).map((title) => ({ title, priority: "MEDIUM" })),
    source: "playbook",
  };
}

// Conversational co-pilot. `contextSummary` is a compact view of the firm's data.
export async function askCopilot(
  question: string,
  contextSummary: string,
): Promise<{ answer: string; source: "ai" | "fallback" }> {
  const ai = client();
  if (!ai) {
    return { answer: fallbackAnswer(question, contextSummary), source: "fallback" };
  }
  try {
    const res = await ai.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: `${SYSTEM_CONTEXT}\n\nHere is the current firm data you can reason over:\n${contextSummary}`,
      messages: [{ role: "user", content: question }],
    });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    return { answer: text || "I couldn't generate a response.", source: "ai" };
  } catch (e) {
    return { answer: fallbackAnswer(question, contextSummary), source: "fallback" };
  }
}

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

// Deterministic, offline answer so the assistant is useful with no API key.
function fallbackAnswer(question: string, contextSummary: string): string {
  return [
    "**AI co-pilot (offline mode)** — no `ANTHROPIC_API_KEY` is configured, so here is a",
    "data summary instead of a generated answer. Add a key in `.env` to enable full AI.",
    "",
    `_Your question:_ ${question}`,
    "",
    "**Current firm snapshot:**",
    contextSummary,
  ].join("\n");
}
