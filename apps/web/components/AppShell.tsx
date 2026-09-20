"use client";

import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Map,
  MapPin,
  Menu,
  Route as RouteIcon,
  ScrollText,
  Trash2,
  Truck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { NotificationBell } from "@/components/notifications";
import { Tooltip } from "@/components/ui";
import { AmbientEcoBackground } from "@/components/landing/AmbientEcoBackground";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { homeForRole } from "@/lib/types";
import { cx } from "@/lib/utils";

type NavItem = { href: string; label: string; short: string; icon: ReactNode; main?: boolean };

const NAV: Record<string, NavItem[]> = {
  CITIZEN: [
    { href: "/citizen/report", label: "Report Waste", short: "Report", icon: <Trash2 className="size-[18px]" />, main: true },
    { href: "/citizen/map", label: "Explore Map", short: "Map", icon: <Map className="size-[18px]" /> },
    { href: "/citizen/my-reports", label: "My Reports", short: "Track", icon: <MapPin className="size-[18px]" /> },
  ],
  WORKER: [
    { href: "/worker/tasks", label: "My Tasks", short: "Tasks", icon: <Truck className="size-[18px]" />, main: true },
    { href: "/citizen/map", label: "Zone Map", short: "Map", icon: <Map className="size-[18px]" /> },
  ],
  OPERATOR: [
    { href: "/operator/dashboard", label: "Dashboard", short: "Home", icon: <LayoutDashboard className="size-[18px]" />, main: true },
    { href: "/operator/queue", label: "Report Queue", short: "Queue", icon: <ClipboardList className="size-[18px]" /> },
    { href: "/operator/map", label: "Ops Map", short: "Map", icon: <Map className="size-[18px]" /> },
    { href: "/operator/routes", label: "Route Planner", short: "Routes", icon: <RouteIcon className="size-[18px]" /> },
  ],
  ADMIN: [
    { href: "/admin/analytics", label: "Analytics", short: "Stats", icon: <BarChart3 className="size-[18px]" />, main: true },
    { href: "/operator/queue", label: "Report Queue", short: "Queue", icon: <ClipboardList className="size-[18px]" /> },
    { href: "/admin/users", label: "Users & Roles", short: "Users", icon: <Users className="size-[18px]" /> },
    { href: "/admin/audit-logs", label: "Audit Logs", short: "Audit", icon: <ScrollText className="size-[18px]" /> },
  ],
} as const;

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link href={onClick ? "/" : "#"} onClick={onClick} className="flex items-center gap-2.5">
      <img
        src="/icons/icon-512.png"
        alt="Binit Logo"
        className="size-9 rounded-xl object-contain shadow-glow-forest"
      />
      <span className="font-display text-lg font-bold tracking-tight text-white">
        binit
        <span className="ml-1 hidden bg-gradient-primary bg-clip-text text-sm font-semibold text-transparent sm:inline">
          · solve it
        </span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const user = useRequireAuth();
  const { logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  if (!user) return null;

  const nav = NAV[user.role as keyof typeof NAV] || NAV.CITIZEN;

  const sidebar = (
    <div className="flex h-full flex-col justify-between overflow-hidden">
      {/* Drawer header */}
      <div className="shrink-0">
        <div className="flex items-center justify-between px-5 py-4">
          <Brand />
          <button
            type="button"
            className="rounded-xl p-2 text-white/70 transition hover:bg-white/10 active:scale-95 lg:hidden"
            onClick={(e) => {
              e.stopPropagation();
              setMobileOpen(false);
            }}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>
        <p className="px-5 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-forest-400/60">
          {user.role.toLowerCase()} workspace
        </p>
      </div>

      {/* Scrollable nav items */}
      <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto px-3 py-2">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cx(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-gradient-to-r from-forest-500/25 to-teal-500/5 text-white ring-1 ring-forest-500/30"
                  : "text-forest-100/65 hover:bg-white/5 hover:text-forest-100",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-forest-400 to-teal-400" />
              )}
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User profile & Logout Footer - firmly pinned and never shrunk */}
      <div className="shrink-0 border-t border-white/10 bg-surface-950/90 p-4 pb-[max(env(safe-area-inset-bottom),1.75rem)]">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-primary font-bold text-white uppercase shadow-glow-forest">
            {(user.full_name || "U").slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.full_name}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-forest-400">
              {user.role.replace("_", " ")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            logout();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/20 py-2.5 text-xs font-semibold text-red-200 ring-1 ring-red-500/40 transition hover:bg-red-500/30 active:scale-95"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-transparent">
      <AmbientEcoBackground />

      {/* desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-white/8 lg:bg-surface-900/70 lg:backdrop-blur-xl">
        {sidebar}
      </div>

      {/* mobile drawer - high z-index overlaying all bars */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-black/80 backdrop-blur-md"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex h-full max-h-[100dvh] w-72 max-w-[85vw] flex-col border-r border-white/10 bg-surface-900 shadow-2xl">
            {sidebar}
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        {/* top bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-white/8 bg-surface-950/85 px-3.5 py-2.5 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              className="rounded-xl p-2 text-white/70 transition hover:bg-white/10 active:scale-95 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="lg:hidden truncate">
              <Brand />
            </div>
            <p className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-forest-100/40 lg:block">
              Binit civic ops · <span className="text-forest-400">{user.role.toLowerCase()} workspace</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Tooltip label="Notifications">
              <NotificationBell />
            </Tooltip>

            {/* Prominent header logout button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              title="Sign out of account"
              aria-label="Sign out"
              className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/20 px-2.5 py-1.5 text-xs font-bold text-red-200 shadow-sm transition hover:bg-red-500/30 active:scale-95"
            >
              <LogOut className="size-3.5 text-red-300" />
              <span className="text-[11px] font-bold sm:text-xs">Sign out</span>
            </button>

            {/* User Avatar with interactive dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileMenuOpen((prev) => !prev);
                }}
                className="flex items-center gap-2 rounded-full bg-white/5 p-1 ring-1 ring-white/10 transition hover:bg-white/10 active:scale-95 sm:pr-3"
                aria-label="Open user profile menu"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-white uppercase shadow-glow-forest shrink-0">
                  {(user.full_name || "U").slice(0, 1)}
                </span>
                <span className="hidden text-xs font-semibold text-white sm:block">{user.full_name.split(" ")[0]}</span>
              </button>

              {/* Profile dropdown popover */}
              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-60 animate-scale-in rounded-2xl border border-white/10 bg-surface-900/98 p-4 shadow-2xl backdrop-blur-2xl">
                    <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                      <span className="flex size-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-white uppercase shadow-glow-forest shrink-0">
                        {(user.full_name || "U").slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">{user.full_name}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-forest-400">
                          {user.role.replace("_", " ")}
                        </p>
                        {user.email && (
                          <p className="truncate text-[11px] text-forest-100/50">{user.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="pt-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfileMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600/30 py-2.5 text-xs font-bold text-red-100 ring-1 ring-red-500/50 transition hover:bg-red-600/40 active:scale-95"
                      >
                        <LogOut className="size-4 text-red-300" /> Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="relative z-[1] mx-auto max-w-7xl px-3 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>

      {/* mobile bottom nav with safe area support and Account / Exit tab */}
      {!mobileOpen && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-surface-900/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1 backdrop-blur-2xl shadow-2xl lg:hidden">
          <div className="flex items-center justify-around px-2">
            {nav.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cx(
                    "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 min-h-[46px] transition-all duration-150 active:scale-95",
                    active
                      ? "text-forest-300 font-semibold"
                      : "text-forest-100/50 hover:text-forest-100",
                  )}
                >
                  <div className="relative">
                    {item.icon}
                    {active && (
                      <span className="absolute -inset-1 -z-10 rounded-full bg-forest-500/20 blur-sm" />
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-wide leading-none">{item.short}</span>
                  {active ? (
                    <span className="h-0.5 w-4 rounded-full bg-gradient-to-r from-forest-400 to-teal-400" />
                  ) : (
                    <span className="h-0.5 w-4 opacity-0" />
                  )}
                </Link>
              );
            })}

            {/* Dedicated Mobile Bottom Bar Account / Sign out tab */}
            <button
              type="button"
              onClick={() => setProfileMenuOpen(true)}
              className={cx(
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 min-h-[46px] transition-all duration-150 active:scale-95",
                profileMenuOpen
                  ? "text-red-300 font-semibold"
                  : "text-forest-100/50 hover:text-forest-100",
              )}
            >
              <div className="relative">
                <span className="flex size-5 items-center justify-center rounded-full bg-gradient-primary text-[10px] font-bold text-white uppercase shadow-glow-forest">
                  {(user.full_name || "U").slice(0, 1)}
                </span>
                {profileMenuOpen && (
                  <span className="absolute -inset-1 -z-10 rounded-full bg-red-500/20 blur-sm" />
                )}
              </div>
              <span className="text-[10px] uppercase tracking-wide leading-none">Exit</span>
              {profileMenuOpen ? (
                <span className="h-0.5 w-4 rounded-full bg-gradient-to-r from-red-400 to-rose-400" />
              ) : (
                <span className="h-0.5 w-4 opacity-0" />
              )}
            </button>
          </div>
        </nav>
      )}

      {/* Global Profile & Sign Out Bottom Sheet / Modal */}
      {profileMenuOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <div
            className="absolute inset-0 animate-fade-in bg-black/80 backdrop-blur-md"
            onClick={() => setProfileMenuOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm animate-scale-in rounded-t-3xl sm:rounded-3xl border border-white/10 bg-surface-900/98 p-5 pb-[max(env(safe-area-inset-bottom),1.75rem)] shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-gradient-primary text-base font-bold text-white uppercase shadow-glow-forest shrink-0">
                  {(user.full_name || "U").slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-white">{user.full_name}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-forest-400">
                    {user.role.replace("_", " ")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileMenuOpen(false)}
                className="rounded-xl p-2 text-white/50 hover:bg-white/10 hover:text-white"
                aria-label="Close modal"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="py-4 space-y-2 text-xs text-forest-100/60">
              <p>Signed in as <span className="font-semibold text-white">{user.email}</span></p>
              <p>Workspace: <span className="font-semibold text-forest-300">{user.role} mode</span></p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 py-3.5 text-sm font-bold text-white shadow-glow-red transition hover:brightness-110 active:scale-95"
              >
                <LogOut className="size-4" /> Sign Out of BinIt
              </button>
              <button
                type="button"
                onClick={() => setProfileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-xl bg-white/5 py-2.5 text-xs font-semibold text-forest-100/70 hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}