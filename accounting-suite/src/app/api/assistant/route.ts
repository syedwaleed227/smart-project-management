import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { askCopilot } from "@/lib/ai";
import { buildContextSummary } from "@/lib/insights";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question } = await req.json().catch(() => ({ question: "" }));
  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "Question required" }, { status: 400 });
  }

  const context = await buildContextSummary();
  const result = await askCopilot(question, context);
  return NextResponse.json(result);
}
