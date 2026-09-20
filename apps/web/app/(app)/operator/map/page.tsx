"use client";

import { Flame } from "lucide-react";
import { useMemo, useState } from "react";
import { BinitMap } from "@/components/map/BinitMap";
import { Card, EmptyState, LoadingBlock, Modal, SectionTitle } from "@/components/ui";
import { ReportDetail } from "@/components/report/ReportDetail";
import { api, mediaUrl } from "@/lib/api";
import { usePolling } from "@/lib/hooks";
import { toMarkers } from "@/lib/markers";
import { GEO_ZONES, Report, Zone, CATEGORIES, STATUSES, SEVERITY_COLORS } from "@/lib/types";
import { cx } from "@/lib/utils";

const ACTIVE = STATUSES.filter((s) => !["REJECTED", "DUPLICATE", "CANCELLED", "CLOSED"].includes(s));

export default function OperatorMapPage() {
  const [zone, setZone] = useState<Zone>("KOLKATA_URBAN");
  const [center, setCenter] = useState<[number, number]>(GEO_ZONES.KOLKATA_URBAN.center);
  const [zoom, setZoom] = useState(GEO_ZONES.KOLKATA_URBAN.zoom);
  const [heat, setHeat] = useState(false);
  const [category, setCategory] = useState("ALL");
  const [selected, setSelected] = useState<Report | null>(null);

  const params = new URLSearchParams();
  params.set("min_lat", "22.35");
  params.set("min_lon", "88.15");
  params.set("max_lat", "22.75");
  params.set("max_lon", "88.75");
  params.set("page_size", "500");
  params.set("zone", zone);
  if (category !== "ALL") params.set("category", category);

  const { data, loading } = usePolling<Report[]>(() => api(`/map/bounds?${params.toString()}`), 12000, [zone, category]);
  const reports = useMemo(() => (data || []).filter((r) => ACTIVE.includes(r.status)), [data]);

  const switchZone = (z: Zone) => {
    setZone(z);
    setCenter(GEO_ZONES[z].center);
    setZoom(GEO_ZONES[z].zoom);
    setSelected(null);
  };

  const selectReport = (id: string) => {
    const found = reports.find((r) => r.id === id);
    setSelected(found || null);
  };

  return (
    <div className="space-y-6">
      <SectionTitle title="Operations Map" sub="Exact coordinates · clustering · severity heatmap layer" />

      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(GEO_ZONES).map(([key, z]) => (
          <button
            key={key}
            onClick={() => switchZone(key as Zone)}
            className={cx(
              "rounded-full px-4 py-1.5 text-xs font-semibold ring-1 transition",
              zone === key ? "bg-forest-500 text-white ring-forest-500" : "bg-white/5 text-forest-100/70 ring-white/10 hover:bg-white/10",
            )}
          >
            {z.name}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-white/10" />
        <button
          onClick={() => setHeat((h) => !h)}
          className={cx(
            "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold ring-1 transition",
            heat ? "bg-orange-500 text-white ring-orange-500" : "bg-white/5 text-forest-100/70 ring-white/10 hover:bg-white/10",
          )}
        >
          <Flame className="size-3.5" /> Heatmap
        </button>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-full border-0 bg-white/5 px-3 py-1.5 text-xs font-medium text-forest-100 ring-1 ring-white/10 focus:outline-none"
        >
          <option value="ALL">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-forest-100/45">{reports.length} active points</span>
      </div>

      <div className="flex flex-wrap gap-4 text-[11px]">
        {Object.entries(SEVERITY_COLORS).map(([s, c]) => (
          <span key={s} className="flex items-center gap-1.5 text-forest-100/60">
            <span className="size-2.5 rounded-full" style={{ background: c }} /> {s}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/8 bg-[#0d2119]">
          <LoadingBlock />
        </div>
      ) : reports.length === 0 ? (
        <Card><EmptyState title="No active reports in this zone" /></Card>
      ) : (
        <BinitMap
          markers={toMarkers(reports)}
          center={center}
          zoom={zoom}
          heatmap={heat}
          onSelect={selectReport}
          heightClass="h-[600px]"
        />
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Report detail" wide>
        {selected && <ReportDetail report={selected} />}
      </Modal>
    </div>
  );
}