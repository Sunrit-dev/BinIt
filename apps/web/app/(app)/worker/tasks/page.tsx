"use client";

import { MapPin, Truck } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Badge, Card, EmptyState, ErrorBlock, LoadingBlock, SeverityBadge, StatusBadge } from "@/components/ui";
import { api, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { usePolling } from "@/lib/hooks";
import { Report } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export default function WorkerTasks() {
  const { user } = useAuth();
  const { data, error, loading } = usePolling<Report[]>(() => api("/worker/tasks"), 10000, [user?.id]);

  const tasks = useMemo(() => data || [], [data]);
  const active = tasks.filter((t) => ["ASSIGNED", "IN_PROGRESS"].includes(t.status));
  const past = tasks.filter((t) => !["ASSIGNED", "IN_PROGRESS"].includes(t.status));

  const grouped = useMemo(() => {
    const map = new Map<string, Report[]>();
    active.forEach((t) => {
      const key = t.collection_task_id || t.id;
      const list = map.get(key) || [];
      list.push(t);
      map.set(key, list);
    });
    return Array.from(map.entries()).sort(
      (a, b) => Math.max(...b[1].map((r) => r.severity_score)) - Math.max(...a[1].map((r) => r.severity_score)),
    );
  }, [active]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">My Tasks</h1>
        <p className="mt-1 text-sm text-forest-100/50">Assigned waste collection jobs, ordered by priority.</p>
      </div>

      {loading ? (
        <Card><LoadingBlock label="Loading tasks…" /></Card>
      ) : error ? (
        <Card><ErrorBlock message={error} /></Card>
      ) : active.length === 0 ? (
        <Card>
          <EmptyState icon={<Truck className="size-8" />} title="No active tasks" hint="When an operator dispatches a route, it will appear here." />
        </Card>
      ) : (
        grouped.map(([groupKey, list], gi) => {
          const ordered = [...list].sort((a, b) => b.severity_score - a.severity_score);
          const isRoute = list.some((r) => r.collection_task_id);
          return (
            <div key={groupKey} className={gi > 0 ? "mb-6" : "mb-6"}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                  {isRoute ? (
                    <>
                      <MapPin className="size-4 text-sky-400" />
                      Collection route · {list.length} stops
                    </>
                  ) : (
                    <>
                      <Truck className="size-4 text-forest-400" />
                      Single assignment
                    </>
                  )}
                </h2>
                <span className="text-xs text-forest-100/45">
                  Highest {Math.max(...ordered.map((r) => r.severity_score))}/100 severity
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {ordered.map((r) => (
                  <Link
                    key={r.id}
                    href={`/worker/tasks/${r.id}`}
                    className="overflow-hidden rounded-2xl border border-white/8 bg-[#0d2119] transition hover:border-forest-500/50"
                  >
                    <div className="flex gap-3 p-3">
                      {r.thumbnail_url && (
                        <img src={mediaUrl(r.thumbnail_url)} alt="" className="h-16 w-20 shrink-0 rounded-xl object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={r.status} />
                          <SeverityBadge level={r.severity} score={r.severity_score} />
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-forest-100/85">
                          {r.description || `${r.waste_category} waste`}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-forest-100/50">
                          <span className="font-mono">{r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</span>
                          <span>{r.zone.replace(/_/g, " ")}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })
      )}

      {past.length > 0 && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-white">Completed ({past.length})</h3>
          <div className="grid gap-2 md:grid-cols-3">
            {past.slice(0, 9).map((r) => (
              <Link key={r.id} href={`/worker/tasks/${r.id}`} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/8 transition hover:bg-white/5">
                <Badge className="bg-white/5 text-forest-100/70 ring-1 ring-white/10">{r.status.replace(/_/g, " ")}</Badge>
                <span className="truncate text-xs text-forest-100/70">{r.waste_category}</span>
                <span className="ml-auto text-[10px] text-forest-100/40">{timeAgo(r.resolved_at || r.updated_at)}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}