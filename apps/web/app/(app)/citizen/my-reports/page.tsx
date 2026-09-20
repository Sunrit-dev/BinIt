"use client";

import { MapPin, Plus, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, Card, EmptyState, ErrorBlock, LoadingBlock, Modal, SeverityBadge, StatusBadge } from "@/components/ui";
import { api, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsyncData, apiPatch } from "@/lib/hooks";
import { Report } from "@/lib/types";
import { timeAgo, cx } from "@/lib/utils";
import { ReportDetail } from "@/components/report/ReportDetail";

export default function MyReportsPage() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsyncData<Report[]>(() => api("/reports/me"), [user?.id]);
  const [selected, setSelected] = useState<Report | null>(null);
  const [actBusy, setActBusy] = useState(false);

  const cancel = async () => {
    if (!selected) return;
    setActBusy(true);
    try {
      await apiPatch(`/reports/${selected.id}/status`, { to_status: "CANCELLED", reason_note: "Cancelled by citizen" });
      const updated = await api<Report>(`/reports/${selected.id}`);
      setSelected(updated);
      await reload();
    } finally {
      setActBusy(false);
    }
  };

  const reports = useMemo(() => data || [], [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">My Reports</h1>
          <p className="mt-1 text-sm text-forest-100/50">Track the live status of your submissions.</p>
        </div>
        <Link href="/citizen/report">
          <Button>
            <Plus className="size-4" /> New report
          </Button>
        </Link>
      </div>

      {loading ? (
        <Card><LoadingBlock /></Card>
      ) : error ? (
        <Card><ErrorBlock message={error} onRetry={reload} /></Card>
      ) : reports.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MapPin className="size-8" />}
            title="No reports yet"
            hint="Spot something? Snap a photo and report it — it takes under 2 minutes."
          />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className="group overflow-hidden rounded-2xl border border-white/8 bg-[#0d2119] text-left transition hover:border-forest-500/40"
            >
              {r.thumbnail_url && (
                <div className="relative aspect-video overflow-hidden">
                  <img src={mediaUrl(r.thumbnail_url)} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                  <div className="absolute right-2 top-2">
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {r.waste_category}
                    </p>
                    <p className="mt-0.5 text-xs text-forest-100/45">{timeAgo(r.created_at)}</p>
                  </div>
                  <SeverityBadge level={r.severity} score={r.severity_score} />
                </div>
                {r.description && <p className="mt-2 line-clamp-2 text-xs text-forest-100/60">{r.description}</p>}
                <p className="mt-3 text-[10px] uppercase tracking-wider text-forest-100/40">
                  {r.zone.replace(/_/g, " ")}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Report detail" wide>
        {selected && (
          <div className="space-y-4">
            <ReportDetail report={selected} />
            {selected.status === "SUBMITTED" && (
              <div className="flex justify-end border-t border-white/8 pt-4">
                <Button variant="danger" onClick={cancel} loading={actBusy}>
                  Cancel report
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}