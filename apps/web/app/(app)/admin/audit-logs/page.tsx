"use client";

import { RefreshCw, ShieldCheck } from "lucide-react";
import { Button, Card, ErrorBlock, LoadingBlock } from "@/components/ui";
import { api } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks";
import { AuditLog } from "@/lib/types";
import { cx } from "@/lib/utils";

const ACTION_TONE: Record<string, string> = {
  STATUS_CHANGE: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/40",
  AI_OVERRIDE: "bg-red-500/15 text-red-300 ring-1 ring-red-500/40",
  ASSIGNMENT: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40",
  ROLE_CHANGE: "bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/40",
  CREATE: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40",
};

function shortId(id: string | null | undefined) {
  if (!id) return "—";
  return id.slice(0, 8);
}

function JsonPreview({ value }: { value?: Record<string, unknown> | null }) {
  if (!value || Object.keys(value).length === 0) return <span className="text-forest-100/35">—</span>;
  return (
    <span className="block max-w-[260px] truncate font-mono text-[10px] text-forest-100/60">
      {JSON.stringify(value)}
    </span>
  );
}

export default function AuditLogsPage() {
  const { data: logs, error, loading, reload } = useAsyncData<AuditLog[]>(() => api("/admin/audit-logs"), []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Audit Trail</h1>
          <p className="mt-1 text-sm text-forest-100/50">Immutable system activity log · last 200 events.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={reload}>
          <RefreshCw className="size-3.5" /> Refresh
        </Button>
      </div>

      {loading ? (
        <Card><LoadingBlock label="Loading audit events…" /></Card>
      ) : error ? (
        <Card><ErrorBlock message={error} onRetry={reload} /></Card>
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left text-[11px] uppercase tracking-wider text-forest-100/40">
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Entity</th>
                  <th className="px-5 py-3">State before</th>
                  <th className="px-5 py-3">State after</th>
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3 text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {(logs || []).map((log) => (
                  <tr key={log.id} className="border-b border-white/5 align-top transition hover:bg-white/[0.03]">
                    <td className="px-5 py-3">
                      <span
                        className={cx(
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold",
                          ACTION_TONE[log.action_type] || "bg-white/10 text-forest-100/70",
                        )}
                      >
                        {log.action_type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-forest-100/80">
                      {log.entity_name}
                      <span className="ml-2 font-mono text-forest-100/40">#{shortId(log.entity_id)}</span>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-forest-100/50">{log.entity_id}</td>
                    <td className="px-5 py-3"><JsonPreview value={log.state_before} /></td>
                    <td className="px-5 py-3"><JsonPreview value={log.state_after} /></td>
                    <td className="px-5 py-3 font-mono text-[10px] text-forest-100/50">{shortId(log.actor_user_id)}</td>
                    <td className="px-5 py-3 text-right text-xs text-forest-100/50">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(logs || []).length === 0 && (
            <p className="px-5 py-8 text-center text-xs text-forest-100/40">No audit events recorded yet.</p>
          )}
          <p className="flex items-center gap-2 border-t border-white/8 px-5 py-3 text-[11px] text-forest-100/40">
            <ShieldCheck className="size-3.5" /> Append-only trail written on status changes, AI overrides, assignments and role changes.
          </p>
        </Card>
      )}
    </div>
  );
}