import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StatusBadge, PriorityBadge, ProgressBar, Avatar } from "@/components/ui";
import { serviceLabel } from "@/lib/domain";
import { fmtDate, money, fromNow } from "@/lib/format";
import { TaskBoard, type BoardTask } from "./TaskBoard";
import { StatusControl } from "./StatusControl";
import { addTask, addComment } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EngagementDetail({ params }: { params: { id: string } }) {
  const eng = await prisma.engagement.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      manager: true,
      tasks: { include: { assignee: true }, orderBy: { orderIndex: "asc" } },
      comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
      activities: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!eng) notFound();

  const staff = await prisma.user.findMany({ where: { active: true, role: { not: "CLIENT" } }, orderBy: { name: "asc" } });

  const boardTasks: BoardTask[] = eng.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status as BoardTask["status"],
    priority: t.priority,
    aiGenerated: t.aiGenerated,
    assigneeName: t.assignee?.name,
    assigneeColor: t.assignee?.avatarColor,
  }));

  const addTaskHere = addTask.bind(null, eng.id);
  const addCommentHere = addComment.bind(null, eng.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/engagements" className="text-sm text-slate-400 hover:text-slate-700">← Engagements</Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{eng.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-mono">{eng.reference}</span> · {eng.client.name} · {serviceLabel(eng.serviceLine)}
              {eng.periodLabel ? ` · ${eng.periodLabel}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge value={eng.priority} />
            <StatusControl engagementId={eng.id} current={eng.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-4">
          <div className="text-xs text-slate-500">Status</div>
          <div className="mt-1"><StatusBadge value={eng.status} /></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Due date</div>
          <div className="mt-1 text-sm font-medium">{fmtDate(eng.dueDate)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Fee</div>
          <div className="mt-1 text-sm font-medium">{money(eng.feeAmount, eng.currency)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Progress</div>
          <div className="mt-2 flex items-center gap-2">
            <ProgressBar value={eng.progress} />
            <span className="text-xs text-slate-500">{eng.progress}%</span>
          </div>
        </div>
      </div>

      {/* Tasks board */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Tasks</h2>
          <span className="text-xs text-slate-400">{eng.tasks.filter((t) => t.status === "DONE").length}/{eng.tasks.length} done</span>
        </div>
        <TaskBoard tasks={boardTasks} />
        <form action={addTaskHere} className="mt-4 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Add task</label>
            <input name="title" required className="input" placeholder="New task title" />
          </div>
          <div>
            <label className="label">Assignee</label>
            <select name="assigneeId" className="input">
              <option value="">Unassigned</option>
              {staff.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select name="priority" className="input">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <button className="btn-primary">Add</button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Comments / collaboration */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Discussion</h2>
          <form action={addCommentHere} className="mb-4 flex gap-2">
            <input name="body" required className="input" placeholder="Write a comment to the team…" />
            <button className="btn-primary">Post</button>
          </form>
          <div className="space-y-4">
            {eng.comments.length === 0 && <p className="text-sm text-slate-400">No comments yet.</p>}
            {eng.comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Avatar name={c.author.name} color={c.author.avatarColor} />
                <div>
                  <div className="text-sm">
                    <span className="font-medium">{c.author.name}</span>{" "}
                    <span className="text-xs text-slate-400">{fromNow(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-700">{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Activity</h2>
          <ol className="space-y-3">
            {eng.activities.map((a) => (
              <li key={a.id} className="text-sm">
                <div className="text-slate-700">{a.action}</div>
                <div className="text-xs text-slate-400">
                  {a.user?.name ?? "System"} · {fromNow(a.createdAt)}
                </div>
              </li>
            ))}
            {eng.activities.length === 0 && <p className="text-sm text-slate-400">No activity.</p>}
          </ol>
        </div>
      </div>
    </div>
  );
}
