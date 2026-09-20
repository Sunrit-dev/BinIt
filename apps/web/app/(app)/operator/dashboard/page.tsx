"use client";

import { AlertTriangle, ClipboardList, Clock, Inbox, MapPin, Recycle } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Card, EmptyState, ErrorBlock, LoadingBlock, SectionTitle, SeverityBadge, StatCard, StatusBadge } from "@/components/ui";
import { CategoryDonut, SeverityBar, TrendChart } from "@/components/charts";
import { api, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsyncData, usePolling } from "@/lib/hooks";
import { Analytics, DashboardSummary, Report, ReportList } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export default function OperatorDashboard() {
  const { user } = useAuth();
  const { data: summary } = usePolling<DashboardSummary>(() => api("/dashboard/summary"), 10000, []);
  const { data: analytics, error, loading } = useAsyncData<Analytics>(() => api("/dashboard/analytics"), []);
  const { data: latest, loading: loadingLatest } = useAsyncData<ReportList>(() => api("/reports?page_size=6"), []);

  const latestList = useMemo(() => latest?.items || [], [latest]);

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Live operations"
        title="Operations Dashboard"
        sub="Live intelligence across Kolkata Urban and Rajarhat Gram Panchayat."
      />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-5">
        <StatCard label="Total reports" value={summary?.total_reports ?? "—"} icon={<Recycle className="size-4" />} />
        <StatCard label="Pending triage" value={summary?.pending_triage ?? "—"} sub="awaiting operator" icon={<Inbox className="size-4" />} accent="amber" />
        <StatCard label="High / Critical" value={summary?.high_critical ?? "—"} sub="needs priority" icon={<AlertTriangle className="size-4" />} accent="red" />
        <StatCard label="Resolved today" value={summary?.resolved_today ?? "—"} icon={<ClipboardList className="size-4" />} accent="emerald" />
        <div className="col-span-2 sm:col-span-1">
          <StatCard label="Active backlog" value={summary?.backlog ?? "—"} sub="not yet closed" icon={<Clock className="size-4" />} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4">
        <StatCard
          label="Zone split"
          value={
            summary ? (
              <span className="text-base sm:text-lg">
                {summary.by_zone.KOLKATA_URBAN} <span className="text-xs text-forest-100/50">urban</span> ·{" "}
                {summary.by_zone.GRAM_PANCHAYAT} <span className="text-xs text-forest-100/50">panchayat</span>
              </span>
            ) : (
              "—"
            )
          }
          icon={<MapPin className="size-4" />}
          accent="amber"
        />
        <StatCard
          label="SLA"
          value={
            analytics ? (
              <span className="text-base sm:text-lg">
                {analytics.mttr_hours ? `${analytics.mttr_hours}h` : "—"}{" "}
                <span className="text-xs text-forest-100/50">MTTR</span> ·{" "}
                {analytics.mttt_hours ? `${analytics.mttt_hours}h` : "—"}{" "}
                <span className="text-xs text-forest-100/50">MTTT</span>
              </span>
            ) : (
              "—"
            )
          }
          icon={<Clock className="size-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-white">Waste category distribution</h3>
          {loading ? <LoadingBlock label="Loading distribution…" /> : <CategoryDonut data={analytics?.category_distribution || {}} />}
        </Card>
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-white">Severity breakdown</h3>
          {loading ? <LoadingBlock label="Loading severity…" /> : <SeverityBar data={analytics?.severity_distribution || {}} />}
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-white">14-day inflow vs. resolution</h3>
        {loading ? <LoadingBlock label="Loading trend…" /> : <TrendChart data={analytics?.trend_14d || []} />}
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Latest reports</h3>
          <Link href="/operator/queue" className="text-xs font-medium text-forest-400 hover:text-forest-300">
            Open queue →
          </Link>
        </div>
        {loadingLatest ? (
          <LoadingBlock label="Loading reports…" />
        ) : latestList.length === 0 ? (
          <EmptyState title="No reports yet" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {latestList.map((r) => (
              <div key={r.id} className="flex gap-3 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/8">
                {r.thumbnail_url && (
                  <img src={mediaUrl(r.thumbnail_url)} alt="" className="h-14 w-16 shrink-0 rounded-lg object-cover" />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={r.status} />
                    <SeverityBadge level={r.severity} score={r.severity_score} />
                  </div>
                  <p className="mt-1.5 truncate text-xs text-forest-100/70">{r.description || r.waste_category}</p>
                  <p className="mt-0.5 text-[10px] text-forest-100/40">
                    {r.waste_category} · {timeAgo(r.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}