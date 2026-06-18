"use client";

import { useTransition } from "react";
import { setEngagementStatus } from "../../actions";

const STATUSES = ["PLANNING", "IN_PROGRESS", "PENDING_CLIENT", "REVIEW", "FILED", "COMPLETED", "ON_HOLD", "CANCELLED"];

export function StatusControl({ engagementId, current }: { engagementId: string; current: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={current}
      disabled={pending}
      onChange={(e) => startTransition(() => setEngagementStatus(engagementId, e.target.value as any))}
      className="input max-w-xs"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
      ))}
    </select>
  );
}
