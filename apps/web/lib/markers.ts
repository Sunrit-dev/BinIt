import { MapMarker } from "@/components/map/BinitMap";
import { Report } from "./types";
import { mediaUrl } from "./api";

export function toMarker(report: Report): MapMarker {
  return {
    id: report.id,
    latitude: report.latitude,
    longitude: report.longitude,
    severity: report.severity,
    category: report.waste_category,
    status: report.status,
    title: report.description || report.waste_category,
    description: report.description || undefined,
    image_url: report.thumbnail_url ? mediaUrl(report.thumbnail_url) : undefined,
    score: report.severity_score,
    created_at: report.created_at ?? undefined,
  };
}

export function toMarkers(reports: Report[]): MapMarker[] {
  return reports.filter((r) => typeof r.latitude === "number" && typeof r.longitude === "number").map(toMarker);
}