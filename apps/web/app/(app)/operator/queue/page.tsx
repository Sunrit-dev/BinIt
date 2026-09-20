"use client";

import { CheckCircle2, ClipboardX, Copy, FilterX, RefreshCw, Search, UserPlus, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, ErrorBlock, Field, LoadingBlock, Modal } from "@/components/ui";
import { ReportDetail } from "@/components/report/ReportDetail";
import { api, mediaUrl } from "@/lib/api";
import { useToast } from "@/components/toast";
import { useAsyncData, apiPatch, apiPost } from "@/lib/hooks";
import { CATEGORIES, Report, ReportList, STATUSES, User, Zone } from "@/lib/types";
import { timeAgo, cx } from "@/lib/utils";

const EMPTY: Record<string, string> = { status: "ALL", category: "ALL", severity: "ALL", zone: "ALL" };

export default function OperatorQueue() {
  const [filters, setFilters] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const { data, error, loading, reload } = useAsyncData<ReportList>(() => fetchReports(filters), [JSON.stringify(filters)]);

  async function fetchReports(f: Record<string, string>) {
    const p = new URLSearchParams();
    if (f.status !== "ALL") p.set("status", f.status);
    if (f.category !== "ALL") p.set("waste_category", f.category);
    if (f.severity !== "ALL") p.set("severity", f.severity);
    if (f.zone !== "ALL") p.set("zone", f.zone);
    p.set("page_size", "100");
    return api<ReportList>(`/reports?${p.toString()}`);
  }

  const rows = useMemo(() => {
    const list = data?.items || [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (r) =>
        (r.description || "").toLowerCase().includes(q) ||
        r.waste_category.toLowerCase().includes(q) ||
        r.address_text?.toLowerCase().includes(q) ||
        r.reporter_name?.toLowerCase().includes(q),
    );
  }, [data, search]);

  const [selected, setSelected] = useState<Report | null>(null);
  const [workers, setWorkers] = useState<User[]>([]);
  const [actBusy, setActBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [dupOpen, setDupOpen] = useState(false);
  const [dupId, setDupId] = useState("");
  const [overrideCat, setOverrideCat] = useState("");
  const [assignWorker, setAssignWorker] = useState("");
  const { toast } = useToast();

  const loadWorkers = async () => {
    if (workers.length === 0) {
      const users = await api<User[]>("/users").catch(() => []);
      setWorkers(users.filter((u) => u.role === "WORKER"));
    }
  };

  const refreshSelected = async () => {
    if (!selected) return;
    const fresh = await api<Report>(`/reports/${selected.id}`);
    setSelected(fresh);
    await reload();
  };

  const doAction = async (fn: () => Promise<unknown>, note?: string) => {
    if (!selected) return;
    setActBusy(true);
    try {
      const result = await fn();
      await refreshSelected();
      if (note) {
        toast({ title: note, tone: "success" });
        setSelected(null);
      }
    } catch (e) {
      toast({ title: "Action failed", message: (e as Error).message, tone: "error" });
    } finally {
      setActBusy(false);
    }
  };

  const acknowledge = () => doAction(() => apiPatch(`/reports/${selected!.id}/status`, { to_status: "ACKNOWLEDGED", reason_note: "Verified and acknowledged by operator" }));
  const reject = () =>
    doAction(async () => {
      await apiPatch(`/reports/${selected!.id}/status`, { to_status: "REJECTED", reason_note: rejectNote || "Rejected by operator" });
      setRejectOpen(false);
    }, "Report rejected");
  const toDuplicate = () =>
    doAction(async () => {
      await apiPatch(`/reports/${selected!.id}/status`, { to_status: "DUPLICATE", parent_report_id: dupId, reason_note: `Duplicate of ${dupId}` });
      setDupOpen(false);
    }, "Marked as duplicate");
  const override = () =>
    doAction(async () => {
      await apiPatch(`/reports/${selected!.id}/override`, { waste_category: overrideCat });
      setOverrideCat("");
    });
  const assign = () =>
    doAction(async () => {
      await apiPost(`/reports/${selected!.id}/assign`, { worker_id: assignWorker, reason_note: "Assigned for collection" });
      setAssignWorker("");
    });

  const set = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }));

  const selectBox = (
    <select
      value={filters.status}
      onChange={(e) => set("status", e.target.value)}
      className="rounded-lg border-0 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-forest-100 ring-1 ring-white/10 focus:outline-none"
    >
      <option value="ALL">Any status</option>
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
      ))}
    </select>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Report Queue</h1>
          <p className="mt-1 text-sm text-forest-100/50">
            {data?.total ?? 0} reports match · AI classifies, you decide.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setFilters(EMPTY)}>
            <FilterX className="size-3.5" /> Reset
          </Button>
          <Button variant="secondary" size="sm" onClick={reload}>
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
        </div>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-52 flex-1 items-center gap-2 rounded-xl bg-white/5 px-3 ring-1 ring-white/10 focus-within:ring-forest-500/50">
            <Search className="size-4 text-forest-100/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, area, reporter…"
              className="w-full bg-transparent py-2 text-sm text-white placeholder:text-forest-100/30 focus:outline-none"
            />
          </div>
          {selectBox}
          <select
            value={filters.severity}
            onChange={(e) => set("severity", e.target.value)}
            className="rounded-lg border-0 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-forest-100 ring-1 ring-white/10 focus:outline-none"
          >
            <option value="ALL">Any severity</option>
            {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(e) => set("category", e.target.value)}
            className="rounded-lg border-0 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-forest-100 ring-1 ring-white/10 focus:outline-none"
          >
            <option value="ALL">Any category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filters.zone}
            onChange={(e) => set("zone", e.target.value)}
            className="rounded-lg border-0 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-forest-100 ring-1 ring-white/10 focus:outline-none"
          >
            <option value="ALL">Any zone</option>
            <option value="KOLKATA_URBAN">Kolkata Urban</option>
            <option value="GRAM_PANCHAYAT">Gram Panchayat</option>
          </select>
        </div>
      </Card>

      {loading ? (
        <Card><LoadingBlock label="Loading queue…" /></Card>
      ) : error ? (
        <Card><ErrorBlock message={error} onRetry={reload} /></Card>
      ) : rows.length === 0 ? (
        <Card><EmptyState title="No reports match these filters" hint="Try widening the filters or reset them." /></Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#0d2119]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left text-[11px] uppercase tracking-wider text-forest-100/40">
                  <th className="px-4 py-3">Report</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">AI</th>
                  <th className="px-4 py-3">Zone</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(r)} className="flex items-center gap-3 text-left">
                        {r.thumbnail_url && (
                          <img src={mediaUrl(r.thumbnail_url)} alt="" className="h-10 w-12 rounded-lg object-cover" />
                        )}
                        <div className="min-w-0">
                          <p className="max-w-56 truncate font-medium text-forest-100/90">
                            {r.description || `${r.waste_category} waste`}
                          </p>
                          <p className="text-[11px] text-forest-100/45">
                            {r.waste_category} · by {r.reporter_name || "citizen"}
                          </p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={r.severity === "CRITICAL" ? "bg-[#7F1D1D] text-white" : r.severity === "HIGH" ? "bg-red-500/15 text-red-300" : r.severity === "MEDIUM" ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300"}>
                        {r.severity} · {r.severity_score}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cx("bg-white/5 ring-1", r.status === "DANGER" ? "ring-red-500/40 text-red-300" : "ring-white/10 text-forest-100/80")}>
                        {r.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-forest-100/60">
                      {r.ai_analysis ? (
                        <>
                          {r.ai_analysis.primary_category}{" "}
                          <span className="text-forest-400">({(r.ai_analysis.confidence * 100).toFixed(0)}%)</span>
                        </>
                      ) : (
                        <span className="text-forest-100/35">pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-forest-100/55">{r.zone.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-xs text-forest-100/45">{timeAgo(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button size="sm" onClick={() => setSelected(r)}>
                          Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Triage & dispatch" wide>
        {selected && (
          <div className="grid gap-6 lg:grid-cols-2">
            <ReportDetail report={selected} />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Operator actions</h4>

              {(selected.status === "CLASSIFIED" || selected.status === "PENDING_REVIEW") && (
                <Button className="w-full" onClick={acknowledge} loading={actBusy}>
                  <CheckCircle2 className="size-4" /> Acknowledge (verify & activate)
                </Button>
              )}

              {selected.status === "ACKNOWLEDGED" && (
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-forest-100/50">
                    Assign to worker
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={assignWorker}
                      onChange={(e) => setAssignWorker(e.target.value)}
                      onFocus={loadWorkers}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-forest-500 focus:outline-none"
                    >
                      <option value="">Select worker…</option>
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>{w.full_name}</option>
                      ))}
                    </select>
                    <Button onClick={assign} loading={actBusy} disabled={!assignWorker}>
                      <UserPlus className="size-4" /> Assign
                    </Button>
                  </div>
                </div>
              )}

              {["CLASSIFIED", "PENDING_REVIEW"].includes(selected.status) && (
                <>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-forest-100/50">
                      Override AI category
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={overrideCat}
                        onChange={(e) => setOverrideCat(e.target.value)}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-forest-500 focus:outline-none"
                      >
                        <option value="">Select category…</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <Button variant="secondary" onClick={override} loading={actBusy} disabled={!overrideCat}>
                        <Wand2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="danger" onClick={() => setRejectOpen(true)}>
                      <ClipboardX className="size-4" /> Reject
                    </Button>
                    <Button variant="secondary" onClick={() => setDupOpen(true)}>
                      <Copy className="size-4" /> Duplicate
                    </Button>
                  </div>
                </>
              )}

              {selected.status === "RESOLVED" && (
                <Button className="w-full" onClick={() => doAction(() => apiPatch(`/reports/${selected.id}/status`, { to_status: "VERIFIED", reason_note: "Cleanup verified by operator" }))} loading={actBusy}>
                  <CheckCircle2 className="size-4" /> Verify resolution
                </Button>
              )}
              {selected.status === "VERIFIED" && (
                <Button className="w-full" onClick={() => doAction(() => apiPatch(`/reports/${selected.id}/status`, { to_status: "CLOSED", reason_note: "Archived" }))} loading={actBusy}>
                  <CheckCircle2 className="size-4" /> Close case
                </Button>
              )}

              <div className="rounded-xl bg-white/[0.03] p-3 text-xs text-forest-100/55 ring-1 ring-white/8">
                Workers can move ASSIGNED → IN_PROGRESS → RESOLVED. Verify after a crew uploads proof photos.
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject report">
        <Field label="Reason (required)">
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={3}
            placeholder="e.g. Spam submission or blurry, non-identifiable image…"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-forest-100/30 focus:border-forest-500 focus:outline-none"
          />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={reject} loading={actBusy} disabled={!rejectNote.trim()}>
            Reject report
          </Button>
        </div>
      </Modal>

      <Modal open={dupOpen} onClose={() => setDupOpen(false)} title="Mark as duplicate">
        <Field label="Primary report ID" hint="This report will be collapsed into the primary report you specify.">
          <input
            value={dupId}
            onChange={(e) => setDupId(e.target.value)}
            placeholder="e.g. 8f3a…-…"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-forest-100/30 focus:border-forest-500 focus:outline-none"
          />
        </Field>
        {selected?.possible_duplicate_of && (
          <p className="mt-2 text-xs text-amber-300">
            AI flagged a possible duplicate: {selected.possible_duplicate_of}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDupOpen(false)}>Cancel</Button>
          <Button onClick={toDuplicate} loading={actBusy} disabled={!dupId.trim()}>
            Mark duplicate
          </Button>
        </div>
      </Modal>
    </div>
  );
}