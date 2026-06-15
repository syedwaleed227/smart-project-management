"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Amount above which an expense must be routed for approval. Below this it is
// auto-approved; above it, the database workflow engine (start_approval) picks
// the matching workflow and routes it to the right approvers.
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
  const department_id = nullable(formData.get("department_id"));
  const needsApproval = amount > AUTO_APPROVAL_THRESHOLD;

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      amount,
      tax: Number(formData.get("tax") ?? 0),
      category: nullable(formData.get("category")),
      description: nullable(formData.get("description")),
      project_id,
      department_id,
      requester_id: user.id,
      status: needsApproval ? "pending_approval" : "approved",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // Hand off to the workflow engine, which creates the approval + steps and
  // notifies the first approvers.
  if (needsApproval) {
    const { data: approvalId, error: rpcError } = await supabase.rpc(
      "start_approval",
      {
        p_entity_type: "expense",
        p_entity_id: expense.id,
        p_amount: amount,
        p_department_id: department_id,
      },
    );
    if (rpcError) throw new Error(rpcError.message);
    if (approvalId) {
      await supabase
        .from("expenses")
        .update({ approval_id: approvalId })
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
