"use client";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck,
  Layers,
  MapPin,
  Recycle,
  Route,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Truck,
  UploadCloud,
  UserCheck,
  Zap,
} from "lucide-react";
import { useState } from "react";

export function ProductInteractiveShowcase() {
  const [activeTab, setActiveTab] = useState<"citizen" | "operator" | "worker" | "analytics">(
    "citizen",
  );
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [crewDispatched, setCrewDispatched] = useState(false);
  const [taskResolved, setTaskResolved] = useState(false);

  return (
    <div className="mx-auto my-8 w-full max-w-5xl sm:my-12">
      {/* Interactive Tabs Bar with horizontal scroll on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-1 pb-4 sm:flex-wrap sm:justify-center">
        {[
          { id: "citizen", label: "1. Citizen Report", icon: <Camera className="size-4 shrink-0" /> },
          { id: "operator", label: "2. Operator Triage", icon: <Layers className="size-4 shrink-0" /> },
          { id: "worker", label: "3. Fleet Collection", icon: <Truck className="size-4 shrink-0" /> },
          { id: "analytics", label: "4. City Analytics", icon: <BarChart3 className="size-4 shrink-0" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold sm:px-4 sm:py-2.5 sm:text-sm transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-forest-500 text-white shadow-glow-forest"
                  : "glass text-forest-100/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Showcase Window */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#081811]/90 p-4 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-8">
        {/* ===================== TAB 1: CITIZEN REPORT FLOW ===================== */}
        {activeTab === "citizen" && (
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-500/15 px-3 py-1 text-xs font-semibold text-forest-300 ring-1 ring-forest-500/30">
                <Sparkles className="size-3.5 text-amber-400" />
                Citizen Experience
              </span>
              <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Snap, pinpoint, and submit in under 2 minutes.
              </h3>
              <p className="text-sm leading-relaxed text-forest-100/70">
                Citizens simply take a photo on their phone. Binit auto-detects the GPS location, runs
                computer vision to identify the waste type, and sends real-time status updates as the crew resolves it.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2 text-xs text-forest-100/80">
                  <CheckCircle2 className="size-4 text-forest-400" />
                  <span>Automatic GPS location & address reverse-geocoding</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-forest-100/80">
                  <CheckCircle2 className="size-4 text-forest-400" />
                  <span>Instant AI category suggestion (e.g., Plastic, Organic, E-Waste)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-forest-100/80">
                  <CheckCircle2 className="size-4 text-forest-400" />
                  <span>SMS / Push notification when cleanup is completed</span>
                </div>
              </div>
            </div>

            {/* Interactive Phone Mockup */}
            <div className="flex justify-center lg:col-span-7">
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#030e08] p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="size-4 text-forest-400" />
                    <span className="text-xs font-bold text-white">New Waste Report</span>
                  </div>
                  <span className="rounded-full bg-forest-500/20 px-2 py-0.5 text-[10px] font-semibold text-forest-300">
                    GPS Active
                  </span>
                </div>

                {reportSubmitted ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
                    <CheckCircle2 className="mx-auto size-10 text-emerald-400" />
                    <h4 className="mt-3 font-display text-lg font-bold text-white">Report Submitted!</h4>
                    <p className="mt-1 text-xs text-emerald-200/80">
                      Report ID: <span className="font-mono font-bold">#REP-8492</span> · Assigned to Ward 63 Fleet
                    </p>
                    <button
                      onClick={() => setReportSubmitted(false)}
                      className="mt-4 rounded-lg bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
                    >
                      Reset Demo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* Simulated Camera Upload Card */}
                    <div className="relative overflow-hidden rounded-xl border border-dashed border-forest-500/40 bg-forest-500/5 p-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Camera className="size-6 text-forest-400" />
                        <p className="text-xs font-semibold text-white">waste_photo_parkst.jpg</p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-forest-500/20 px-2.5 py-0.5 text-[10px] font-bold text-forest-300">
                          AI Tag: Plastic & Packaging (96% confidence)
                        </span>
                      </div>
                    </div>

                    {/* Location preview */}
                    <div className="rounded-xl bg-white/[0.03] p-3 text-xs">
                      <div className="flex items-center gap-2 text-forest-300">
                        <MapPin className="size-3.5" />
                        <span className="font-semibold text-white">Park Street & Camac St Jn, Ward 63</span>
                      </div>
                      <p className="mt-1 text-[11px] text-forest-100/50">Kolkata Urban (KMC) · 22.5512° N, 88.3524° E</p>
                    </div>

                    {/* Severity Badge */}
                    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3 text-xs">
                      <span className="text-forest-100/60">Estimated Severity:</span>
                      <span className="rounded-md bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 ring-1 ring-amber-500/30">
                        HIGH · Drain Block Risk
                      </span>
                    </div>

                    <button
                      onClick={() => setReportSubmitted(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-sm font-bold text-white shadow-glow-forest hover:brightness-110"
                    >
                      Submit Report Now <ArrowRight className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: OPERATOR TRIAGE FLOW ===================== */}
        {activeTab === "operator" && (
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300 ring-1 ring-sky-500/30">
                <Layers className="size-3.5 text-sky-400" />
                Operator Nerve Center
              </span>
              <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Prioritize hotspots and dispatch crews instantly.
              </h3>
              <p className="text-sm leading-relaxed text-forest-100/70">
                Municipal operators monitor incoming reports on a live map, review AI classifications,
                and dispatch optimized collection routes to available compactors or e-rickshaws.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2 text-xs text-forest-100/80">
                  <CheckCircle2 className="size-4 text-sky-400" />
                  <span>Real-time color-coded severity clustering</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-forest-100/80">
                  <CheckCircle2 className="size-4 text-sky-400" />
                  <span>1-Click smart dispatch to nearest active crew</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-forest-100/80">
                  <CheckCircle2 className="size-4 text-sky-400" />
                  <span>Queue filtering by ward, severity, and waste category</span>
                </div>
              </div>
            </div>

            {/* Simulated Operator Dashboard */}
            <div className="flex justify-center lg:col-span-7">
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#030e08] p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-bold text-white">Live Triage Queue (3 Pending)</span>
                  <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
                    KMC & GP Map Active
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Item 1 */}
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300">
                        CRITICAL
                      </span>
                      <span className="text-[10px] text-forest-100/50">3 mins ago</span>
                    </div>
                    <p className="mt-1.5 font-display text-sm font-bold text-white">
                      Rajarhat Canal Embankment Breach
                    </p>
                    <p className="text-[11px] text-forest-100/60">
                      Agrochem plastics & biomass blocking water flow
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-sky-300">
                        Suggested: E-Rickshaw Unit #04
                      </span>
                      <button
                        onClick={() => setCrewDispatched(!crewDispatched)}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                          crewDispatched
                            ? "bg-emerald-500 text-white"
                            : "bg-sky-500 text-white hover:bg-sky-400"
                        }`}
                      >
                        {crewDispatched ? "✓ Dispatched" : "Dispatch Crew"}
                      </button>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs opacity-75">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        HIGH
                      </span>
                      <span className="text-[10px] text-forest-100/50">12 mins ago</span>
                    </div>
                    <p className="mt-1 font-semibold text-white">Park Street Commercial Litter</p>
                    <p className="text-[10px] text-forest-100/50">Assigned to Compactor #07</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: WORKER FIELD TASK ===================== */}
        {activeTab === "worker" && (
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/30">
                <Truck className="size-3.5 text-amber-400" />
                Field Collection Crews
              </span>
              <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Turn-by-turn routes with verified proof of cleanup.
              </h3>
              <p className="text-sm leading-relaxed text-forest-100/70">
                Collection crews receive optimized pickup waypoints directly on mobile. Before closing
                a job, they snap a proof photo showing the cleared site for supervisor verification.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2 text-xs text-forest-100/80">
                  <CheckCircle2 className="size-4 text-amber-400" />
                  <span>Turn-by-turn routing via OSRM map engine</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-forest-100/80">
                  <CheckCircle2 className="size-4 text-amber-400" />
                  <span>1-Tap status updates (En Route → Arrived → Cleared)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-forest-100/80">
                  <CheckCircle2 className="size-4 text-amber-400" />
                  <span>Mandatory cleanup proof photo submission</span>
                </div>
              </div>
            </div>

            {/* Simulated Crew Mobile Screen */}
            <div className="flex justify-center lg:col-span-7">
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#030e08] p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-bold text-white">Active Pickup #TASK-401</span>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                    Compactor #07
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div className="rounded-xl bg-white/[0.03] p-3 text-xs">
                    <p className="text-[11px] text-forest-100/50">Destination:</p>
                    <p className="font-semibold text-white">Gariahat Market South Entrance</p>
                    <p className="mt-1 text-[11px] text-forest-400">Est. Distance: 1.2 km (4 mins)</p>
                  </div>

                  {taskResolved ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                      <ShieldCheck className="mx-auto size-8 text-emerald-400" />
                      <p className="mt-2 text-xs font-bold text-white">Proof Photo Uploaded & Verified!</p>
                      <p className="text-[11px] text-emerald-200/70">Task marked as RESOLVED</p>
                      <button
                        onClick={() => setTaskResolved(false)}
                        className="mt-3 rounded-lg bg-white/10 px-3 py-1 text-xs text-white"
                      >
                        Reset Task
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-4 text-center">
                        <UploadCloud className="mx-auto size-6 text-forest-400" />
                        <p className="mt-1 text-xs font-semibold text-white">Upload Clean Site Photo</p>
                        <p className="text-[10px] text-forest-100/50">Required for closure</p>
                      </div>

                      <button
                        onClick={() => setTaskResolved(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-black hover:bg-amber-400"
                      >
                        Complete & Submit Proof <ArrowRight className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: CIVIC ANALYTICS ===================== */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-300 ring-1 ring-purple-500/30">
                <BarChart3 className="size-3.5 text-purple-400" />
                Municipal Intelligence
              </span>
              <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Ward-level trends to make data-driven civic decisions.
              </h3>
              <p className="text-sm leading-relaxed text-forest-100/70">
                City administrators track Mean Time to Resolve (MTTR), recurring illegal dumping hotspots,
                and waste composition shifts to optimize budget and crew allocations.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2 text-xs text-forest-100/80">
                  <CheckCircle2 className="size-4 text-purple-400" />
                  <span>Ward & Gram Panchayat MTTR benchmarks</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-forest-100/80">
                  <CheckCircle2 className="size-4 text-purple-400" />
                  <span>Waste composition breakdown (Plastic vs Organic vs E-Waste)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-forest-100/80">
                  <CheckCircle2 className="size-4 text-purple-400" />
                  <span>Exportable compliance reports for municipal boards</span>
                </div>
              </div>
            </div>

            {/* Simulated Analytics Cards */}
            <div className="flex justify-center lg:col-span-7">
              <div className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-[#030e08] p-5 shadow-xl">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white/[0.04] p-3 text-center">
                    <p className="font-display text-xl font-bold text-white">2.4h</p>
                    <p className="text-[10px] text-forest-100/50">Avg MTTR</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-3 text-center">
                    <p className="font-display text-xl font-bold text-emerald-400">98.4%</p>
                    <p className="text-[10px] text-forest-100/50">Resolved</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-3 text-center">
                    <p className="font-display text-xl font-bold text-white">1,420</p>
                    <p className="text-[10px] text-forest-100/50">Reports</p>
                  </div>
                </div>

                {/* Composition Bars */}
                <div className="space-y-2.5 rounded-xl bg-white/[0.03] p-3.5">
                  <p className="text-xs font-bold text-white">Waste Composition (This Month)</p>
                  <div>
                    <div className="flex justify-between text-[11px] text-forest-100/70">
                      <span>Plastic & Packaging</span>
                      <span className="font-bold text-white">44%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-forest-400" style={{ width: "44%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-forest-100/70">
                      <span>Organic & Biomass</span>
                      <span className="font-bold text-white">32%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-teal-400" style={{ width: "32%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-forest-100/70">
                      <span>E-Waste & Hazardous</span>
                      <span className="font-bold text-white">14%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-purple-400" style={{ width: "14%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
