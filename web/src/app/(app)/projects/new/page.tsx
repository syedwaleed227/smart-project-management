import Link from "next/link";
import { requireUser, isManager } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { createProject } from "../actions";
import type { Department } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, code, type, head_user_id, status")
    .eq("status", "active")
    .order("name");

  const canCreate = isManager(user);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New project" subtitle="Create a project and become its owner." />

      {!canCreate ? (
        <Card>
          <p className="text-sm text-slate-500">
            You don&apos;t have permission to create projects. Ask a manager or
            department head.
          </p>
        </Card>
      ) : (
        <Card>
          <form action={createProject} className="space-y-4">
            <Field label="Project name" required>
              <input name="name" required className="field" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Code">
                <input name="code" placeholder="e.g. APL-2026" className="field" />
              </Field>
              <Field label="Department">
                <select name="department_id" className="field" defaultValue="">
                  <option value="">— None —</option>
                  {(departments as Department[] | null)?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Category">
                <select name="category" className="field" defaultValue="internal">
                  <option value="internal">Internal</option>
                  <option value="client">Client</option>
                  <option value="rnd">R&amp;D</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="marketing">Marketing</option>
                </select>
              </Field>
              <Field label="Priority">
                <select name="priority" className="field" defaultValue="medium">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Start date">
                <input type="date" name="start_date" className="field" />
              </Field>
              <Field label="Deadline">
                <input type="date" name="deadline" className="field" />
              </Field>
            </div>

            <Field label="Description">
              <textarea name="description" rows={3} className="field" />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <Link
                href="/projects"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                Create project
              </button>
            </div>
          </form>
        </Card>
      )}

      <style>{`
        .field {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(226 232 240);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}
