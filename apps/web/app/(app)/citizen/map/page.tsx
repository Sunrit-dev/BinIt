"use client";

import { MapPin, Building2, Loader2, LocateFixed, Radar } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BinitMap } from "@/components/map/BinitMap";
import { Card, EmptyState, ErrorBlock, SectionTitle } from "@/components/ui";
import { api, mediaUrl } from "@/lib/api";
import { riskZonesFromReports } from "@/lib/geo";
import { useLiveGeolocation, usePolling } from "@/lib/hooks";
import { toMarkers } from "@/lib/markers";
import { Report, GEO_ZONES, Zone, CATEGORIES, STATUSES } from "@/lib/types";
import { cx } from "@/lib/utils";

const ACTIVE_STATUSES = STATUSES.filter((s) => !["REJECTED", "DUPLICATE", "CANCELLED"].includes(s));

function QP() {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.hash.slice(2));
  return { zone: (p.get("zone") as Zone) || null };
}

export default function CitizenMapPage() {
  const [zone, setZone] = useState<Zone | null>(() => {
    const qp = QP();
    return qp?.zone || null;
  });
  const [category, setCategory] = useState("ALL");
  const [selected, setSelected] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);

  const params = new URLSearchParams();
  const bounds = { min_lat: 22.35, min_lon: 88.15, max_lat: 22.75, max_lon: 88.75 };
  params.set("min_lat", String(bounds.min_lat));
  params.set("min_lon", String(bounds.min_lon));
  params.set("max_lat", String(bounds.max_lat));
  params.set("max_lon", String(bounds.max_lon));
  params.set("page", "500");
  if (zone) params.set("zone", zone);
  if (category !== "ALL") params.set("category", category);

  const { data, error, loading } = usePolling<Report[]>(
    () => api(`/map/bounds?${params.toString()}`),
    15000,
    [zone, category],
  );

  useEffect(() => {
    if (data) setReports(data);
  }, [data]);

  const [liveEnabled, setLiveEnabled] = useState(false);
  const liveGeo = useLiveGeolocation();
  const riskZones = useMemo(() => riskZonesFromReports(reports), [reports]);
  const live = useMemo(
    () =>
      liveEnabled && liveGeo.coords
        ? { lat: liveGeo.coords.lat, lon: liveGeo.coords.lon, accuracy: liveGeo.coords.accuracy, heading: liveGeo.coords.heading, speed: liveGeo.coords.speed }
        : null,
    [liveEnabled, liveGeo.coords],
  );

  const markers = useMemo(() => toMarkers(reports.filter((r) => ACTIVE_STATUSES.includes(r.status))), [reports]);
  const selectedReport = useMemo(() => reports.find((r) => r.id === selected) || null, [reports, selected]);

  const baseCenter: [number, number] = GEO_ZONES[zone || "KOLKATA_URBAN"].center;
  const baseZoom = GEO_ZONES[zone || "KOLKATA_URBAN"].zoom;

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Waste Map"
        sub="Location precision is blurred to ~100 m on this public view to protect reporters."
      />

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 sm:flex-wrap sm:pb-0">
        <button
          onClick={() => {
            const next = !liveEnabled;
            setLiveEnabled(next);
            if (next) liveGeo.start();
            else liveGeo.stop();
          }}
          className={cx(
            "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition active:scale-95",
            liveEnabled ? "bg-sky-500 text-white ring-sky-500" : "bg-white/5 text-forest-100/70 ring-white/10 hover:bg-white/10",
          )}
        >
          <Radar className={cx("size-3.5", liveEnabled && "animate-pulse")} /> Live
        </button>
        <button
          onClick={() => setZone(null)}
          className={cx(
            "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition active:scale-95",
            !zone ? "bg-forest-500 text-white ring-forest-500" : "bg-white/5 text-forest-100/70 ring-white/10 hover:bg-white/10",
          )}
        >
          <MapPin className="size-3.5" /> All zones
        </button>
        {Object.entries(GEO_ZONES).map(([key, z]) => (
          <button
            key={key}
            onClick={() => setZone(zone === key ? null : (key as Zone))}
            className={cx(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition active:scale-95",
              zone === key ? "bg-forest-500 text-white ring-forest-500" : "bg-white/5 text-forest-100/70 ring-white/10 hover:bg-white/10",
            )}
          >
            <Building2 className="size-3.5" /> {z.name}
          </button>
        ))}
        <span className="hidden sm:inline mx-1 h-4 w-px bg-white/10 shrink-0" />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="shrink-0 rounded-full border-0 bg-white/5 px-3 py-1.5 text-xs font-medium text-forest-100 ring-1 ring-white/10 focus:outline-none"
        >
          <option value="ALL">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className={cx("lg:col-span-2", selectedReport && "lg:col-span-2")}>
          {loading ? (
            <div className="flex h-[340px] sm:h-[540px] items-center justify-center rounded-2xl border border-white/8 bg-[#0d2119]">
              <Loader2 className="size-5 animate-spin text-forest-400" />
            </div>
          ) : error ? (
            <ErrorBlock message={error} onRetry={() => window.location.reload()} />
          ) : (
            <BinitMap markers={markers} center={baseCenter} zoom={baseZoom} selectedId={selected} onSelect={setSelected} heightClass="h-[340px] sm:h-[540px]" live={live} riskZones={riskZones} />
          )}
        </div>

        <div className="lg:col-span-1">
          {selectedReport ? (
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-white">Report detail</h3>
                <button onClick={() => setSelected(null)} className="text-xs text-forest-100/50 hover:text-white">Close</button>
              </div>
              {selectedReport.thumbnail_url && (
                <img
                  src={mediaUrl(selectedReport.thumbnail_url)}
                  alt=""
                  className="mb-3 aspect-video w-full rounded-xl object-cover"
                />
              )}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded-full bg-forest-500/15 px-2 py-0.5 font-semibold text-forest-300">{selectedReport.severity}</span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-forest-100/70">{selectedReport.waste_category}</span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-forest-100/70">{selectedReport.status.replace(/_/g, " ")}</span>
              </div>
              {selectedReport.description && <p className="mt-3 text-sm text-forest-100/80">“{selectedReport.description}”</p>}
              <p className="mt-3 text-xs text-forest-100/50">{selectedReport.address_text || "Approximate location"}</p>
            </Card>
          ) : markers.length === 0 ? (
            <Card>
              <EmptyState title="No reports in view" hint="Try widening filters or switching zones." />
            </Card>
          ) : (
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-white">In this area · {markers.length} active</h3>
              <div className="max-h-[500px] space-y-2 overflow-y-auto pr-1">
                {[...reports]
                  .filter((r) => ACTIVE_STATUSES.includes(r.status))
                  .sort((a, b) => b.severity_score - a.severity_score)
                  .slice(0, 12)
                  .map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelected(r.id)}
                      className={cx(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition",
                        selected === r.id ? "bg-forest-500/10 ring-forest-500/40" : "bg-white/[0.03] ring-white/8 hover:bg-white/5",
                      )}
                    >
                      <span
                        className="block size-2.5 shrink-0 rounded-full"
                        style={{ background: ({ LOW: "#10B981", MEDIUM: "#F59E0B", HIGH: "#EF4444", CRITICAL: "#7F1D1D" } as Record<string, string>)[r.severity] }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-forest-100/90">
                          {r.description || r.waste_category}
                        </p>
                        <p className="text-[10px] text-forest-100/45">
                          {r.waste_category} · {r.severity} {r.severity_score} · {r.zone.replace(/_/g, " ")}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}