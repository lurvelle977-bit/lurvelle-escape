"use client";

import { MANUAL_TRANSITIONS, type BookingStatus } from "@/server/domain/status";
import { adminField } from "./ui";
import { useAdminAction } from "./useAdminAction";

const label = (status: string) => status.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

const CONFIRM: Partial<Record<BookingStatus, string>> = {
  CANCELLED: "Cancel this booking? The customer will be notified and this cannot be undone.",
  COMPLETED: "Mark this booking as completed? This cannot be undone.",
};

// Per-row status control for the bookings list. It only offers moves the server allows (MANUAL_TRANSITIONS);
// the server re-checks everything, so this is a convenience, not the security boundary.
// Steps that carry data (quotation, payment, confirmation) stay on the booking page.
export default function BookingStatusSelect({ reference, status }: { reference: string; status: BookingStatus }) {
  const action = useAdminAction();
  const targets = MANUAL_TRANSITIONS[status];

  if (targets.length === 0) return <p className="mt-2 text-[11.5px] text-muted">Closed</p>;

  return (
    <div className="mt-2 min-w-[150px]">
      <label className="sr-only" htmlFor={`status-${reference}`}>Change status of {reference}</label>
      <select
        id={`status-${reference}`}
        value={status}
        disabled={action.busy}
        aria-busy={action.busy}
        className={`${adminField} py-1.5 text-[12.5px] disabled:cursor-wait disabled:opacity-60`}
        onChange={(event) => {
          const next = event.target.value as BookingStatus;
          const message = CONFIRM[next];
          if (next === status || (message && !window.confirm(message))) return;
          action.run("PATCH", `/api/bookings/${reference}/status`, { status: next }, `Changed to ${label(next)}`);
        }}
      >
        <option value={status}>{action.busy ? "Updating…" : "Change status…"}</option>
        {targets.map((target) => <option key={target} value={target}>{label(target)}</option>)}
      </select>
      <p aria-live="polite" className="mt-1 min-h-[1em] text-[11.5px]">
        {action.error ? <span role="alert" className="text-[#e8907f]">{action.error}</span> : action.done ? <span className="text-[#8fcf9d]">{action.done}</span> : null}
      </p>
    </div>
  );
}
