import { SectionTitle } from "@/components/ui";
import { aiEnabled } from "@/lib/ai";
import { Chat } from "./Chat";

export const dynamic = "force-dynamic";

export default function AssistantPage() {
  return (
    <div className="space-y-4">
      <SectionTitle
        title="AI Co-pilot"
        subtitle="Grounded in your live firm data — clients, engagements, tasks and deadlines"
        action={
          <span className={`badge ${aiEnabled() ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
            {aiEnabled() ? "🤖 Live AI" : "🤖 Offline mode"}
          </span>
        }
      />
      <Chat />
    </div>
  );
}
