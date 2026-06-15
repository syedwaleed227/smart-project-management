"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Amount above which an expense must be routed for approval. In a full build
// this comes from the department's approval thresholds / workflow conditions.
const AUTO_APPROVAL_THRESHOLD = 1000;

export async function createExpense(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const amount = Number(formData.get("amount") ?? 0);
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error("Enter a valid amount");

  const project_id = nullable(formData.get("project_id"));
  const needsApproval = amount > AUTO_APPROVAL_THRESHOLD;

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      amount,
      tax: Number(formData.get("tax") ?? 0),
      category: nullable(formData.get("category")),
      description: nullable(formData.get("description")),
      project_id,
      department_id: nullable(formData.get("department_id")),
      requester_id: user.id,
      status: needsApproval ? "pending_approval" : "approved",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // Open an approval record so it shows up in the Approval Center.
  if (needsApproval) {
    const { data: approval } = await supabase
      .from("approvals")
      .insert({
        entity_type: "expense",
        entity_id: expense.id,
        status: "pending",
        current_step: 1,
        requested_by: user.id,
      })
      .select("id")
      .single();
    if (approval) {
      await supabase
        .from("expenses")
        .update({ approval_id: approval.id })
        .eq("id", expense.id);
    }
  }

  revalidatePath("/expenses");
  revalidatePath("/approvals");
  redirect("/expenses");
}

function nullable(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return v === "" ? null : v;
}
