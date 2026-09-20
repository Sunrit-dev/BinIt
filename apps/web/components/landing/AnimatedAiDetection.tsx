"use client";

import { Brain, Camera, Cpu, MapPin, Radar, ScanLine, ShieldCheck, Trash2, Zap } from "lucide-react";

const DETECTIONS = [
  { id: "a1", label: "Plastic film", type: "PLASTIC", color: "#F59E0B", x: "74%", y: "30%", score: 96 },
  { id: "a2", label: "E-waste", type: "ELECTRONIC", color: "#22C55E", x: "60%", y: "56%", score: 91 },
  { id: "a3", label: "Organic pile", type: "ORGANIC", color: "#14B8A6", x: "42%", y: "72%", score: 88 },
  { id: "a4", label: "C&D debris", type: "CONSTRUCTION", color: "#EAB308", x: "26%", y: "44%", score: 93 },
  { id: "a5", label: "Mixed waste", type: "MIXED", color: "#EF4444", x: "84%", y: "62%", score: 90 },
] as const;

const ZONE_RINGS = [
  { label: "CRITICAL zone", color: "#7F1D1D", dash: "22 6" },
  { label: "HIGH zone", color: "#EF4444", dash: "14 5" },
  { label: "MEDIUM zone", color: "#F59E0B", dash: "8 4" },
] as const;

export function AnimatedAiDetection() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a1c16] p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
      {/* header row */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-4">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-forest-400 opacity-60" />
            <span className="relative inline-flex size-4 rounded-full border-2 border-forest-300 bg-forest-500" />
          </span>
          <div>
            <p className="font-display text-sm font-bold text-white">AI live detection</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-forest-100/45">BinIt Vision · on-device</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-forest-100/80 ring-1 ring-white/10">
          <Zap className="size-3 text-amber-400" /> detecting in real time
        </span>
      </div>

      {/* radar stage */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/8 bg-[#06150f]">
        {/* grid */}
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(42,157,113,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(42,157,113,.12)_1px,transparent_1px)] [background-size:38px_38px]" />

        {/* radar sweep */}
        <div className="b-radar absolute left-1/2 top-1/2 size-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-forest-500/25">
          <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,rgba(34,197,94,0.45),transparent_70deg)]" />
          <div className="absolute inset-[12%] rounded-full border border-forest-500/15" />
          <div className="absolute inset-[30%] rounded-full border border-forest-500/10" />
          <div className="absolute inset-[46%] rounded-full border border-forest-500/10" />
          <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-forest-400/40 to-transparent" />
        </div>

        {/* risk zones */}
        {ZONE_RINGS.map((z, i) => (
          <div
            key={z.label}
            className="b-drift absolute left-[14%] top-[18%] size-[30%]"
            style={{ ["--tilt" as string]: i % 2 ? "2deg" : "-3deg" }}
          >
            <div className="size-full rounded-full border-2" style={{ borderColor: z.color, opacity: 0.85 }} />
            <div className="absolute inset-[10%] rounded-full border border-dashed" style={{ borderColor: z.color, opacity: 0.5 }} />
            <span className="absolute -top-2.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold text-white" style={{ background: z.color, left: "30%", opacity: 0.65 }}>
              {z.label}
            </span>
          </div>
        ))}

        {/* detected markers */}
        {DETECTIONS.map((d, i) => (
          <div key={d.id} className="absolute" style={{ left: d.x, top: d.y }}>
            <span className="b-blip relative flex size-3 rounded-full" style={{ background: d.color, boxShadow: `0 0 12px ${d.color}` }} />
            <div
              className="mark-stagger absolute bottom-full left-1/2 -translate-x-1/2 translate-y-[-6px] whitespace-nowrap rounded-lg bg-[#0d2119] px-2 py-1 text-center ring-1 ring-white/10"
              style={{ animationDelay: `${250 + i * 90}ms` }}
            >
              <p className="text-[10px] font-bold text-white">{d.label}</p>
              <p className="text-[9px] text-forest-100/50">{d.type} · {d.score}%</p>
            </div>
          </div>
        ))}

        {/* scanline */}
        <div className="b-scan absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-70" />

        {/* corner HUD */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/40 px-2 py-1 text-[9px] font-bold text-forest-100/70 ring-1 ring-white/10 backdrop-blur">
          <Camera className="size-3 text-forest-400" /> CAM 07 · Kolkata Urban
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/40 px-2 py-1 text-[9px] font-bold text-forest-100/70 ring-1 ring-white/10 backdrop-blur">
          <Cpu className="size-3 text-forest-400" /> v2.4 model
        </div>
      </div>

      {/* scroll feed */}
      <div className="mt-3 space-y-1.5">
        {[
          { icon: <ScanLine className="size-3 text-sky-400" />, text: "Now scanning frame from camera 07…", ms: 0 },
          { icon: <Brain className="size-3 text-emerald-400" />, text: "AI identified Plastic film · 96% confidence", ms: 120 },
          { icon: <Trash2 className="size-3 text-amber-400" />, text: "Auto-routed to Collector squad · Park St", ms: 240 },
          { icon: <ShieldCheck className="size-3 text-forest-300" />, text: "Risk zone CRITICAL marked — priority pickup", ms: 360 },
        ].map((f, i) => (
          <div
            key={f.text}
            className="flex animate-fade-up items-center gap-2 text-[11px] text-forest-100/70"
            style={{ animationDelay: `${400 + i * 260}ms` }}
          >
            {f.icon} <span>{f.text}</span>
          </div>
        ))}
      </div>

      {/* legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/8 pt-3">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-forest-100/50">
          <MapPin className="size-3" /> Risk zones
        </span>
        {ZONE_RINGS.map((z) => (
          <span key={z.label} className="flex items-center gap-1.5 text-[10px] font-medium text-forest-100/70">
            <span className="size-2.5 rounded-full border-2" style={{ borderColor: z.color }} />
            {z.label.replace(" zone", "")}
          </span>
        ))}
        <span className="mx-1 h-3 w-px bg-white/10" />
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-forest-100/50">
          <Radar className="size-3" /> Live sweep
        </span>
      </div>
    </div>
  );
}
