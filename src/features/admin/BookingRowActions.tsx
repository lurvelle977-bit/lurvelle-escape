"use client";

import Link from "next/link";
import { useState } from "react";
import Dialog from "./Dialog";
import { adminButton } from "./ui";
import { useAdminAction } from "./useAdminAction";

const linkClass = "cursor-pointer text-[12px] font-semibold text-gold hover:text-gold-light disabled:cursor-not-allowed disabled:text-muted disabled:opacity-60";

// Compact Edit / Assign / Delete controls for one row of the bookings table
export default function BookingRowActions({ reference, customerName }: { reference: string; customerName: string }) {
  const [panel, setPanel] = useState<"delete" | null>(null);
  const remove = useAdminAction();
  const close = () => setPanel(null);

  return (
    <>
      <div className="flex items-center gap-3 whitespace-nowrap">
        <Link href={`/admin/bookings/${reference}`} className={linkClass}>Review</Link>
        <button type="button" onClick={() => setPanel("delete")} className="cursor-pointer text-[12px] font-semibold text-[#e8907f] hover:underline">Delete</button>
      </div>

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
