"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/Button";

// Accept / decline buttons for the quotation. Only the decision is sent; the amount always comes from the server.
export default function QuotationResponse({ reference, token }: { reference: string; token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"ACCEPT" | "REJECT" | null>(null);
  const [error, setError] = useState("");

  const respond = async (decision: "ACCEPT" | "REJECT") => {
    if (busy) return;
    if (decision === "REJECT" && !window.confirm("Decline this quotation? The request will be closed.")) return;
    setBusy(decision);
    setError("");
    try {
      const response = await fetch(`/api/bookings/${reference}/quotation/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, decision }),
      });
      const result = await response.json().catch(() => null);
      if (response.ok && result?.ok) {
        router.refresh();
        return;
      }
      setError(result?.error?.message ?? "Something went wrong. Please try again.");
    } catch {
      setError("We could not reach the server. Please try again.");
    }
    setBusy(null);
  };

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" disabled={busy !== null} onClick={() => respond("ACCEPT")} className={buttonClasses("gold", "px-8 py-[15px] disabled:cursor-wait disabled:opacity-60")}>
          {busy === "ACCEPT" ? "Accepting…" : "Accept quotation"}
        </button>
        <button type="button" disabled={busy !== null} onClick={() => respond("REJECT")} className={buttonClasses("light", "px-8 py-[15px] disabled:cursor-wait disabled:opacity-60")}>
          {busy === "REJECT" ? "Declining…" : "Decline"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-[13px] text-[#e8907f]">
          {error}
        </p>
      )}
    </div>
  );
}
