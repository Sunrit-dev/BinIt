"use client";

import { RefreshCw, Shield, UserCog } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, ErrorBlock, LoadingBlock, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api";
import { useToast } from "@/components/toast";
import { useAsyncData, apiPatch } from "@/lib/hooks";
import { Role, User } from "@/lib/types";
import { cx } from "@/lib/utils";

const ROLE_ACCENT: Record<Role, string> = {
  CITIZEN: "bg-forest-500/15 text-forest-300 ring-1 ring-forest-500/40",
  WORKER: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40",
  OPERATOR: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/40",
  ADMIN: "bg-red-500/15 text-red-300 ring-1 ring-red-500/40",
};

export default function UsersPage() {
  const { data: users, error, loading, reload } = useAsyncData<User[]>(() => api("/users"), []);
  const [changing, setChanging] = useState<string | null>(null);
  const { toast } = useToast();

  const changeRole = async (user: User, role: Role) => {
    setChanging(user.id);
    try {
      await apiPatch(`/users/${user.id}/role`, { role });
      await reload();
      toast({ title: "Role updated", message: `${user.full_name} is now a ${role}.`, tone: "success" });
    } catch (e) {
      toast({ title: "Update failed", message: (e as Error).message, tone: "error" });
    } finally {
      setChanging(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Users & Roles</h1>
          <p className="mt-1 text-sm text-forest-100/50">Admin-only: manage account roles and status.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={reload}>
          <RefreshCw className="size-3.5" /> Refresh
        </Button>
      </div>

      {loading ? (
        <Card><LoadingBlock label="Loading users…" /></Card>
      ) : error ? (
        <Card><ErrorBlock message={error} onRetry={reload} /></Card>
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left text-[11px] uppercase tracking-wider text-forest-100/40">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3 text-right">Change role</th>
                </tr>
              </thead>
              <tbody>
                {(users || []).map((u) => (
                  <tr key={u.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white uppercase">
                          {u.full_name.slice(0, 1)}
                        </span>
                        <div>
                          <p className="font-medium text-white">{u.full_name}</p>
                          <p className="text-[11px] text-forest-100/45">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge className={ROLE_ACCENT[u.role]}>{u.role}</Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-forest-100/60">{u.phone_number || "—"}</td>
                    <td className="px-5 py-3 text-xs text-forest-100/60">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.id === changing ? (
                          <span className="text-xs text-forest-400">Updating…</span>
                        ) : (
                          (["CITIZEN", "WORKER", "OPERATOR", "ADMIN"] as Role[])
                            .filter((r) => r !== u.role)
                            .map((r) => (
                              <Button key={r} size="sm" variant="secondary" onClick={() => changeRole(u, r)}>
                                <UserCog className="size-3" /> {r}
                              </Button>
                            ))
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="flex items-center gap-2 border-t border-white/8 px-5 py-3 text-[11px] text-forest-100/40">
            <Shield className="size-3.5" /> Role changes are audited via JSON audit logs. Promote workers/operators before dispatching.
          </p>
        </Card>
      )}
    </div>
  );
}