import { PrismaClient, Role, ServiceLine, EngagementStatus, Priority, TaskStatus, DeadlineKind, DeadlineStatus, RiskLevel } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PLAYBOOKS } from "../src/lib/domain";

const prisma = new PrismaClient();

function hash(pw: string) {
  return bcrypt.hashSync(pw, 10);
}

function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 86400000);
}

async function main() {
  console.log("Seeding Smart Accounting Suite…");

  // Clean (order matters for FKs)
  await prisma.$transaction([
    prisma.activity.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.timeEntry.deleteMany(),
    prisma.document.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.complianceDeadline.deleteMany(),
    prisma.task.deleteMany(),
    prisma.engagement.deleteMany(),
    prisma.client.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // --- Users ---
  const password = hash("password123");
  const [partner, manager, accountant, auditor, taxAgent, legal] = await Promise.all([
    prisma.user.create({ data: { email: "partner@firm.com", name: "Aisha Rahman", role: Role.PARTNER, title: "Managing Partner", passwordHash: password, avatarColor: "#1f47f5" } }),
    prisma.user.create({ data: { email: "manager@firm.com", name: "Omar Khan", role: Role.MANAGER, title: "Engagement Manager", passwordHash: password, avatarColor: "#0ea5e9" } }),
    prisma.user.create({ data: { email: "accountant@firm.com", name: "Lena Park", role: Role.ACCOUNTANT, title: "Senior Accountant", passwordHash: password, avatarColor: "#10b981" } }),
    prisma.user.create({ data: { email: "auditor@firm.com", name: "David Mensah", role: Role.AUDITOR, title: "Audit Senior", passwordHash: password, avatarColor: "#f59e0b" } }),
    prisma.user.create({ data: { email: "tax@firm.com", name: "Priya Nair", role: Role.TAX_AGENT, title: "Tax Consultant", passwordHash: password, avatarColor: "#8b5cf6" } }),
    prisma.user.create({ data: { email: "legal@firm.com", name: "Yusuf Ali", role: Role.LEGAL, title: "Legal Counsel", passwordHash: password, avatarColor: "#ef4444" } }),
  ]);

  // --- Clients ---
  const clients = await Promise.all([
    prisma.client.create({ data: { name: "Bright Horizon Trading LLC", legalName: "Bright Horizon Trading LLC", industry: "Wholesale Trade", trn: "100123456700003", jurisdiction: "UAE", fiscalYearEnd: "12-31", contactName: "Sara Idris", contactEmail: "sara@brighthorizon.ae", riskLevel: RiskLevel.MEDIUM } }),
    prisma.client.create({ data: { name: "NovaTech Solutions FZ", legalName: "NovaTech Solutions FZ-LLC", industry: "Software", trn: "100987654300003", jurisdiction: "UAE", fiscalYearEnd: "12-31", contactName: "Karim Said", contactEmail: "karim@novatech.io", riskLevel: RiskLevel.LOW } }),
    prisma.client.create({ data: { name: "Gulf Logistics Co", legalName: "Gulf Logistics Company LLC", industry: "Logistics", trn: "100555666700003", jurisdiction: "UAE", fiscalYearEnd: "03-31", contactName: "Hana Yusuf", contactEmail: "hana@gulflogistics.com", riskLevel: RiskLevel.HIGH } }),
    prisma.client.create({ data: { name: "Cedar Hospitality Group", legalName: "Cedar Hospitality Group LLC", industry: "Hospitality", jurisdiction: "UAE", fiscalYearEnd: "12-31", contactName: "Tariq Aziz", contactEmail: "tariq@cedarhg.com", riskLevel: RiskLevel.MEDIUM } }),
  ]);

  // --- Engagements with task playbooks ---
  let engCounter = 1;
  function ref() {
    return `ENG-2026-${String(engCounter++).padStart(4, "0")}`;
  }

  const engagementPlan: {
    client: number;
    serviceLine: ServiceLine;
    title: string;
    status: EngagementStatus;
    manager: string;
    assignee: string;
    period: string;
    dueInDays: number;
    fee: number;
    priority: Priority;
  }[] = [
    { client: 0, serviceLine: ServiceLine.VAT_FILING, title: "VAT Return — Q1 2026", status: EngagementStatus.IN_PROGRESS, manager: manager.id, assignee: taxAgent.id, period: "Q1 2026", dueInDays: 6, fee: 3500, priority: Priority.HIGH },
    { client: 0, serviceLine: ServiceLine.BOOKKEEPING, title: "Monthly Bookkeeping — May 2026", status: EngagementStatus.IN_PROGRESS, manager: manager.id, assignee: accountant.id, period: "May 2026", dueInDays: 12, fee: 2000, priority: Priority.MEDIUM },
    { client: 1, serviceLine: ServiceLine.CORP_TAX_REGISTRATION, title: "Corporate Tax Registration", status: EngagementStatus.REVIEW, manager: manager.id, assignee: taxAgent.id, period: "FY2026", dueInDays: 20, fee: 4000, priority: Priority.HIGH },
    { client: 1, serviceLine: ServiceLine.ACCOUNTING, title: "Annual Financial Statements — FY2025", status: EngagementStatus.PLANNING, manager: manager.id, assignee: accountant.id, period: "FY2025", dueInDays: 45, fee: 9000, priority: Priority.MEDIUM },
    { client: 2, serviceLine: ServiceLine.AUDIT, title: "Statutory Audit — FY2025", status: EngagementStatus.IN_PROGRESS, manager: partner.id, assignee: auditor.id, period: "FY2025", dueInDays: 30, fee: 25000, priority: Priority.HIGH },
    { client: 2, serviceLine: ServiceLine.CORP_TAX_FILING, title: "Corporate Tax Return — FY2025", status: EngagementStatus.PENDING_CLIENT, manager: manager.id, assignee: taxAgent.id, period: "FY2025", dueInDays: 3, fee: 6000, priority: Priority.URGENT },
    { client: 3, serviceLine: ServiceLine.VAT_REGISTRATION, title: "VAT Registration", status: EngagementStatus.COMPLETED, manager: manager.id, assignee: taxAgent.id, period: "FY2026", dueInDays: -10, fee: 2500, priority: Priority.MEDIUM },
    { client: 3, serviceLine: ServiceLine.LEGAL, title: "Shareholder Agreement Review", status: EngagementStatus.IN_PROGRESS, manager: partner.id, assignee: legal.id, period: "2026", dueInDays: 15, fee: 8000, priority: Priority.MEDIUM },
  ];

  for (const p of engagementPlan) {
    const tasksTpl = PLAYBOOKS[p.serviceLine];
    const totalTasks = tasksTpl.length;
    // simulate progress based on status
    const doneCount =
      p.status === EngagementStatus.COMPLETED ? totalTasks :
      p.status === EngagementStatus.REVIEW ? Math.floor(totalTasks * 0.8) :
      p.status === EngagementStatus.IN_PROGRESS ? Math.floor(totalTasks * 0.4) :
      p.status === EngagementStatus.PENDING_CLIENT ? Math.floor(totalTasks * 0.5) : 1;
    const progress = Math.round((doneCount / totalTasks) * 100);

    const eng = await prisma.engagement.create({
      data: {
        reference: ref(),
        title: p.title,
        serviceLine: p.serviceLine,
        status: p.status,
        priority: p.priority,
        periodLabel: p.period,
        startDate: daysFromNow(-30),
        dueDate: daysFromNow(p.dueInDays),
        feeAmount: p.fee,
        currency: "AED",
        progress,
        clientId: clients[p.client].id,
        managerId: p.manager,
        tasks: {
          create: tasksTpl.map((title, i) => ({
            title,
            status: i < doneCount ? TaskStatus.DONE : i === doneCount ? TaskStatus.IN_PROGRESS : TaskStatus.TODO,
            priority: i === doneCount ? Priority.HIGH : Priority.MEDIUM,
            orderIndex: i,
            dueDate: daysFromNow(p.dueInDays - (totalTasks - i) * 2),
            assigneeId: p.assignee,
            creatorId: p.manager,
          })),
        },
      },
    });

    await prisma.activity.create({
      data: { action: "Engagement created", detail: `${p.title}`, userId: p.manager, engagementId: eng.id },
    });
  }

  // --- Compliance deadlines ---
  await prisma.complianceDeadline.createMany({
    data: [
      { title: "VAT Return Q1 2026", kind: DeadlineKind.VAT_RETURN, status: DeadlineStatus.DUE_SOON, dueDate: daysFromNow(6), periodLabel: "Q1 2026", clientId: clients[0].id },
      { title: "Corporate Tax Return FY2025", kind: DeadlineKind.CORP_TAX_RETURN, status: DeadlineStatus.OVERDUE, dueDate: daysFromNow(-2), periodLabel: "FY2025", clientId: clients[2].id },
      { title: "VAT Return Q1 2026", kind: DeadlineKind.VAT_RETURN, status: DeadlineStatus.UPCOMING, dueDate: daysFromNow(28), periodLabel: "Q1 2026", clientId: clients[1].id },
      { title: "Audited Accounts Submission", kind: DeadlineKind.AUDIT_SUBMISSION, status: DeadlineStatus.UPCOMING, dueDate: daysFromNow(30), periodLabel: "FY2025", clientId: clients[2].id },
      { title: "Trade License Renewal", kind: DeadlineKind.LICENSE_RENEWAL, status: DeadlineStatus.UPCOMING, dueDate: daysFromNow(40), periodLabel: "2026", clientId: clients[3].id },
      { title: "Corporate Tax Registration Deadline", kind: DeadlineKind.CORP_TAX_REGISTRATION, status: DeadlineStatus.DUE_SOON, dueDate: daysFromNow(9), periodLabel: "FY2026", clientId: clients[1].id },
    ],
  });

  // --- Sample notifications + comments ---
  await prisma.notification.createMany({
    data: [
      { type: "DEADLINE", title: "VAT Return due in 6 days", body: "Bright Horizon Trading LLC — Q1 2026", userId: taxAgent.id, link: "/compliance" },
      { type: "ASSIGNMENT", title: "You were assigned a task", body: "Substantive testing of material balances", userId: auditor.id, link: "/engagements" },
      { type: "AI_INSIGHT", title: "AI flagged an overdue filing", body: "Gulf Logistics Co corporate tax return is overdue", userId: partner.id, link: "/dashboard" },
    ],
  });

  console.log("Seed complete.");
  console.log("Login with: partner@firm.com / password123 (also manager@, accountant@, auditor@, tax@, legal@)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
