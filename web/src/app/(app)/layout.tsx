import { requireUser, isAdmin, isFinance } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Sidebar, type NavItem } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();
  const { count: unread } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  const items: NavItem[] = [
    { href: "/", label: "Dashboard", icon: "▣" },
    { href: "/projects", label: "Projects", icon: "▤" },
    { href: "/tasks", label: "Tasks", icon: "✓" },
    { href: "/meetings", label: "Meetings", icon: "◷" },
    { href: "/expenses", label: "Expenses", icon: "$" },
    { href: "/approvals", label: "Approvals", icon: "⎷" },
  ];
  if (isFinance(user)) {
    items.push({ href: "/finance", label: "Finance", icon: "₪" });
  }
  if (isAdmin(user)) {
    items.push({ href: "/admin/departments", label: "Departments", icon: "⌗" });
    items.push({ href: "/admin/users", label: "Users & Roles", icon: "☷" });
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar items={items} userName={user.name} roles={user.roles} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title="Workspace" unread={unread ?? 0} />
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
