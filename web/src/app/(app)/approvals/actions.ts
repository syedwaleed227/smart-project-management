"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function decideApproval(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const approvalId = String(formData.get("approval_id") ?? "");
  const decision = String(formData.get("decision") ?? ""); // approved | rejected
  const reason = String(formData.get("reason") ?? "").trim();
  if (!approvalId || !["approved", "rejected"].includes(decision))
    throw new Error("Invalid approval decision");

  const { data: approval, error } = await supabase
    .from("approvals")
    .update({ status: decision })
    .eq("id", approvalId)
    .select("entity_type, entity_id")
    .single();
  if (error) throw new Error(error.message);

  // Reflect the decision on the linked entity.
  if (approval?.entity_type === "expense") {
    await supabase
      .from("expenses")
      .update({ status: decision === "approved" ? "approved" : "rejected" })
      .eq("id", approval.entity_id);
  } else if (approval?.entity_type === "leave") {
    await supabase
      .from("leaves")
      .update({ status: decision === "approved" ? "approved" : "rejected" })
      .eq("id", approval.entity_id);
  }

  // Record the decision on a step row for the approval history.
  await supabase.from("approval_steps").insert({
    approval_id: approvalId,
    position: 1,
    type: "sequential",
    approver_ref: { kind: "user", value: user.id },
    status: decision,
    decided_by: user.id,
    decision,
    reason: reason || null,
    decided_at: new Date().toISOString(),
  });

  revalidatePath("/approvals");
  revalidatePath("/expenses");
}
