"use client";

import { Brain, History, Image as ImageIcon, MapPin } from "lucide-react";
import { Report } from "@/lib/types";
import { mediaUrl } from "@/lib/api";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { Card, SeverityBadge, StatusBadge } from "@/components/ui";

export function ReportDetail({ report }: { report: Report }) {
  const ai = report.ai_analysis;
  return (
    <div className="space-y-4">
      {report.image_url && (
        <img src={mediaUrl(report.image_url)} alt="Waste evidence" className="aspect-video w-full rounded-xl object-cover" />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={report.status} />
        <SeverityBadge level={report.severity} score={report.severity_score} />
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-forest-100/70 ring-1 ring-white/10">
          {report.waste_category}
        </span>
      </div>

      {report.description && (
        <p className="text-sm leading-relaxed text-forest-100/80">“{report.description}”</p>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <p className="text-forest-100/40">Coordinates</p>
          <p className="mt-0.5 font-mono text-forest-100">{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</p>
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <p className="text-forest-100/40">Zone</p>
          <p className="mt-0.5 font-medium">{report.zone.replace(/_/g, " ")}</p>
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <p className="text-forest-100/40">Reporter</p>
          <p className="mt-0.5 font-medium">{report.reporter_name || "—"}</p>
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <p className="text-forest-100/40">Submitted</p>
          <p className="mt-0.5 font-medium">{timeAgo(report.created_at)}</p>
        </div>
        {report.assigned_worker_name && (
          <div className="rounded-lg bg-white/5 px-3 py-2">
            <p className="text-forest-100/40">Assigned worker</p>
            <p className="mt-0.5 font-medium">{report.assigned_worker_name}</p>
          </div>
        )}
        {report.resolution_image_url && (
          <div className="col-span-2 rounded-lg bg-white/5 px-3 py-2">
            <p className="mb-1 text-forest-100/40">Resolution photo</p>
            <img src={mediaUrl(report.resolution_image_url)} alt="Resolution proof" className="max-h-40 rounded-lg object-cover" />
          </div>
        )}
      </div>

      <Card className="!p-4">
        <div className="mb-2 flex items-center gap-2">
          <Brain className="size-4 text-forest-400" />
          <h4 className="text-sm font-semibold text-white">AI Analysis</h4>
        </div>
        {ai ? (
          <div className="space-y-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-forest-100">{ai.primary_category}</span>
              <span className="rounded-full bg-forest-500/15 px-2 py-0.5 font-semibold text-forest-300">
                {(ai.confidence * 100).toFixed(0)}% confidence
              </span>
              <span className="text-forest-100/40">{ai.model_name} · {ai.model_version}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ai.secondary_predictions?.map((s) => (
                <span key={s.category} className="rounded-full bg-white/5 px-2 py-0.5 text-forest-100/60">
                  {s.category} {Math.round(s.confidence * 100)}%
                </span>
              ))}
            </div>
            <p className="text-forest-100/40">
              Classification status: <span className="font-medium text-forest-100">{report.classification_status.replace(/_/g, " ")}</span> ·
              Inference {ai.inference_time_ms}ms
            </p>
          </div>
        ) : (
          <p className="text-xs text-forest-100/50">No analysis yet.</p>
        )}

        {report.severity_reasons.length > 0 && (
          <div className="mt-4 border-t border-white/8 pt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-forest-100/50">
              Why severity = {report.severity} ({report.severity_score}/100)
            </p>
            <ul className="space-y-1 text-xs text-forest-100/70">
              {report.severity_reasons.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-forest-500">▸</span> {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {report.history && report.history.length > 0 && (
        <Card className="!p-4">
          <div className="mb-3 flex items-center gap-2">
            <History className="size-4 text-forest-400" />
            <h4 className="text-sm font-semibold text-white">Lifecycle Audit Trail</h4>
          </div>
          <ol className="relative space-y-3 border-l border-white/10 pl-4">
            {[...report.history].reverse().map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-forest-500 ring-2 ring-[#0b1f17]" />
                <p className="text-xs">
                  <span className="font-mono text-forest-100/80">{h.from_status.replace(/_/g, " ")}</span>
                  <span className="mx-1 text-forest-100/30">→</span>
                  <span className="font-mono font-semibold text-forest-300">{h.to_status.replace(/_/g, " ")}</span>
                  {h.reason_note && <span className="ml-1 text-forest-100/50">· {h.reason_note}</span>}
                </p>
                <p className="mt-0.5 text-[10px] text-forest-100/40">{formatDateTime(h.created_at)}</p>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}