import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";

export function useAsyncData<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      if (mounted.current) setData(result);
    } catch (e) {
      if (mounted.current) setError((e as Error).message || "Request failed");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, deps);

  useEffect(() => {
    mounted.current = true;
    reload();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  return { data, error, loading, reload, setData };
}

export function usePolling<T>(fn: () => Promise<T>, intervalMs = 15000, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    const run = async () => {
      try {
        const result = await fn();
        if (alive) {
          setData(result);
          setError(null);
        }
      } catch (e) {
        if (alive) setError((e as Error).message || "Request failed");
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    if (intervalMs > 0) timer = setInterval(run, intervalMs);
    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, intervalMs]);

  return { data, error, loading };
}

export function useGeolocation() {
  const [coords, setCoords] = useState<{ lat: number; lon: number; accuracy?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [getting, setGetting] = useState(false);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported by this browser");
      return;
    }
    setGetting(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGetting(false);
      },
      (err) => {
        setError(err.message);
        setGetting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  return { coords, error, getting, locate };
}

export function useLiveGeolocation() {
  const [coords, setCoords] = useState<{
    lat: number;
    lon: number;
    accuracy?: number;
    heading?: number | null;
    speed?: number | null;
  } | null>(null);
  const [watching, setWatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported] = useState(() => typeof navigator !== "undefined" && "geolocation" in navigator);

  const stop = useCallback(() => setWatching(false), []);

  useEffect(() => {
    if (!watching || !supported) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
        });
        setError(null);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [watching, supported]);

  return { coords, watching, start: () => setWatching(true), stop, error, supported };
}

export function useTick(ms = 1200) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
  return tick;
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  return api<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export async function apiPatch<T = unknown>(path: string, body: unknown): Promise<T> {
  return api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  return api<T>(path, { method: "DELETE" });
}

export function useDebounced<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}