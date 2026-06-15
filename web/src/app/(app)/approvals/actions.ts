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

  // The workflow engine authorizes the caller, records the step decision,
  // advances/closes the approval, applies the outcome to the linked entity,
  // and fires notifications — all transactionally.
  const { error } = await supabase.rpc("decide_approval_step", {
    p_approval: approvalId,
    p_decision: decision,
    p_reason: reason || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/approvals");
  revalidatePath("/expenses");
}
