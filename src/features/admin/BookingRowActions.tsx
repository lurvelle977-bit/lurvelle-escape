"use client";

import Link from "next/link";
import { useState } from "react";
import { ACTIVE_STATUSES } from "@/server/domain/status";
import AssignVehicleDrawer from "./AssignVehicleDrawer";
import Dialog from "./Dialog";
import { adminButton } from "./ui";
import { useAdminAction } from "./useAdminAction";

const linkClass = "cursor-pointer text-[12px] font-semibold text-gold hover:text-gold-light disabled:cursor-not-allowed disabled:text-muted disabled:opacity-60";

// Compact Edit / Assign / Delete controls for one row of the bookings table
export default function BookingRowActions({ reference, customerName, status }: { reference: string; customerName: string; status: string }) {
  const [panel, setPanel] = useState<"assign" | "delete" | null>(null);
  const remove = useAdminAction();
  const canAssign = status !== "PENDING" && (ACTIVE_STATUSES as readonly string[]).includes(status);
  const close = () => setPanel(null);

  return (
    <>
      <div className="flex items-center gap-3 whitespace-nowrap">
        <Link href={`/admin/bookings/${reference}#edit`} className={linkClass}>Review</Link>
        <button type="button" disabled={!canAssign} title={canAssign ? undefined : "Start the review of an open booking before assigning a vehicle"} onClick={() => setPanel("assign")} className={linkClass}>
          Assign
        </button>
        <button type="button" onClick={() => setPanel("delete")} className="cursor-pointer text-[12px] font-semibold text-[#e8907f] hover:underline">Delete</button>
      </div>

      {panel === "assign" && <AssignVehicleDrawer reference={reference} onClose={close} />}

      {panel === "delete" && (
        <Dialog title="Delete booking" onClose={close}>
          <p className="text-[14px] text-cream">
            Delete booking <strong className="text-gold">{reference}</strong> for <strong>{customerName}</strong>?
          </p>
          <p className="mt-2 text-[13px] text-sand">It will be removed from the booking list. Its history, quotations and payments are kept on record.</p>
          {remove.error && <p role="alert" className="mt-3 text-[13px] text-[#e8907f]">{remove.error}</p>}
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              disabled={remove.busy}
              onClick={async () => {
                if (await remove.run("DELETE", `/api/bookings/${reference}`, undefined, "Booking deleted")) close();
              }}
              className={adminButton("danger")}
            >
              {remove.busy ? "Deleting…" : "Delete booking"}
            </button>
            <button type="button" disabled={remove.busy} onClick={close} className={adminButton("plain")}>Cancel</button>
          </div>
        </Dialog>
      )}
    </>
  );
}
