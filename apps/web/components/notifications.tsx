"use client";

import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Notification } from "@/lib/types";
import { cx, timeAgo, severityColor } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const data = await api<{ items: Notification[]; unread: number }>("/notifications");
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const markAll = async () => {
    await Promise.all(items.filter((n) => !n.is_read).map((n) => api(`/notifications/${n.id}/read`, { method: "POST" }).catch(() => null)));
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const typeColors: Record<string, string> = {
    ALERT: "bg-red-500/10 text-red-400",
    TASK: "bg-amber-500/10 text-amber-400",
    STATUS_CHANGE: "bg-forest-500/10 text-forest-400",
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl bg-white/5 p-2 ring-1 ring-white/10 transition hover:bg-white/10"
      >
        <Bell className="size-4 text-forest-100" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(340px,calc(100vw-1.5rem))] animate-scale-in overflow-hidden rounded-2xl glass-strong shadow-lift">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <p className="font-display text-sm font-bold text-white">Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="flex items-center gap-1 text-xs text-forest-400 hover:text-forest-300">
                <CheckCheck className="size-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && <p className="px-4 py-8 text-center text-sm text-forest-100/40">No notifications yet</p>}
            {items.slice(0, 20).map((n) => (
              <div key={n.id} className={cx("flex gap-3 border-b border-white/5 px-4 py-3", !n.is_read && "bg-white/[0.03]")}>
                <span className={cx("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg", typeColors[n.type] || typeColors.STATUS_CHANGE)}>
                  <Bell className="size-3" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{n.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-forest-100/60">{n.message}</p>
                  <p className="mt-1 text-[10px] text-forest-100/40">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}