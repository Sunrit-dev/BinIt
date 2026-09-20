"use client";

export function AmbientEcoBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Pure Studio Dark Canvas */}
      <div className="absolute inset-0 bg-[#020704]" />

      {/* Main Hero Studio Glow (Smooth Breathing Light Pool) */}
      <div
        className="absolute inset-x-0 top-0 h-[700px] animate-studio-breath opacity-75"
        style={{
          background:
            "radial-gradient(ellipse 75% 50% at 50% 18%, rgba(34, 197, 94, 0.16) 0%, rgba(20, 184, 166, 0.06) 50%, transparent 75%)",
        }}
      />

      {/* Secondary Soft Studio Aura (Right Focal Highlight) */}
      <div
        className="absolute right-[-10%] top-[30%] h-[500px] w-[600px] rounded-full opacity-60 animate-studio-float"
        style={{
          background:
            "radial-gradient(circle at center, rgba(20, 184, 166, 0.12) 0%, rgba(34, 197, 94, 0.04) 55%, transparent 75%)",
          filter: "blur(60px)",
        }}
      />

      {/* Secondary Soft Studio Aura (Left Balanced Depth) */}
      <div
        className="absolute left-[-10%] top-[55%] h-[550px] w-[600px] rounded-full opacity-50 animate-studio-float-reverse"
        style={{
          background:
            "radial-gradient(circle at center, rgba(34, 197, 94, 0.1) 0%, rgba(5, 150, 105, 0.03) 55%, transparent 75%)",
          filter: "blur(70px)",
        }}
      />

      {/* Bottom CTA Studio Lighting */}
      <div
        className="absolute -bottom-20 left-1/2 h-[500px] w-[900px] -translate-x-1/2 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 65% 45% at 50% 100%, rgba(34, 197, 94, 0.14) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
