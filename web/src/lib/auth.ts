import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RoleName, SessionUser } from "@/lib/types";

/**
 * Returns the current user's profile + roles, or null if not signed in.
 * Cached per-request so multiple components can call it cheaply.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, email, phone, status")
    .eq("id", user.id)
    .single();

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", user.id);

  const roles =
    (roleRows
      ?.map((r) => {
        const rel = r.roles as { name: string } | { name: string }[] | null;
        return Array.isArray(rel) ? rel[0]?.name : rel?.name;
      })
      .filter(Boolean) as RoleName[]) ?? [];

  return {
    id: user.id,
    name: profile?.name ?? user.email ?? "User",
    email: profile?.email ?? user.email ?? "",
    phone: profile?.phone ?? null,
    status: profile?.status ?? "active",
    roles,
  };
});

/** Use in protected pages — redirects to /login when unauthenticated. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export function hasAnyRole(user: SessionUser, roles: RoleName[]): boolean {
  return user.roles.some((r) => roles.includes(r));
}

const MANAGER_ROLES: RoleName[] = [
  "Super Admin",
  "Company Owner",
  "CEO",
  "Project Manager",
  "Finance Manager",
  "HR Manager",
  "Department Head",
  "Team Lead",
];

export const isManager = (user: SessionUser) => hasAnyRole(user, MANAGER_ROLES);
export const isFinance = (user: SessionUser) =>
  hasAnyRole(user, ["Super Admin", "Finance Manager"]);
export const isAdmin = (user: SessionUser) =>
  hasAnyRole(user, ["Super Admin"]);
