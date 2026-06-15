import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { createExpense } from "../actions";
import type { Project, Department } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewExpensePage() {
  await requireUser();
  const supabase = createSupabaseServerClient();
  const [{ data: projects }, { data: departments }] = await Promise.all([
    supabase.from("projects").select("id, name").order("name"),
    supabase
      .from("departments")
      .select("id, name")
      .eq("status", "active")
      .order("name"),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Submit expense"
        subtitle="Amounts over $1,000 are routed for approval automatically."
      />
      <Card>
        <form action={createExpense} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Amount <span className="text-rose-500">*</span>
              </span>
              <input
                type="number"
                name="amount"
                step="0.01"
                min="0.01"
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Tax
              </span>
              <input
                type="number"
                name="tax"
                step="0.01"
                min="0"
                defaultValue="0"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Category
            </span>
            <input
              name="category"
              placeholder="e.g. travel, software, materials"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Project
              </span>
              <select
                name="project_id"
                defaultValue=""
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">— None —</option>
                {(projects as Pick<Project, "id" | "name">[] | null)?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Department
              </span>
              <select
                name="department_id"
                defaultValue=""
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">— None —</option>
                {(departments as Pick<Department, "id" | "name">[] | null)?.map(
                  (d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Description
            </span>
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/expenses"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
              Submit
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
