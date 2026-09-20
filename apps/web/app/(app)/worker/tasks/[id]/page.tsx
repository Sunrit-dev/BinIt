"use client";

import { ArrowLeft, CheckCircle2, ExternalLink, Hammer, ImagePlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { BinitMap } from "@/components/map/BinitMap";
import { Button, Card, ErrorBlock, LoadingBlock, SeverityBadge, StatusBadge } from "@/components/ui";
import { ReportDetail } from "@/components/report/ReportDetail";
import { api, mediaUrl } from "@/lib/api";
import { useToast } from "@/components/toast";
import { useAsyncData, apiPatch } from "@/lib/hooks";
import { toMarkers } from "@/lib/markers";
import { Report } from "@/lib/types";

export default function WorkerTaskDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: report, error, loading, reload } = useAsyncData<Report>(() => api(`/reports/${id}`), [id]);
  const [busy, setBusy] = useState(false);
  const [resolutionFile, setResolutionFile] = useState<File | null>(null);
  const { toast } = useToast();

  const canStart = report?.status === "ASSIGNED";
  const canResolve = report?.status === "IN_PROGRESS";

  const start = async () => {
    setBusy(true);
    try {
      await apiPatch(`/reports/${id}/status`, { to_status: "IN_PROGRESS", reason_note: "Worker arrived on site" });
      await reload();
      toast({ title: "Task started", message: "Marked as on-site.", tone: "success" });
    } catch (e) {
      toast({ title: "Update failed", message: (e as Error).message, tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const resolve = async () => {
    setBusy(true);
    try {
      if (resolutionFile) {
        const fd = new FormData();
        fd.append("image", resolutionFile);
        await api(`/reports/${id}/resolve-photo`, { method: "POST", body: fd });
      }
      await apiPatch(`/reports/${id}/status`, { to_status: "RESOLVED", reason_note: "Waste collected" });
      await reload();
      toast({ title: "Site marked collected", message: "The operator will verify and close it.", tone: "success" });
    } catch (e) {
      toast({ title: "Update failed", message: (e as Error).message, tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const findNav = () => {
    if (!report) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}`;
    window.open(url, "_blank");
  };

  const markers = useMemo(() => (report ? toMarkers([report]) : []), [report]);

  if (loading) return <Card><LoadingBlock label="Loading task…" /></Card>;
  if (error) return <Card><ErrorBlock message={error} /></Card>;
  if (!report) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/worker/tasks" className="flex items-center gap-2 text-sm text-forest-100/60 transition hover:text-white">
          <ArrowLeft className="size-4" /> Back to tasks
        </Link>
        <Button variant="secondary" size="sm" onClick={findNav}>
          <ExternalLink className="size-3.5" /> Navigate to site
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-2xl font-bold text-white">Task {report.id.slice(0, 8)}</h1>
        <StatusBadge status={report.status} />
        <SeverityBadge level={report.severity} score={report.severity_score} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-2.5 sm:p-5">
          <BinitMap markers={markers} center={[report.longitude, report.latitude]} zoom={14} heightClass="h-[280px] sm:h-[380px]" />
          <div className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-xs ring-1 ring-white/8">
            <span className="text-forest-100/60">Exact coordinates</span>
            <span className="font-mono text-forest-100">{report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}</span>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <ReportDetail report={report} />
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold text-white">Workflow</h3>
            {canStart ? (
              <Button className="w-full" onClick={start} loading={busy}>
                <Hammer className="size-4" /> Start job (mark on-site)
              </Button>
            ) : canResolve ? (
              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-forest-100/50">
                    Upload proof of work (optional)
                  </p>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-sm text-forest-100/70 transition hover:border-forest-500/50">
                    <ImagePlus className="size-5" />
                    {resolutionFile ? resolutionFile.name : "Attach cleaned-area photo"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setResolutionFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <Button className="w-full" onClick={resolve} loading={busy}>
                  <CheckCircle2 className="size-4" /> Mark collected (RESOLVED)
                </Button>
              </div>
            ) : (
              <p className="rounded-xl bg-white/[0.03] px-4 py-3 text-xs text-forest-100/55 ring-1 ring-white/8">
                {report.status === "RESOLVED"
                  ? "You've marked this site as cleaned. The operator will verify and close it."
                  : "The operator is handling the next step for this task."}
                {report.status === "RESOLVED" && report.resolution_image_url && (
                  <img src={mediaUrl(report.resolution_image_url)} alt="proof" className="mt-3 max-h-44 rounded-xl object-cover" />
                )}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}