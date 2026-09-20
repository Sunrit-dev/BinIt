import {
  ArrowRight,
  BarChart3,
  Building2,
  Camera,
  CheckCircle2,
  Compass,
  FileCheck,
  Globe2,
  Layers,
  MapPin,
  Recycle,
  Route,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { AmbientEcoBackground } from "@/components/landing/AmbientEcoBackground";
import { CivicCopilot } from "@/components/landing/CivicCopilot";
import { ProductInteractiveShowcase } from "@/components/landing/ProductInteractiveShowcase";

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Spot & Snap",
    desc: "A citizen spots waste, takes a photo on their phone, and lets automatic GPS lock the exact location in seconds.",
    icon: <Camera className="size-5 text-forest-400" />,
  },
  {
    step: "02",
    title: "AI Classification",
    desc: "Computer vision classifies the waste into 11 categories (e.g. plastic, organic, e-waste) and assesses drain clog severity.",
    icon: <Sparkles className="size-5 text-amber-400" />,
  },
  {
    step: "03",
    title: "Optimized Dispatch",
    desc: "The system generates the fastest collection route and dispatches it straight to local compactor trucks or e-rickshaws.",
    icon: <Route className="size-5 text-sky-400" />,
  },
  {
    step: "04",
    title: "Verified Closure",
    desc: "Crews upload proof photos of the cleared site. Supervisors verify resolution before closing the ticket.",
    icon: <ShieldCheck className="size-5 text-emerald-400" />,
  },
];

const FEATURES = [
  {
    icon: <Smartphone className="size-5 text-forest-400" />,
    title: "Citizen Mobile Reporting",
    desc: "Frictionless reporting under 2 minutes. Auto GPS capture, photo upload, and instant status notifications on any device.",
  },
  {
    icon: <Sparkles className="size-5 text-amber-400" />,
    title: "AI Category Detection",
    desc: "11 civic waste categories recognized with transparent confidence scores to prioritize dangerous or high-volume dumps.",
  },
  {
    icon: <MapPin className="size-5 text-sky-400" />,
    title: "Live Hotspot Map",
    desc: "Color-coded severity markers and density heatmaps across Kolkata urban wards and Rajarhat rural canal networks.",
  },
  {
    icon: <Truck className="size-5 text-teal-400" />,
    title: "Smart Route Planning",
    desc: "OSRM-optimized turn-by-turn routing for compactor trucks in the city and agile e-rickshaws in village alleys.",
  },
  {
    icon: <ShieldCheck className="size-5 text-emerald-400" />,
    title: "Proof-of-Cleanup Verification",
    desc: "Complete visual accountability with before-and-after photographic verification before any report is closed.",
  },
  {
    icon: <BarChart3 className="size-5 text-purple-400" />,
    title: "Municipal Intelligence",
    desc: "Ward-level Mean Time to Resolve (MTTR), recurring hotspot trends, and waste composition for better budget allocation.",
  },
];

const ZONES = [
  {
    icon: <Building2 className="size-5 text-forest-400" />,
    name: "Kolkata Urban (KMC)",
    desc: "High-density packaging waste, commercial street litter, and compactor stations across Park Street, Salt Lake, Esplanade, and Gariahat.",
    coord: "22.5726° N, 88.3639° E",
    fleet: "Hydraulic Compactor Trucks",
  },
  {
    icon: <Compass className="size-5 text-amber-400" />,
    name: "Rajarhat Gram Panchayat",
    desc: "Canal (khal) embankment dumping, village pond pollution, and peri-urban agricultural litter served by local narrow-track crews.",
    coord: "22.6105° N, 88.5122° E",
    fleet: "Electric E-Rickshaws & Winch Units",
  },
];

const ROLES = [
  {
    role: "Citizen",
    tagline: "Report & Track",
    desc: "Report waste in 2 minutes, get live status updates, and earn community civic points.",
    cta: "Try Citizen Portal",
  },
  {
    role: "Operator",
    tagline: "Triage & Dispatch",
    desc: "Manage the live queue, review AI classifications, and dispatch crews with 1 click.",
    cta: "Try Operator Portal",
  },
  {
    role: "Worker",
    tagline: "Navigate & Collect",
    desc: "Follow turn-by-turn pickup routes and upload mandatory cleanup proof photos.",
    cta: "Try Crew Portal",
  },
  {
    role: "Admin",
    tagline: "Analyze & Audit",
    desc: "View city-wide MTTR, track ward performance, and manage municipal teams.",
    cta: "Try Admin Portal",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-dvh overflow-x-clip bg-transparent text-[#ecf8f1]">
      <AmbientEcoBackground />

      {/* Navigation */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/icons/icon-512.png"
            alt="Binit Logo"
            className="size-8 sm:size-9 rounded-xl object-contain shadow-glow-forest"
          />
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-white">
            binit<span className="text-forest-400">.civic</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-forest-100/70 md:flex">
          <a href="#how-it-works" className="hover:text-white transition">
            How it works
          </a>
          <a href="#coverage" className="hover:text-white transition">
            Coverage
          </a>
          <a href="#features" className="hover:text-white transition">
            Features
          </a>
          <a href="#roles" className="hover:text-white transition">
            Demo Roles
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/signin"
            className="rounded-xl glass px-3 py-1.5 text-xs font-semibold text-forest-100 hover:bg-white/10 transition sm:px-4 sm:py-2 sm:text-sm"
          >
            Sign In
          </Link>
          <Link
            href="/signin"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-white shadow-glow-forest hover:brightness-110 active:translate-y-px transition sm:px-4 sm:py-2 sm:text-sm"
          >
            Report <span className="hidden sm:inline">Waste</span> <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero Section */}
        <section className="flex flex-col items-center pb-8 pt-6 text-center sm:pt-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-[11px] font-semibold text-forest-300 sm:mb-5 sm:px-4 sm:text-xs">
            <Sparkles className="size-3.5 text-amber-400 shrink-0" />
            <span className="truncate">AI-Powered Civic Waste Platform · Kolkata & Rajarhat</span>
          </div>

          <h1 className="max-w-4xl font-display text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-6xl md:text-7xl">
            Spot it. Snap it.
            <br />
            <span className="gradient-text text-glow">Solve it.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-forest-100/70 sm:mt-6 sm:text-lg">
            Binit transforms everyday citizen photos into instant municipal action — classifying waste
            types, assessing severity, and dispatching collection crews from Kolkata&apos;s busy streets to
            Rajarhat&apos;s village canal banks.
          </p>

          <div className="mt-6 flex w-full max-w-md flex-col items-stretch justify-center gap-2.5 sm:mt-8 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:gap-3">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 text-sm font-bold text-white shadow-glow-forest hover:brightness-110 active:translate-y-px transition sm:px-7 sm:py-3.5 sm:text-base"
            >
              Report Waste Now <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center justify-center gap-2 rounded-xl glass px-6 py-3 text-sm font-semibold text-forest-100 hover:bg-white/10 transition sm:px-7 sm:py-3.5 sm:text-base"
            >
              Explore Live Demo
            </Link>
          </div>

          {/* Interactive Live Product Preview */}
          <ProductInteractiveShowcase />

          {/* Key Metrics Strip */}
          <div className="mt-4 grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: "11", v: "Waste Categories", icon: <Recycle className="size-4 text-forest-400" /> },
              { k: "< 2 min", v: "Citizen Report Time", icon: <Zap className="size-4 text-amber-400" /> },
              { k: "2 Zones", v: "Urban & Gram Panchayat", icon: <MapPin className="size-4 text-sky-400" /> },
              { k: "100%", v: "Proof-Verified Closure", icon: <ShieldCheck className="size-4 text-emerald-400" /> },
            ].map((s) => (
              <div key={s.k} className="glass rounded-2xl p-4 text-left">
                <div className="mb-1">{s.icon}</div>
                <p className="font-display text-2xl font-bold text-white">{s.k}</p>
                <p className="text-xs text-forest-100/60">{s.v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-400">
              Simple 4-Step Process
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              How Binit closes the loop
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_STEPS.map((w) => (
              <div key={w.step} className="glass rounded-2xl p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-forest-500/15">
                    {w.icon}
                  </div>
                  <span className="font-display text-xl font-bold text-white/20">{w.step}</span>
                </div>
                <h3 className="font-display text-lg font-bold text-white">{w.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-forest-100/60">{w.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Coverage: Dual Zones */}
        <section id="coverage" className="py-12">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-400">
              Dual Zone Coverage
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              From city centres to village waterways
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {ZONES.map((z) => (
              <div key={z.name} className="glass rounded-3xl p-7 relative overflow-hidden">
                <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-forest-500/15 text-forest-400">
                  {z.icon}
                </div>
                <h3 className="font-display text-xl font-bold text-white">{z.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-forest-100/70">{z.desc}</p>

                <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-white/10 text-xs">
                  <span className="flex items-center gap-1.5 text-forest-300">
                    <MapPin className="size-3.5" /> {z.coord}
                  </span>
                  <span className="flex items-center gap-1.5 text-forest-100/60">
                    <Truck className="size-3.5 text-amber-400" /> Fleet: {z.fleet}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Capabilities Grid */}
        <section id="features" className="py-16">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-400">Capabilities</p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything a clean city needs
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass rounded-2xl p-6 transition hover:border-forest-500/30">
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-forest-500/15">
                  {f.icon}
                </div>
                <h3 className="font-display text-base font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-forest-100/60">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Demo Roles Section */}
        <section id="roles" className="py-16">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-400">Live Demo</p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Experience all 4 stakeholder roles
            </h2>
            <p className="mt-2 text-sm text-forest-100/60">
              No registration required. Select any role to test the entire loop.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r) => (
              <div key={r.role} className="glass rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-forest-400">
                    {r.tagline}
                  </span>
                  <h3 className="font-display text-lg font-bold text-white mt-1">{r.role}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-forest-100/60">{r.desc}</p>
                </div>
                <Link
                  href="/signin"
                  className="mt-6 flex items-center justify-center gap-1.5 rounded-xl bg-white/5 py-2.5 text-xs font-semibold text-forest-200 hover:bg-forest-500 hover:text-white transition"
                >
                  {r.cta} <ArrowRight className="size-3" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-14">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a2216] via-[#091b12] to-[#040e08] p-8 text-center ring-1 ring-forest-500/25 sm:p-14">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              A cleaner city starts with one photo.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-forest-100/70 sm:text-base">
              Join citizens and municipal crews in Kolkata and Rajarhat GP to report, clean, and verify waste.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-7 py-3.5 font-bold text-white shadow-glow-forest hover:brightness-110 transition"
              >
                Launch Live Demo <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/8 py-8 text-center text-xs text-forest-100/50">
        <p>
          Binit · <span className="text-forest-300 font-semibold">Civic Waste Intelligence for Kolkata & Rajarhat GP</span>
        </p>
      </footer>

      {/* Floating Civic Copilot Assistant */}
      <CivicCopilot />
    </div>
  );
}