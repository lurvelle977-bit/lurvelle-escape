"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Sends an admin API request, then refreshes the server-rendered page so it shows the new state.
// `busy` blocks double clicks; `error` holds the server's message (never raw database errors).
export function useAdminAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const run = async (method: "POST" | "PATCH" | "DELETE", url: string, body?: unknown, successMessage = "Saved") => {
    if (busy) return false;
    setBusy(true);
    setError("");
    setDone("");
    try {
      // FormData (file uploads) gets its multipart Content-Type from the browser
      const isForm = body instanceof FormData;
      const response = await fetch(url, {
        method,
        headers: isForm ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      });
      const result = await response.json().catch(() => null);
      if (response.status === 401) {
        router.push("/admin/login");
        return false;
      }
      if (!response.ok || !result?.ok) {
        const details = result?.error?.details ? Object.values(result.error.details as Record<string, string[]>).flat().join(" ") : "";
        setError([result?.error?.message, details].filter(Boolean).join(" ") || "Request failed");
        return false;
      }
      setDone(successMessage);
      router.refresh();
      return true;
    } catch {
      setError("Could not reach the server.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { run, busy, error, done };
}
