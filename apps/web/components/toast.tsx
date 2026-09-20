"use client";

import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";
import { cx } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";
type ToastDef = { id: number; title: string; message?: string; tone: ToastTone };

type ToastCtx = { toast: (t: Omit<ToastDef, "id">) => void };

const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return useContext(Ctx);
}

const ICONS: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 className="size-5 text-emerald-400" />,
  error: <TriangleAlert className="size-5 text-red-400" />,
  info: <Info className="size-5 text-sky-400" />,
};

const TONES: Record<ToastTone, string> = {
  success: "ring-emerald-500/40",
  error: "ring-red-500/40",
  info: "ring-sky-500/40",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastDef[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<ToastDef, "id">) => {
      const id = ++idRef.current;
      setItems((prev) => [...prev.slice(-3), { ...t, id }]);
      window.setTimeout(() => dismiss(id), 4600);
    },
    [dismiss],
  );

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed right-0 top-16 z-[60] flex w-full max-w-sm flex-col gap-2 p-4 sm:top-4 sm:pr-5">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cx(
              "pointer-events-auto flex animate-slide-in-right items-start gap-3 rounded-2xl glass-strong p-3.5 shadow-lift ring-1",
              TONES[t.tone],
            )}
          >
            <span className="mt-0.5">{ICONS[t.tone]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{t.title}</p>
              {t.message && <p className="mt-0.5 text-xs leading-relaxed text-forest-100/60">{t.message}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="rounded-lg p-1 text-forest-100/50 transition hover:bg-white/5 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}