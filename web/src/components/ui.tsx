import { ReactNode } from "react";
import { titleCase } from "@/lib/format";

export function Card({
  title,
  children,
  action,
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {title && (
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

const TONE: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  blue: "bg-brand-50 text-brand-700 ring-brand-200",
  gray: "bg-slate-100 text-slate-600 ring-slate-200",
};

const STATUS_TONE: Record<string, keyof typeof TONE> = {
  active: "green",
  approved: "green",
  done: "green",
  completed: "green",
  paid: "green",
  in_progress: "blue",
  in_review: "blue",
  sent: "blue",
  pending: "amber",
  pending_approval: "amber",
  on_hold: "amber",
  todo: "gray",
  draft: "gray",
  at_risk: "red",
  blocked: "red",
  rejected: "red",
  overdue: "red",
  critical: "red",
  high: "amber",
};

export function Badge({
  children,
  tone,
}: {
  children: string;
  tone?: keyof typeof TONE;
}) {
  const t = tone ?? STATUS_TONE[children] ?? "gray";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE[t]}`}
    >
      {titleCase(children)}
    </span>
  );
}

export function Empty({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
