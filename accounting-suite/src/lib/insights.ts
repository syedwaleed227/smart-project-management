import "server-only";
import { prisma } from "./db";
import { daysUntil } from "./format";
import { serviceLabel } from "./domain";

// Build a compact text snapshot of the firm for the AI co-pilot context window.
export async function buildContextSummary(): Promise<string> {
  const [clients, engagements, openTasks, deadlines] = await Promise.all([
    prisma.client.count({ where: { active: true } }),
    prisma.engagement.findMany({
      where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
      include: { client: true, manager: true },
      orderBy: { dueDate: "asc" },
      take: 30,
    }),
    prisma.task.findMany({
      where: { status: { notIn: ["DONE"] } },
      include: { assignee: true, engagement: { include: { client: true } } },
      orderBy: { dueDate: "asc" },
      take: 40,
    }),
    prisma.complianceDeadline.findMany({
      where: { status: { notIn: ["SUBMITTED", "CLOSED"] } },
      include: { client: true },
      orderBy: { dueDate: "asc" },
      take: 30,
    }),
  ]);

  const engLines = engagements.map(
    (e) =>
      `- ${e.reference} | ${e.client.name} | ${serviceLabel(e.serviceLine)} | ${e.status} | due ${
        e.dueDate ? e.dueDate.toISOString().slice(0, 10) : "n/a"
      } | mgr ${e.manager?.name ?? "unassigned"} | ${e.progress}%`,
  );

  const taskLines = openTasks.map(
    (t) =>
      `- [${t.status}] ${t.title} (${t.engagement.client.name}) → ${t.assignee?.name ?? "unassigned"}${
        t.dueDate ? `, due ${t.dueDate.toISOString().slice(0, 10)}` : ""
      }`,
  );

  const deadlineLines = deadlines.map((d) => {
    const du = daysUntil(d.dueDate);
    return `- ${d.title} | ${d.client.name} | due ${d.dueDate.toISOString().slice(0, 10)} (${du}d) | ${d.status}`;
  });

  return [
    `Active clients: ${clients}`,
    `Open engagements: ${engagements.length}`,
    ...engLines,
    "",
    `Open tasks: ${openTasks.length}`,
    ...taskLines,
    "",
    `Upcoming statutory deadlines: ${deadlines.length}`,
    ...deadlineLines,
  ].join("\n");
}

export async function dashboardMetrics() {
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 86400000);

  const [
    activeClients,
    openEngagements,
    openTasks,
    overdueTasks,
    deadlinesSoon,
    overdueDeadlines,
  ] = await Promise.all([
    prisma.client.count({ where: { active: true } }),
    prisma.engagement.count({ where: { status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    prisma.task.count({ where: { status: { notIn: ["DONE"] } } }),
    prisma.task.count({ where: { status: { notIn: ["DONE"] }, dueDate: { lt: now } } }),
    prisma.complianceDeadline.count({
      where: { status: { notIn: ["SUBMITTED", "CLOSED"] }, dueDate: { gte: now, lte: in7 } },
    }),
    prisma.complianceDeadline.count({
      where: { status: { notIn: ["SUBMITTED", "CLOSED"] }, dueDate: { lt: now } },
    }),
  ]);

  return { activeClients, openEngagements, openTasks, overdueTasks, deadlinesSoon, overdueDeadlines };
}

// Heuristic, always-on insights surfaced on the dashboard.
export async function generateInsights(): Promise<string[]> {
  const now = new Date();
  const in14 = new Date(now.getTime() + 14 * 86400000);
  const insights: string[] = [];

  const overdueDeadlines = await prisma.complianceDeadline.findMany({
    where: { status: { notIn: ["SUBMITTED", "CLOSED"] }, dueDate: { lt: now } },
    include: { client: true },
    orderBy: { dueDate: "asc" },
    take: 5,
  });
  for (const d of overdueDeadlines) {
    insights.push(`⚠️ Overdue: ${d.title} for ${d.client.name} was due ${d.dueDate.toISOString().slice(0, 10)}.`);
  }

  const soon = await prisma.complianceDeadline.findMany({
    where: { status: { notIn: ["SUBMITTED", "CLOSED"] }, dueDate: { gte: now, lte: in14 } },
    include: { client: true },
    orderBy: { dueDate: "asc" },
    take: 5,
  });
  for (const d of soon) {
    insights.push(`⏳ Due in ${daysUntil(d.dueDate)}d: ${d.title} for ${d.client.name}.`);
  }

  const unassigned = await prisma.task.count({ where: { status: { notIn: ["DONE"] }, assigneeId: null } });
  if (unassigned > 0) insights.push(`👤 ${unassigned} open task(s) have no assignee — allocate them to balance the team.`);

  const blocked = await prisma.task.count({ where: { status: "BLOCKED" } });
  if (blocked > 0) insights.push(`🚧 ${blocked} task(s) are blocked and may be stalling engagements.`);

  if (!insights.length) insights.push("✅ No overdue items. Workload looks under control.");
  return insights;
}
