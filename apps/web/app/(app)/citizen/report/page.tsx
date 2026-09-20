"use client";

import { CheckCircle2, Crosshair, Loader2, MapPin, Navigation, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BinitMap } from "@/components/map/BinitMap";
import { ImageDropzone } from "@/components/forms/ImageDropzone";
import { Button, Card, ErrorBlock, Field, inputClass, SectionTitle } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { GEO_ZONES, Zone } from "@/lib/types";
import { useGeolocation } from "@/lib/hooks";
import { cx } from "@/lib/utils";

const SUGGESTED_AREAS: { label: string; zone: Zone; lat: number; lon: number }[] = [
  { label: "Park Street, Kolkata", zone: "KOLKATA_URBAN", lat: 22.5512, lon: 88.3524 },
  { label: "Salt Lake Sector V", zone: "KOLKATA_URBAN", lat: 22.5864, lon: 88.4174 },
  { label: "Gariahat Market", zone: "KOLKATA_URBAN", lat: 22.527, lon: 88.365 },
  { label: "Rajarhat GP canal", zone: "GRAM_PANCHAYAT", lat: 22.6105, lon: 88.5122 },
  { label: "Village pukur road", zone: "GRAM_PANCHAYAT", lat: 22.618, lon: 88.5201 },
];

export default function ReportPage() {
  const router = useRouter();
  const { coords, error: geoError, getting, locate } = useGeolocation();

  const defaultZone = useMemo<Zone>(() => "KOLKATA_URBAN", []);
  const [image, setImage] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState<{ lat: number; lon: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const zone: Zone = pin ? (pin.lat > 22.585 ? "GRAM_PANCHAYAT" : "KOLKATA_URBAN") : defaultZone;
  const mapCenter: [number, number] = coords ? [coords.lon, coords.lat] : GEO_ZONES[zone].center;

  const pickArea = (lat: number, lon: number, z: Zone) => {
    setPin({ lat, lon });
    setError(null);
  };

  const submit = async () => {
    setError(null);
    if (!image) {
      setError("Please attach a photo of the waste.");
      return;
    }
    if (!pin) {
      setError("Please set the location pin on the map (tap a suggested area or use GPS).");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("image", image);
      form.append("latitude", pin.lat.toFixed(6));
      form.append("longitude", pin.lon.toFixed(6));
      if (coords?.accuracy) form.append("location_accuracy", String(coords.accuracy));
      if (description.trim()) form.append("description", description.trim());
      const data = await api<{ id: string }>("/reports", { method: "POST", body: form });
      setSuccessId(data.id);
    } catch (e) {
      setError((e as Error).message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  if (successId) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-forest-500/20 text-forest-400">
          <CheckCircle2 className="size-9" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white">Report submitted!</h2>
        <p className="max-w-md text-sm text-forest-100/60">
          Our AI is now analyzing your photo and assessing severity. Track progress from your reports page in a moment.
        </p>
        <p className="text-xs text-forest-100/40">Reference ID: {successId.slice(0, 8)}</p>
        <div className="mt-2 flex gap-3">
          <Button onClick={() => router.push("/citizen/my-reports")}>View my reports</Button>
          <Button variant="secondary" onClick={() => router.push("/citizen/map")}>View map</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Report Waste"
        sub="Snap a photo, pin the location, and submit. The AI takes it from there."
      />

      {error && (
        <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/30">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="size-4 text-forest-400" />
              <h2 className="font-semibold text-white">1. Capture evidence</h2>
            </div>
            <ImageDropzone value={image} onChange={setImage} />
            <div className="mt-4">
              <Field label="What did you spot?" hint="Optional — describes the waste to help the AI (e.g. plastic bottles, hazardous chemical drums, overflowing organic waste)">
                <textarea
                  value={description}
                  maxLength={1000}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Large plastic packaging pile blocking the sidewalk drain…"
                  rows={3}
                  className={cx(inputClass, "resize-none")}
                />
              </Field>
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="size-4 text-forest-400" />
                <h2 className="font-semibold text-white">2. Pin the location</h2>
              </div>
              <Button variant="secondary" size="sm" onClick={locate} loading={getting} disabled={getting}>
                <Crosshair className="size-3.5" /> {getting ? "Locating…" : coords ? "Use my GPS" : "Use GPS"}
              </Button>
            </div>
            {geoError && <p className="mb-2 text-xs text-amber-400">{geoError} — pick a suggested area instead.</p>}
            {coords && !pin && (
              <button
                onClick={() => setPin({ lat: coords.lat, lon: coords.lon })}
                className="mb-2 w-full rounded-lg bg-forest-500/15 px-3 py-2 text-xs font-medium text-forest-300 ring-1 ring-forest-500/30 transition hover:bg-forest-500/25"
              >
                Lock GPS pin to {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
                {coords.accuracy ? ` (±${Math.round(coords.accuracy)}m)` : ""}
              </button>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUGGESTED_AREAS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => pickArea(a.lat, a.lon, a.zone)}
                  className={cx(
                    "rounded-full px-3 py-1 text-[11px] font-medium ring-1 transition",
                    pin && pin.lat === a.lat && pin.lon === a.lon
                      ? "bg-forest-500 text-white ring-forest-500"
                      : "bg-white/5 text-forest-100/70 ring-white/10 hover:bg-white/10",
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="p-2.5 sm:p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <MapPin className={cx("size-4", pin ? "text-forest-400" : "text-forest-100/40")} />
                <span className="text-xs sm:text-sm font-medium text-forest-100/70">
                  {pin ? (
                    <>Pin: {pin.lat.toFixed(4)}, {pin.lon.toFixed(4)}</>
                  ) : (
                    "Drag the pin to the exact spot"
                  )}
                </span>
              </div>
              <span
                className={cx(
                  "rounded-full px-2.5 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-[11px] font-semibold",
                  zone === "GRAM_PANCHAYAT"
                    ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40"
                    : "bg-forest-500/15 text-forest-300 ring-1 ring-forest-500/40",
                )}
              >
                {GEO_ZONES[zone].name}
              </span>
            </div>
            <BinitMap
              center={mapCenter}
              zoom={12}
              heightClass="h-[280px] sm:h-[420px]"
              draggablePin={
                pin
                  ? { lat: pin.lat, lon: pin.lon, onChange: (lat, lon) => setPin({ lat, lon }) }
                  : undefined
              }
            />
          </Card>

          <div className="mt-4 flex justify-end">
            <Button size="lg" className="w-full sm:w-auto" onClick={submit} loading={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Submit report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}