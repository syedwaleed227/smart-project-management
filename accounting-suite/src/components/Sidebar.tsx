"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/clients", label: "Clients", icon: "🏢" },
  { href: "/engagements", label: "Engagements", icon: "📁" },
  { href: "/tasks", label: "My Tasks", icon: "✅" },
  { href: "/compliance", label: "Compliance Calendar", icon: "📅" },
  { href: "/assistant", label: "AI Co-pilot", icon: "🤖" },
  { href: "/team", label: "Team", icon: "👥" },
  { href: "/admin/users", label: "User Admin", icon: "🔐" },
  { href: "/account", label: "My Account", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">SA</span>
        <div>
          <div className="text-sm font-semibold leading-tight">Smart Accounting</div>
          <div className="text-xs text-slate-400">Suite</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-xs text-slate-400">Self-hosted · local PostgreSQL</div>
    </aside>
  );
}
