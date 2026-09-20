"use client";

import { Route as RouteIcon, Send, Truck, Waypoints } from "lucide-react";
import { useMemo, useState } from "react";
import { BinitMap } from "@/components/map/BinitMap";
import { Badge, Button, Card, EmptyState, ErrorBlock, LoadingBlock, SectionTitle } from "@/components/ui";
import { api, mediaUrl } from "@/lib/api";
import { useToast } from "@/components/toast";
import { useAsyncData, apiPost } from "@/lib/hooks";
import { toMarkers } from "@/lib/markers";
import { OptimizedRoute, Report, ReportList, User } from "@/lib/types";
import { cx, timeAgo } from "@/lib/utils";

const DISPATCHABLE = ["CLASSIFIED", "PENDING_REVIEW", "ACKNOWLEDGED"];

export default function RoutePlannerPage() {
  const [zones] = useState<"KOLKATA_URBAN" | "GRAM_PANCHAYAT" | "ALL">("ALL");
  const { data, error, loading, reload } = useAsyncData<ReportList>(
    () => {
      const p = new URLSearchParams({ page_size: "100" });
      if (zones !== "ALL") p.set("zone", zones);
      return api(`/reports?${p.toString()}`);
    },
    [zones],
  );

  const pool = useMemo(() => (data?.items || []).filter((r) => DISPATCHABLE.includes(r.status)), [data]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [route, setRoute] = useState<OptimizedRoute | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [workers, setWorkers] = useState<User[]>([]);
  const [workerId, setWorkerId] = useState("");
  const [dispatchBusy, setDispatchBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const { toast } = useToast();

  const selectedReports = useMemo(() => pool.filter((r) => selectedIds.includes(r.id)), [pool, selectedIds]);

  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const optimize = async () => {
    setOptimizing(true);
    setDone(null);
    try {
      const res = await apiPost<OptimizedRoute>("/routes/optimize", { report_ids: selectedIds });
      setRoute(res);
      toast({ title: "Route optimized", message: "Best collection order computed.", tone: "success" });
    } catch (e) {
      toast({ title: "Route failed", message: (e as Error).message, tone: "error" });
    } finally {
      setOptimizing(false);
    }
  };

  const loadWorkers = async () => {
    if (workers.length === 0) {
      const users = await api<User[]>("/users").catch(() => []);
      setWorkers(users.filter((u) => u.role === "WORKER"));
    }
  };

  const dispatch = async () => {
    if (!route || !workerId) return;
    setDispatchBusy(true);
    try {
      await apiPost("/tasks/dispatch", {
        worker_id: workerId,
        report_ids: selectedIds,
        route_geojson: route.route_geojson,
        total_distance_km: route.total_distance_km,
        estimated_duration_min: route.estimated_duration_min,
      });
      setDone(`Dispatched ${selectedIds.length} locations to the crew.`);
      toast({ title: "Route dispatched", message: `${selectedIds.length} locations sent to the crew.`, tone: "success" });
      setSelectedIds([]);
      setRoute(null);
      setWorkerId("");
      await new Promise((r) => setTimeout(r, 600));
      await reload();
    } catch (e) {
      toast({ title: "Dispatch failed", message: (e as Error).message, tone: "error" });
    } finally {
      setDispatchBusy(false);
    }
  };

  const orderedWaypoints = useMemo(() => {
    if (!route) return [];
    return route.waypoint_order.map((idx) => ({
      idx,
      report: route.reports[idx],
    }));
  }, [route]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Route Planner"
        sub="Select reports, let OSRM compute the optimal visit order, and dispatch to a crew."
      />

      {done && (
        <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 ring-1 ring-emerald-500/30">{done}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Waypoints className="size-4 text-forest-400" /> Dispatchable reports
              </h3>
              <span className="text-xs text-forest-100/45">{selectedIds.length} selected</span>
            </div>
            {loading ? (
              <LoadingBlock />
            ) : error ? (
              <ErrorBlock message={error} onRetry={reload} />
            ) : pool.length === 0 ? (
              <EmptyState title="Nothing to dispatch" hint="Acknowledge reports first so they enter the dispatch queue." />
            ) : (
              <div className="max-h-[320px] sm:max-h-[560px] space-y-2 overflow-y-auto pr-1">
                {pool.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => toggle(r.id)}
                    className={cx(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition",
                      selectedIds.includes(r.id)
                        ? "bg-forest-500/15 ring-forest-500/50"
                        : "bg-white/[0.03] ring-white/8 hover:bg-white/5",
                    )}
                  >
                    {r.thumbnail_url && (
                      <img src={mediaUrl(r.thumbnail_url)} alt="" className="h-10 w-12 shrink-0 rounded-lg object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-forest-100/90">
                        {r.description || r.waste_category}
                      </p>
                      <p className="text-[10px] text-forest-100/45">
                        {r.waste_category} · {r.severity} · {r.zone.replace(/_/g, " ")} · {timeAgo(r.created_at)}
                      </p>
                    </div>
                    <span
                      className={cx(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border transition",
                        selectedIds.includes(r.id) ? "border-forest-400 bg-forest-500 text-white" : "border-white/20",
                      )}
                    >
                      {selectedIds.includes(r.id) && <span className="text-[10px]">✓</span>}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-white">{selectedIds.length} waypoints selected</p>
                <p className="mt-0.5 text-[11px] text-forest-100/45">Up to 15 recommended for demo routing.</p>
              </div>
              <Button onClick={optimize} loading={optimizing} disabled={selectedIds.length < 1} className="w-full sm:w-auto">
                <RouteIcon className="size-4" /> Optimize route
              </Button>
            </div>
            {route && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white/5 px-3 py-2 text-center">
                  <p className="text-base sm:text-lg font-bold text-white">{route.total_distance_km} km</p>
                  <p className="text-[10px] text-forest-100/45">distance</p>
                </div>
                <div className="rounded-xl bg-white/5 px-3 py-2 text-center">
                  <p className="text-base sm:text-lg font-bold text-white">{route.estimated_duration_min} min</p>
                  <p className="text-[10px] text-forest-100/45">est. duration</p>
                </div>
                <div className="rounded-xl bg-white/5 px-3 py-2 text-center">
                  <p className="text-base sm:text-lg font-bold text-white">{selectedIds.length}</p>
                  <p className="text-[10px] text-forest-100/45">stops</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="p-2.5 sm:p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <RouteIcon className="size-4 text-sky-400" />
                {route ? "Optimized collection route" : "Route preview"}
              </h3>
              {route?.fallback && (
                <Badge className="bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40">
                  Approximate route (OSRM offline)
                </Badge>
              )}
            </div>
            <BinitMap
              markers={toMarkers(selectedReports)}
              center={[88.44, 22.58]}
              zoom={11}
              heightClass="h-[300px] sm:h-[440px]"
              route={route?.route_geojson || null}
            />
          </Card>

          {orderedWaypoints.length > 0 && (
            <Card className="mt-4">
              <h4 className="mb-3 text-sm font-semibold text-white">Visit order</h4>
              <ol className="space-y-2">
                {orderedWaypoints.map(({ idx, report }, i) => (
                  <li key={idx} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/8">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-forest-500 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-forest-100/90">
                        {report.description || report.waste_category}
                      </p>
                      <p className="font-mono text-[10px] text-forest-100/45">
                        {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                      </p>
                    </div>
                    <Badge className="bg-white/5 text-forest-100/70 ring-1 ring-white/10">{report.severity}</Badge>
                  </li>
                ))}
              </ol>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/8 pt-4">
                <select
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                  onFocus={loadWorkers}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-forest-500 focus:outline-none"
                >
                  <option value="">Assign crew…</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>{w.full_name}</option>
                  ))}
                </select>
                <Button onClick={dispatch} loading={dispatchBusy} disabled={!workerId}>
                  <Send className="size-4" /> Dispatch route
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}