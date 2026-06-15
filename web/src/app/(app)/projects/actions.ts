"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createProject(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Project name is required");

  const payload = {
    name,
    code: emptyToNull(formData.get("code")),
    category: String(formData.get("category") ?? "internal"),
    priority: String(formData.get("priority") ?? "medium"),
    status: "draft",
    department_id: emptyToNull(formData.get("department_id")),
    start_date: emptyToNull(formData.get("start_date")),
    deadline: emptyToNull(formData.get("deadline")),
    description: emptyToNull(formData.get("description")),
    owner_id: user.id,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return v === "" ? null : v;
}
