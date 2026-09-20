"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";
import Link from "next/link";
import { ReactNode, useEffect } from "react";
import { cx, severityBadgeClass, statusBadgeClass } from "@/lib/utils";

/* ---------------------------------- icons --------------------------------- */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx("size-5 animate-spin text-forest-400", className)} />;
}

/* ------------------------------- loading block ----------------------------- */
export function LoadingBlock({ label = "Loading…", rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-2.5">
        <Spinner className="size-5" />
        <p className="text-sm text-forest-100/60">{label}</p>
      </div>
      <div className="grid gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="shimmer h-12 rounded-2xl" style={{ opacity: 1 - i * 0.22 }} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- error block ------------------------------ */
export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <div className="flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-1.5 text-sm text-red-300 ring-1 ring-red-500/30">
        <AlertTriangle className="size-4" />
        {message}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/* ---------------------------------- button --------------------------------- */
export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}) {
  const variants: Record<string, string> = {
    primary:
      "bg-gradient-primary text-white shadow-glow-forest hover:brightness-110 active:brightness-95 disabled:from-forest-700 disabled:to-teal-700 disabled:shadow-none disabled:opacity-60",
    secondary:
      "glass text-forest-100 hover:bg-white/10 active:bg-white/10 disabled:opacity-50",
    outline:
      "border border-forest-500/40 text-forest-300 hover:bg-forest-500/10 hover:border-forest-500/70 disabled:opacity-50",
    ghost: "text-forest-100 hover:bg-white/5 active:bg-white/10 disabled:opacity-50",
    danger:
      "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red hover:brightness-110 disabled:opacity-50",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2.5 text-sm rounded-xl",
    lg: "px-6 py-3 text-base rounded-xl",
  };
  return (
    <button
      className={cx(
        "relative inline-flex select-none items-center justify-center gap-2 font-semibold transition-all duration-200",
        "active:translate-y-px focus-visible:-translate-y-px",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner className={size === "sm" ? "size-3.5" : "size-4"} />}
      {children}
    </button>
  );
}

/* ----------------------------------- card ---------------------------------- */
export function Card({
  children,
  className,
  interactive,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={cx(
        "glass rounded-2xl p-5 shadow-card",
        interactive &&
          "transition-all duration-300 hover:-translate-y-1 hover:shadow-lift hover:border-forest-500/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* -------------------------------- stat card -------------------------------- */
export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "forest",
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
  accent?: "forest" | "amber" | "red" | "emerald" | "sky";
}) {
  const accents: Record<string, string> = {
    forest: "bg-forest-500/15 text-forest-400 ring-forest-500/30",
    amber: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
    red: "bg-red-500/15 text-red-400 ring-red-500/30",
    emerald: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
    sky: "bg-sky-500/15 text-sky-400 ring-sky-500/30",
  };
  return (
    <Card interactive className="group flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest-100/55">
          {label}
        </p>
        {icon && (
          <span
            className={cx(
              "rounded-xl p-2 ring-1 transition-transform duration-300 group-hover:scale-110",
              accents[accent],
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div>
        <div className="font-display text-3xl font-bold tracking-tight text-white">{value}</div>
        {sub && <p className="mt-1 text-xs text-forest-100/50">{sub}</p>}
      </div>
    </Card>
  );
}

/* ---------------------------------- badge ---------------------------------- */
export function Badge({ children, className, dot }: { children: ReactNode; className?: string; dot?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current opacity-70" style={{ background: dot }} />}
      {children}
    </span>
  );
}

export function SeverityBadge({ level, score }: { level: string; score?: number }) {
  return (
    <Badge className={severityBadgeClass(level)}>
      <span className="size-1.5 rounded-full bg-current" />
      {level}
      {typeof score === "number" && <span className="opacity-75">({score})</span>}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge className={statusBadgeClass(status)}>◎ {status.replace(/_/g, " ")}</Badge>;
}

/* -------------------------------- empty state ------------------------------ */
export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-dashed border-forest-500/40 bg-forest-500/5 text-forest-400">
        {icon}
      </div>
      <p className="text-sm font-semibold text-forest-100/85">{title}</p>
      {hint && <p className="max-w-sm text-xs leading-relaxed text-forest-100/45">{hint}</p>}
    </div>
  );
}

/* ---------------------------------- modal ---------------------------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onTab = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const focusables = Array.from(
          document.querySelectorAll<HTMLElement>("[data-modal]:not([disabled])"),
        ).filter((el) => el.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) last.focus();
        else if (!e.shiftKey && document.activeElement === last) first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("keydown", onTab);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("keydown", onTab);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div
        data-modal
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          "relative z-10 max-h-[92dvh] w-full animate-scale-in overflow-y-auto rounded-t-3xl border border-white/10 bg-surface-850 p-5 shadow-lift sm:rounded-3xl sm:p-6",
          wide ? "sm:max-w-4xl" : "sm:max-w-lg",
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-display text-lg font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-forest-100/60 transition hover:bg-white/5 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------- field ---------------------------------- */
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-forest-100/60">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-forest-100/40">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-forest-100/30 transition focus:border-forest-500/70 focus:outline-none focus:ring-2 focus:ring-forest-500/25";

/* -------------------------------- nav link --------------------------------- */
export function NavLink({
  href,
  active,
  children,
  onClick,
  badge,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  badge?: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cx(
        "group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
        active
          ? "bg-gradient-to-r from-forest-500/25 to-teal-500/10 text-white ring-1 ring-forest-500/30"
          : "text-forest-100/65 hover:bg-white/5 hover:text-forest-100",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-forest-400 to-teal-400" />
      )}
      {children}
      {badge && <span className="ml-auto">{badge}</span>}
    </Link>
  );
}

/* ------------------------------- section title ----------------------------- */
export function SectionTitle({
  title,
  sub,
  right,
  eyebrow,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-forest-400/80">{eyebrow}</p>
        )}
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1.5 text-sm leading-relaxed text-forest-100/50">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* --------------------------------- skeleton -------------------------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("shimmer rounded-xl", className)} />;
}

/* ---------------------------------- tooltip -------------------------------- */
export function Tooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-surface-700 px-2.5 py-1 text-[11px] font-medium text-forest-100 opacity-0 shadow-lift ring-1 ring-white/10 transition-all duration-150 group-hover/tt:opacity-100">
        {label}
      </span>
    </span>
  );
}

/* --------------------------------- progress -------------------------------- */
export function Progress({ value, tone = "forest" }: { value: number; tone?: "forest" | "amber" | "red" | "sky" }) {
  const tones: Record<string, string> = {
    forest: "from-forest-500 to-teal-400",
    amber: "from-amber-500 to-orange-400",
    red: "from-red-500 to-rose-400",
    sky: "from-sky-500 to-blue-400",
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
      <div
        className={cx("h-full rounded-full bg-gradient-to-r transition-all duration-700", tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ----------------------------------- kbd ----------------------------------- */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-forest-100/70">
      {children}
    </kbd>
  );
}