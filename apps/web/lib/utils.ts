import { SEVERITY_COLORS } from "./types";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function severityColor(severity: string) {
  return SEVERITY_COLORS[severity] || "#94a3b8";
}

export function severityBadgeClass(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "bg-[#7F1D1D] text-white";
    case "HIGH":
      return "bg-red-500/15 text-red-300 ring-1 ring-red-500/40";
    case "MEDIUM":
      return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40";
    default:
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40";
  }
}

export function statusBadgeClass(status: string) {
  const active = "bg-forest-500/15 text-forest-100 ring-1 ring-forest-500/40";
  const done = "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40";
  const warn = "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40";
  const fail = "bg-red-500/15 text-red-300 ring-1 ring-red-500/40";
  const terminal = "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/40";
  switch (status) {
    case "SUBMITTED":
    case "AI_PROCESSING":
    case "AI_FAILED":
      return active;
    case "CLASSIFIED":
    case "PENDING_REVIEW":
    case "ACKNOWLEDGED":
      return warn;
    case "ASSIGNED":
    case "IN_PROGRESS":
      return active;
    case "RESOLVED":
    case "VERIFIED":
    case "CLOSED":
      return done;
    default:
      return terminal;
  }
}