"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateTaskPlan } from "@/lib/ai";
import type { ServiceLine, EngagementStatus, TaskStatus, Priority } from "@prisma/client";

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
