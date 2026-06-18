"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { destroySession, getCurrentUser, authenticate, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateTaskPlan } from "@/lib/ai";
import type { ServiceLine, EngagementStatus, TaskStatus, Priority, Role } from "@prisma/client";

export async function logout() {
  destroySession();
  redirect("/login");
}

export async function createClient(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await prisma.client.create({
    data: {
      name: String(formData.get("name")),
      legalName: (formData.get("legalName") as string) || null,
      industry: (formData.get("industry") as string) || null,
      trn: (formData.get("trn") as string) || null,
      jurisdiction: (formData.get("jurisdiction") as string) || "UAE",
      fiscalYearEnd: (formData.get("fiscalYearEnd") as string) || null,
      contactName: (formData.get("contactName") as string) || null,
      contactEmail: (formData.get("contactEmail") as string) || null,
      contactPhone: (formData.get("contactPhone") as string) || null,
      riskLevel: (formData.get("riskLevel") as any) || "LOW",
    },
  });
  revalidatePath("/clients");
}

// Create an engagement AND auto-generate its task plan (AI or playbook).
export async function createEngagement(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const clientId = String(formData.get("clientId"));
  const serviceLine = String(formData.get("serviceLine")) as ServiceLine;
  const title = String(formData.get("title"));
  const periodLabel = (formData.get("periodLabel") as string) || null;
  const dueDateRaw = formData.get("dueDate") as string;
  const feeRaw = formData.get("feeAmount") as string;
  const managerId = (formData.get("managerId") as string) || null;
  const assigneeId = (formData.get("assigneeId") as string) || null;

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) redirect("/engagements");

  const count = await prisma.engagement.count();
  const reference = `ENG-2026-${String(count + 1).padStart(4, "0")}`;

  const plan = await generateTaskPlan({
    serviceLine,
    clientName: client.name,
    periodLabel,
    context: (formData.get("context") as string) || null,
  });

  const eng = await prisma.engagement.create({
    data: {
      reference,
      title,
      serviceLine,
      periodLabel,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      feeAmount: feeRaw ? Number(feeRaw) : null,
      clientId,
      managerId: managerId || user.id,
      progress: 0,
      tasks: {
        create: plan.tasks.map((t, i) => ({
          title: t.title,
          priority: (t.priority as Priority) || "MEDIUM",
          orderIndex: i,
          aiGenerated: plan.source === "ai",
          assigneeId: assigneeId || null,
          creatorId: user.id,
        })),
      },
    },
  });

  await prisma.activity.create({
    data: {
      action: `Engagement created (${plan.source === "ai" ? "AI-planned" : "playbook"})`,
      detail: title,
      userId: user.id,
      engagementId: eng.id,
    },
  });

  if (assigneeId) {
    await prisma.notification.create({
      data: { type: "ASSIGNMENT", title: "New engagement assigned", body: title, userId: assigneeId, link: `/engagements/${eng.id}` },
    });
  }

  redirect(`/engagements/${eng.id}`);
}

async function recomputeProgress(engagementId: string) {
  const tasks = await prisma.task.findMany({ where: { engagementId } });
  if (!tasks.length) return;
  const done = tasks.filter((t) => t.status === "DONE").length;
  await prisma.engagement.update({
    where: { id: engagementId },
    data: { progress: Math.round((done / tasks.length) * 100) },
  });
}

export async function setTaskStatus(taskId: string, status: TaskStatus) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const task = await prisma.task.update({ where: { id: taskId }, data: { status } });
  await recomputeProgress(task.engagementId);
  revalidatePath(`/engagements/${task.engagementId}`);
  revalidatePath("/tasks");
}

export async function addTask(engagementId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const count = await prisma.task.count({ where: { engagementId } });
  await prisma.task.create({
    data: {
      title: String(formData.get("title")),
      engagementId,
      orderIndex: count,
      creatorId: user.id,
      assigneeId: (formData.get("assigneeId") as string) || null,
      priority: (formData.get("priority") as Priority) || "MEDIUM",
    },
  });
  await recomputeProgress(engagementId);
  revalidatePath(`/engagements/${engagementId}`);
}

export async function setEngagementStatus(engagementId: string, status: EngagementStatus) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await prisma.engagement.update({ where: { id: engagementId }, data: { status, ...(status === "FILED" ? { filedDate: new Date() } : {}) } });
  await prisma.activity.create({ data: { action: `Status → ${status}`, userId: user.id, engagementId } });
  revalidatePath(`/engagements/${engagementId}`);
  revalidatePath("/engagements");
}

export async function addComment(engagementId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await prisma.comment.create({ data: { body, authorId: user.id, engagementId } });
  revalidatePath(`/engagements/${engagementId}`);
}

export async function markAllNotificationsRead() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  revalidatePath("/notifications");
}

export async function setDeadlineStatus(id: string, status: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await prisma.complianceDeadline.update({ where: { id }, data: { status: status as any } });
  revalidatePath("/compliance");
}

// ---------------------------------------------------------------------------
// User & security administration
// ---------------------------------------------------------------------------

const MANAGER_ROLES: Role[] = ["PARTNER", "MANAGER"];
const PALETTE = ["#1f47f5", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899", "#14b8a6"];

function randomColor() {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

async function requireManager() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!MANAGER_ROLES.includes(user.role)) redirect("/dashboard");
  return user;
}

export async function createUser(formData: FormData) {
  await requireManager();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "ACCOUNTANT") as Role;
  const title = (formData.get("title") as string) || null;
  const password = String(formData.get("password") ?? "");
  if (!email || !name || password.length < 8) redirect("/admin/users?error=invalid");
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect("/admin/users?error=exists");
  await prisma.user.create({
    data: { email, name, role, title, passwordHash: hashPassword(password), avatarColor: randomColor() },
  });
  redirect("/admin/users?ok=created");
}

export async function resetUserPassword(userId: string, formData: FormData) {
  await requireManager();
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) redirect("/admin/users?error=short");
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hashPassword(password) } });
  redirect("/admin/users?ok=reset");
}

export async function updateUserRole(userId: string, formData: FormData) {
  await requireManager();
  const role = String(formData.get("role") ?? "ACCOUNTANT") as Role;
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}

export async function toggleUserActive(userId: string) {
  const me = await requireManager();
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) redirect("/admin/users");
  if (u.id === me.id) redirect("/admin/users?error=self");
  // never lock out the firm: keep at least one active partner
  if (u.role === "PARTNER" && u.active) {
    const activePartners = await prisma.user.count({ where: { role: "PARTNER", active: true } });
    if (activePartners <= 1) redirect("/admin/users?error=lastpartner");
  }
  await prisma.user.update({ where: { id: userId }, data: { active: !u.active } });
  redirect("/admin/users?ok=updated");
}

export async function changeMyPassword(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next.length < 8) redirect("/account?error=short");
  if (next !== confirm) redirect("/account?error=match");
  const ok = await authenticate(user.email, current);
  if (!ok) redirect("/account?error=current");
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(next) } });
  redirect("/account?ok=1");
}
