"use client";

import { ArrowLeft, Camera, ClipboardCheck, Loader2, Shield, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AmbientEcoBackground } from "@/components/landing/AmbientEcoBackground";
import { useAuth } from "@/lib/auth";
import { homeForRole, Role } from "@/lib/types";
import { cx } from "@/lib/utils";

const ROLES: { role: Role; label: string; desc: string; demo: string; icon: React.ReactNode; accent: string; glow: string }[] = [
  {
    role: "CITIZEN",
    label: "Citizen",
    desc: "Report waste, track resolution, explore the public map.",
    demo: "priya@binit.city",
    icon: <Camera className="size-5" />,
    accent: "bg-forest-500/15 text-forest-400 ring-forest-500/30",
    glow: "hover:shadow-glow-forest hover:border-forest-500/50",
  },
  {
    role: "WORKER",
    label: "Worker",
    desc: "View assigned tasks, follow routes, mark collections done.",
    demo: "raju@binit.city",
    icon: <Truck className="size-5" />,
    accent: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
    glow: "hover:border-amber-500/50",
  },
  {
    role: "OPERATOR",
    label: "Operator",
    desc: "Triage queue, override AI, dispatch routes to crews.",
    demo: "sunita@binit.city",
    icon: <ClipboardCheck className="size-5" />,
    accent: "bg-sky-500/15 text-sky-400 ring-sky-500/30",
    glow: "hover:border-sky-500/50",
  },
  {
    role: "ADMIN",
    label: "Municipal Admin",
    desc: "Analytics, hotspot intelligence, role & audit management.",
    demo: "anand@binit.city",
    icon: <Shield className="size-5" />,
    accent: "bg-red-500/15 text-red-400 ring-red-500/30",
    glow: "hover:border-red-500/50",
  },
];

export default function SignInPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (role: Role) => {
    setBusy(role);
    setError(null);
    try {
      const user = await login(role);
      router.push(homeForRole(user.role));
    } catch (e) {
      setError((e as Error).message || "Sign in failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-transparent px-4 py-10 text-[#ecf8f1]">
      <AmbientEcoBackground />
      <div className="relative z-[1] w-full max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-forest-100/60 transition hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="size-4" /> Back to home
        </Link>

        <div className="text-center">
          <img
            src="/icons/icon-512.png"
            alt="Binit Logo"
            className="mx-auto mb-5 size-14 rounded-2xl object-contain shadow-glow-forest"
          />
          <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Enter Binit as a{" "}
            <span className="gradient-text">demo role</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-forest-100/50">
            One tap signs you straight into a realistic workspace — no password, no sign-up.
          </p>
        </div>

        {error && (
          <div className="mx-auto mt-6 max-w-md animate-fade-up rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm text-red-300 ring-1 ring-red-500/30">
            {error}
          </div>
        )}

        <div className="mt-9 grid animate-fade-up gap-3 sm:grid-cols-2" style={{ animationDelay: "80ms" }}>
          {ROLES.map((r) => (
            <button
              key={r.role}
              disabled={!!busy}
              onClick={() => handleLogin(r.role)}
              className={cx(
                "group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl glass p-5 text-left transition-all duration-300",
                "hover:-translate-y-1 hover:shadow-lift disabled:opacity-60",
                r.glow,
              )}
            >
              <div className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-forest-500/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
              <div className="flex w-full items-center justify-between">
                <span className={cx("flex size-11 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-110", r.accent)}>
                  {r.icon}
                </span>
                {busy === r.role ? (
                  <Loader2 className="size-4 animate-spin text-forest-400" />
                ) : (
                  <span className="text-xs font-semibold text-forest-400 opacity-0 transition translate-x-1 group-hover:translate-x-0 group-hover:opacity-100">
                    Enter →
                  </span>
                )}
              </div>
              <div className="relative">
                <p className="font-display text-lg font-bold text-white">{r.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-forest-100/55">{r.desc}</p>
              </div>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 font-mono text-[10px] text-forest-100/45 ring-1 ring-white/10">
                {r.demo}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-forest-100/40">
          All roles are seeded demo accounts · any persona is a one-tap entry
        </p>
      </div>
    </div>
  );
}