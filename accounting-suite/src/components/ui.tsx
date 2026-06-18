import { STATUS_COLORS, PRIORITY_COLORS } from "@/lib/domain";
import { titleCase } from "@/lib/format";

export function StatusBadge({ value }: { value: string }) {
  return <span className={`badge ${STATUS_COLORS[value] ?? "bg-slate-100 text-slate-700"}`}>{titleCase(value)}</span>;
}

export function PriorityBadge({ value }: { value: string }) {
  return <span className={`badge ${PRIORITY_COLORS[value] ?? "bg-slate-100 text-slate-700"}`}>{titleCase(value)}</span>;
}

export function Avatar({ name, color }: { name: string; color?: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ backgroundColor: color ?? "#64748b" }}
      title={name}
    >
      {initials}
    </span>
  );
}

export function Metric({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-2 text-3xl font-semibold ${accent ?? "text-slate-900"}`}>{value}</div>
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="card p-8 text-center text-sm text-slate-500">{children}</div>;
}
