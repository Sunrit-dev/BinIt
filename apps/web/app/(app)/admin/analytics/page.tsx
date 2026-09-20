"use client";

import {
  BarChart3,
  ClipboardList,
  Clock,
  Gauge,
  Inbox,
  MapPin,
  Recycle,
  AlertTriangle,
  HeartHandshake,
} from "lucide-react";
import { Card, ErrorBlock, LoadingBlock, SectionTitle, StatCard } from "@/components/ui";
import { CategoryDonut, SeverityBar, TrendChart } from "@/components/charts";
import { api } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks";
import { Analytics as AnalyticsData, DashboardSummary } from "@/lib/types";

export default function AdminAnalytics() {
  const { data: analytics, error, loading, reload } = useAsyncData<AnalyticsData>(() => api("/dashboard/analytics"), []);
  const { data: summary } = useAsyncData<DashboardSummary>(() => api("/dashboard/summary"), []);

  const statusRows = Object.entries(analytics?.status_distribution || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Municipal Analytics"
        sub="Longitudinal environmental intelligence for budget allocation and policy."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total reports" value={summary?.total_reports ?? "—"} icon={<Recycle className="size-4" />} />
        <StatCard label="MTTR" value={analytics?.mttr_hours ? `${analytics.mttr_hours}h` : "—"} sub="mean time to resolve" icon={<Clock className="size-4" />} accent="amber" />
        <StatCard label="MTTT" value={analytics?.mttt_hours ? `${analytics.mttt_hours}h` : "—"} sub="mean time to triage" icon={<Gauge className="size-4" />} accent="emerald" />
        <StatCard label="Backlog" value={summary?.backlog ?? "—"} sub="open work items" icon={<Inbox className="size-4" />} />
      </div>

      {loading ? (
        <Card><LoadingBlock label="Crunching numbers…" /></Card>
      ) : error ? (
        <Card><ErrorBlock message={error} onRetry={reload} /></Card>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-white">Waste composition by category</h3>
              <CategoryDonut data={analytics?.category_distribution || {}} />
            </Card>
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-white">Severity pressure</h3>
              <SeverityBar data={analytics?.severity_distribution || {}} />
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-white">Status pipeline</h3>
              <div className="space-y-2">
                {statusRows.map(([status, count]) => {
                  const max = Math.max(...statusRows.map(([, c]) => c), 1);
                  return (
                    <div key={status} className="flex items-center gap-3 text-xs">
                      <span className="w-36 shrink-0 text-forest-100/70">{status.replace(/_/g, " ")}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-forest-500 to-emerald-400"
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-semibold text-white">{count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-white">30-day volume trend</h3>
              <TrendChart data={analytics?.trend_14d || []} />
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <div className="mb-3 flex items-center gap-2 text-forest-400"><BarChart3 className="size-4" /></div>
              <p className="text-sm font-semibold text-white">Hotspot recurrence index</p>
              <p className="mt-2 text-xs leading-relaxed text-forest-100/55">
                Combine CRITICAL clusters across categories to prioritise recurring dumpsites for CCTV placement, extra bins and panchayat patrol.
              </p>
            </Card>
            <Card>
              <div className="mb-3 flex items-center gap-2 text-amber-400"><AlertTriangle className="size-4" /></div>
              <p className="text-sm font-semibold text-white">Priority zones</p>
              <p className="mt-2 text-xs leading-relaxed text-forest-100/55">
                E-waste and hazardous reports rank highest in the queue. Keep <span className="text-forest-300">HIGH</span> /{" "}
                <span className="text-red-300">CRITICAL</span> below 5 open items per zone.
              </p>
            </Card>
            <Card>
              <div className="mb-3 flex items-center gap-2 text-emerald-400"><HeartHandshake className="size-4" /></div>
              <p className="text-sm font-semibold text-white">Next steps</p>
              <p className="mt-2 text-xs leading-relaxed text-forest-100/55">
                Export these KPIs to a ward-level report to justify compactor fleet and e-rickshaw route budgets.
              </p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}