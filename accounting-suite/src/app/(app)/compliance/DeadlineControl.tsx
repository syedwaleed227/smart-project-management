"use client";

import { useTransition } from "react";
import { setDeadlineStatus } from "../actions";

const STATUSES = ["UPCOMING", "DUE_SOON", "OVERDUE", "SUBMITTED", "CLOSED"];

export function DeadlineControl({ id, current }: { id: string; current: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={current}
      disabled={pending}
      onChange={(e) => startTransition(() => setDeadlineStatus(id, e.target.value))}
      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
      ))}
    </select>
  );
}
