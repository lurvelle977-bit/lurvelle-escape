"use client";

import type { FormEvent } from "react";
import { adminButton, adminField, Panel } from "./ui";
import { useAdminAction } from "./useAdminAction";

// Edit the customer-supplied details through the existing PATCH /api/bookings/[id] (audited, re-validated on the server).
// Changing the date or headcount refreshes the vehicle availability shown next to it.
export default function BookingEditPanel(props: { reference: string; travelDate: string; pickupLocation: string; passengers: number; notes: string | null }) {
  const edit = useAdminAction();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    edit.run(
      "PATCH",
      `/api/bookings/${props.reference}`,
      {
        travelDate: String(form.get("travelDate")),
        pickupLocation: String(form.get("pickupLocation")),
        passengers: Number(form.get("passengers")),
        notes: String(form.get("notes") ?? ""),
      },
      "Booking updated",
    );
  };

  return (
    <div id="edit" className="scroll-mt-6">
      <Panel title="Edit details">
        <form className="grid gap-3" onSubmit={submit}>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="edit-date" className="mb-1 block text-[12px] text-muted">Travel date</label>
              <input id="edit-date" name="travelDate" type="date" required defaultValue={props.travelDate} className={adminField} />
            </div>
            <div>
              <label htmlFor="edit-passengers" className="mb-1 block text-[12px] text-muted">Passengers</label>
              <input id="edit-passengers" name="passengers" type="number" min={1} max={60} required defaultValue={props.passengers} className={adminField} />
            </div>
          </div>
          <div>
            <label htmlFor="edit-pickup" className="mb-1 block text-[12px] text-muted">Pickup location</label>
            <input id="edit-pickup" name="pickupLocation" required minLength={2} maxLength={300} defaultValue={props.pickupLocation} className={adminField} />
          </div>
          <div>
            <label htmlFor="edit-notes" className="mb-1 block text-[12px] text-muted">Additional notes</label>
            <textarea id="edit-notes" name="notes" rows={3} maxLength={2000} defaultValue={props.notes ?? ""} className={adminField} />
          </div>
          <p className="text-[12px] text-muted">Status changes, quotations, payments and the vehicle assignment use the panels below.</p>
          <div><button type="submit" disabled={edit.busy} className={adminButton()}>Save changes</button></div>
          {edit.error && <p role="alert" className="text-[13px] text-[#e8907f]">{edit.error}</p>}
          {edit.done && !edit.error && <p role="status" className="text-[13px] text-[#8fcf9d]">{edit.done}</p>}
        </form>
      </Panel>
    </div>
  );
}
