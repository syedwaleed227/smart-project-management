"use client";

import { useState, useTransition } from "react";
import { setTaskStatus } from "../../actions";
import { Avatar, PriorityBadge } from "@/components/ui";

type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "REVIEW" | "DONE";

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "TODO", label: "To do" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "BLOCKED", label: "Blocked" },
  { key: "REVIEW", label: "Review" },
  { key: "DONE", label: "Done" },
];

export interface BoardTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: string;
  aiGenerated: boolean;
  assigneeName?: string | null;
  assigneeColor?: string | null;
}

function TaskCard({ task }: { task: BoardTask }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<TaskStatus>(task.status);

  function move(next: TaskStatus) {
    setStatus(next);
    startTransition(() => setTaskStatus(task.id, next));
  }

  return (
    <div className={`card p-3 ${pending ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        {task.aiGenerated && <span title="AI generated" className="text-xs">🤖</span>}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <PriorityBadge value={task.priority} />
        {task.assigneeName ? <Avatar name={task.assigneeName} color={task.assigneeColor ?? undefined} /> : <span className="text-xs text-slate-400">Unassigned</span>}
      </div>
      <select
        value={status}
        onChange={(e) => move(e.target.value as TaskStatus)}
        className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
      >
        {COLUMNS.map((c) => (
          <option key={c.key} value={c.key}>{c.label}</option>
        ))}
      </select>
    </div>
  );
}

export function TaskBoard({ tasks }: { tasks: BoardTask[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {COLUMNS.map((col) => {
        const items = tasks.filter((t) => t.status === col.key);
        return (
          <div key={col.key} className="rounded-xl bg-slate-100/60 p-2">
            <div className="mb-2 flex items-center justify-between px-1 text-xs font-semibold uppercase text-slate-500">
              <span>{col.label}</span>
              <span className="rounded-full bg-white px-1.5">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((t) => <TaskCard key={t.id} task={t} />)}
              {items.length === 0 && <div className="px-1 py-3 text-center text-xs text-slate-400">—</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
