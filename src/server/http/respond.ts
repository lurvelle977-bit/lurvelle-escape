import { ZodError } from "zod";
import { AppError } from "./errors";

// Every API response is { ok: true, data } or { ok: false, error: { code, message, details? } }

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ ok: true, data }, { status, headers: { "Cache-Control": "no-store" } });
}

export function fail(error: unknown): Response {
  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "_";
      (details[key] ??= []).push(issue.message);
    }
    return failure(400, "VALIDATION_FAILED", "Please check the highlighted fields.", details);
  }
  if (error instanceof AppError) return failure(error.status, error.code, error.message, error.details);
  // Never leak database or stack details to the client
  console.error("[api] unexpected error", error);
  return failure(500, "INTERNAL", "Something went wrong. Please try again.");
}

function failure(status: number, code: string, message: string, details?: Record<string, string[]>): Response {
  return Response.json({ ok: false, error: { code, message, details } }, { status, headers: { "Cache-Control": "no-store" } });
}

// Wraps a route handler so thrown errors become consistent JSON responses
export function handle<Args extends unknown[]>(fn: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      return fail(error);
    }
  };
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError("VALIDATION_FAILED", "Request body must be valid JSON.");
  }
}
