export type Role = "CITIZEN" | "WORKER" | "OPERATOR" | "ADMIN";
export type Zone = "KOLKATA_URBAN" | "GRAM_PANCHAYAT";

export const GEO_ZONES = {
  KOLKATA_URBAN: {
    id: "KOLKATA_URBAN" as Zone,
    name: "Kolkata Urban (KMC)",
    center: [88.3639, 22.5726] as [number, number],
    zoom: 12.5,
  },
  GRAM_PANCHAYAT: {
    id: "GRAM_PANCHAYAT" as Zone,
    name: "Rajarhat Bishnupur GP",
    center: [88.5122, 22.6105] as [number, number],
    zoom: 13.5,
  },
};

export function zoneOf(report: Pick<Report, "latitude" | "longitude">): Zone {
  const urban = GEO_ZONES.KOLKATA_URBAN.center;
  const dUrban = Math.hypot(report.latitude - urban[1], report.longitude - urban[0]);
  const gp = GEO_ZONES.GRAM_PANCHAYAT.center;
  const dGp = Math.hypot(report.latitude - gp[1], report.longitude - gp[0]);
  return dUrban <= dGp ? "KOLKATA_URBAN" : "GRAM_PANCHAYAT";
}

export const ZONE_LABEL: Record<Zone, string> = {
  KOLKATA_URBAN: "Kolkata Urban (KMC)",
  GRAM_PANCHAYAT: "Rajarhat Bishnupur GP",
};

export const SEVERITY_COLORS: Record<string, string> = {
  LOW: "#10B981",
  MEDIUM: "#F59E0B",
  HIGH: "#EF4444",
  CRITICAL: "#7F1D1D",
};

export const CATEGORIES = [
  "PLASTIC",
  "PAPER",
  "METAL",
  "GLASS",
  "ORGANIC",
  "E_WASTE",
  "TEXTILE",
  "MIXED",
  "HAZARDOUS",
  "OTHER",
  "UNKNOWN",
];

export const STATUSES = [
  "SUBMITTED",
  "AI_PROCESSING",
  "CLASSIFIED",
  "PENDING_REVIEW",
  "ACKNOWLEDGED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "VERIFIED",
  "CLOSED",
  "REJECTED",
  "DUPLICATE",
  "CANCELLED",
  "AI_FAILED",
];

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  phone_number?: string | null;
  is_active?: boolean;
  created_at?: string | null;
};

export type AiAnalysis = {
  id: string;
  model_name: string;
  model_version: string;
  primary_category: string;
  confidence: number;
  secondary_predictions: { category: string; confidence: number }[];
  inference_time_ms: number;
  processed_at?: string | null;
};

export type ReportHistory = {
  id: string;
  from_status: string;
  to_status: string;
  changed_by_user_id?: string | null;
  reason_note?: string | null;
  created_at?: string | null;
};

export type Report = {
  id: string;
  user_id: string;
  image_url: string;
  thumbnail_url?: string | null;
  resolution_image_url?: string | null;
  description?: string | null;
  latitude: number;
  longitude: number;
  location_accuracy?: number | null;
  zone: Zone;
  address_text?: string | null;
  waste_category: string;
  classification_status: string;
  severity: string;
  severity_score: number;
  severity_reasons: string[];
  quantity_estimate?: string;
  status: string;
  assigned_worker_id?: string | null;
  parent_report_id?: string | null;
  collection_task_id?: string | null;
  possible_duplicate_of?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  resolved_at?: string | null;
  reporter_name?: string | null;
  assigned_worker_name?: string | null;
  ai_analysis?: AiAnalysis | null;
  history?: ReportHistory[];
};

export type DashboardSummary = {
  total_reports: number;
  pending_triage: number;
  high_critical: number;
  resolved_today: number;
  backlog: number;
  by_zone: Record<Zone, number>;
};

export type Analytics = {
  category_distribution: Record<string, number>;
  severity_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  trend_14d: { date: string; inflow: number; resolved: number }[];
  mttt_hours: number | null;
  mttr_hours: number | null;
};

export type Notification = {
  id: string;
  report_id?: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at?: string | null;
};

export type ReportList = {
  items: Report[];
  page: number;
  page_size: number;
  total: number;
};

export type OptimizedRoute = {
  total_distance_km: number;
  estimated_duration_min: number;
  waypoint_order: number[];
  route_geojson: { type: "LineString"; coordinates: [number, number][] };
  fallback?: boolean;
  reports: Report[];
};

export type AuditLog = {
  id: string;
  actor_user_id?: string | null;
  action_type: string;
  entity_name: string;
  entity_id: string;
  state_before?: Record<string, unknown> | null;
  state_after?: Record<string, unknown> | null;
  created_at?: string | null;
};

export function homeForRole(role: Role) {
  if (role === "WORKER") return "/worker/tasks";
  if (role === "OPERATOR") return "/operator/dashboard";
  if (role === "ADMIN") return "/admin/analytics";
  return "/citizen/report";
}