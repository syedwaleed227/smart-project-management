"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createTask(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project_id = String(formData.get("project_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!project_id || !title) throw new Error("Project and title are required");

  const { error } = await supabase.from("tasks").insert({
    project_id,
    title,
    priority: String(formData.get("priority") ?? "medium"),
    due_date: nullable(formData.get("due_date")),
    assignee_id: user.id,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/projects/${project_id}`);
  revalidatePath("/tasks");
}

export async function updateTaskStatus(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const project_id = String(formData.get("project_id") ?? "");
  if (!id || !status) throw new Error("Missing task id or status");

  const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/tasks");
  if (project_id) revalidatePath(`/projects/${project_id}`);
}

function nullable(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return v === "" ? null : v;
}
