import { AppError } from "./errors";

// Best-effort in-memory limiter (per server instance). Use a shared store if you run several instances.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) throw new AppError("RATE_LIMITED", "Too many requests. Please wait a moment and try again.");
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [entry, times] of hits) if (now - (times.at(-1) ?? 0) > windowMs) hits.delete(entry);
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
