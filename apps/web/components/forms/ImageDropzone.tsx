"use client";

import { ImagePlus, RefreshCw, X } from "lucide-react";
import { useRef, useState } from "react";
import { cx } from "@/lib/utils";

export function ImageDropzone({
  value,
  onChange,
  label = "Drop your photo here",
  hint = "JPEG, PNG or WebP · max 10 MB",
}: {
  value: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (file: File | undefined | null) => {
    setError(null);
    if (!file) return;
    const okType = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
    if (!okType) {
      setError("Only JPEG, PNG or WebP images are accepted.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be 10 MB or smaller.");
      return;
    }
    onChange(file);
    setPreview(URL.createObjectURL(file));
  };

  return (
    <div>
      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border border-forest-500/40">
          <img src={preview} alt="preview" className="aspect-video w-full object-cover" />
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                inputRef.current?.click();
              }}
              className="rounded-lg bg-black/70 p-2 text-white transition hover:bg-black/90"
              title="Replace photo"
            >
              <RefreshCw className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setPreview(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="rounded-lg bg-black/70 p-2 text-white transition hover:bg-black/90"
              title="Remove photo"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cx(
            "flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition",
            "border-white/15 bg-white/[0.03] hover:border-forest-500/50 hover:bg-forest-500/5",
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-2xl bg-forest-500/15 text-forest-400">
            <ImagePlus className="size-6" />
          </span>
          <span className="text-sm font-medium text-forest-100/80">{label}</span>
          <span className="text-xs text-forest-100/40">{hint}</span>
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}