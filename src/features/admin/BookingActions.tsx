"use client";

import { useState, type FormEvent } from "react";
import { tours } from "@/content/tours";
import { adminButton, adminField, Panel } from "./ui";
import { useAdminAction } from "./useAdminAction";

type Resource = { id: string; name: string; label: string };

export type ActionProps = {
  reference: string;
  status: string;
  paymentStatus: string;
  travelDate: string;
  vehicleId: string | null;
  driverId: string | null;
  currency: string;
  expectedAmount: number | null;
  vehicles: Resource[];
  drivers: Resource[];
};

function Feedback({ error, done }: { error: string; done: string }) {
  return (
    <>
      {error && <p role="alert" className="mt-3 text-[13px] text-[#e8907f]">{error}</p>}
      {done && !error && <p role="status" className="mt-3 text-[13px] text-[#8fcf9d]">{done}</p>}
    </>
  );
}

const number = (form: FormData, key: string) => Number(form.get(key));
const text = (form: FormData, key: string) => String(form.get(key) ?? "");

// All lifecycle actions for one booking. Which panels appear depends on the status, but the server enforces the rules too.
export default function BookingActions(props: ActionProps) {
  const { reference, status } = props;
  const api = `/api/bookings/${reference}`;
  const review = useAdminAction();
  const assign = useAdminAction();
  const alternative = useAdminAction();
  const quote = useAdminAction();
  const instructions = useAdminAction();
  const received = useAdminAction();
  const confirm = useAdminAction();
  const close = useAdminAction();
  const [vehicleId, setVehicleId] = useState(props.vehicleId ?? "");
  const [driverId, setDriverId] = useState(props.driverId ?? "");

  const open = !["CANCELLED", "COMPLETED"].includes(status);
  const canAssign = ["UNDER_REVIEW", "ALTERNATIVE_PROPOSED", "QUOTED", "QUOTE_ACCEPTED", "PAYMENT_PENDING", "PAYMENT_RECEIVED"].includes(status);
  const canQuote = ["UNDER_REVIEW", "ALTERNATIVE_PROPOSED", "QUOTED"].includes(status);

  const submitQuote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    quote.run("POST", `${api}/quotation`, {
      amount: number(form, "amount"),
      additionalCharges: number(form, "additionalCharges") || 0,
      currency: text(form, "currency") || "EUR",
      includedServices: text(form, "includedServices"),
      notes: text(form, "notes"),
      validDays: number(form, "validDays") || 7,
    }, "Quotation sent to the customer");
  };

  return (
    <div className="grid gap-5">
      {status === "PENDING" && (
        <Panel title="Review">
          <p className="mb-3 text-[13px] text-sand">New request. Start the review to check availability and prepare a quotation.</p>
          <button type="button" disabled={review.busy} className={adminButton()} onClick={() => review.run("PATCH", `${api}/status`, { status: "UNDER_REVIEW" }, "Review started")}>
            Start review
          </button>
          <Feedback {...review} />
        </Panel>
      )}

      {canAssign && (
        <Panel title="Vehicle & driver">
          <p className="mb-3 text-[13px] text-sand">Only vehicles with enough seats and drivers that are free on {props.travelDate} are listed.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="vehicle" className="sr-only">Vehicle</label>
              <select id="vehicle" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} className={adminField}>
                <option value="">No vehicle</option>
                {props.vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="driver" className="sr-only">Driver</label>
              <select id="driver" value={driverId} onChange={(event) => setDriverId(event.target.value)} className={adminField}>
                <option value="">No driver</option>
                {props.drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.label}</option>)}
              </select>
            </div>
          </div>
          {props.vehicles.length === 0 && <p className="mt-3 text-[12px] text-muted">No vehicle is available for this date. Add vehicles under Vehicles &amp; drivers, or suggest an alternative.</p>}
          <button type="button" disabled={assign.busy} className={`${adminButton()} mt-4`} onClick={() => assign.run("POST", `${api}/assignment`, { vehicleId: vehicleId || null, driverId: driverId || null }, "Assignment saved")}>
            Save assignment
          </button>
          <Feedback {...assign} />
        </Panel>
      )}

      {status === "UNDER_REVIEW" && (
        <Panel title="Suggest an alternative">
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              alternative.run("POST", `${api}/alternative`, {
                message: text(form, "message"),
                proposedTravelDate: text(form, "proposedTravelDate") || undefined,
                proposedDestination: text(form, "proposedDestination") || undefined,
              }, "Alternative sent to the customer");
            }}
          >
            <textarea name="message" required rows={3} minLength={5} placeholder="Message to the customer" className={adminField} />
            <div className="grid gap-3 md:grid-cols-2">
              <input name="proposedTravelDate" type="date" className={adminField} aria-label="Proposed date" />
              <select name="proposedDestination" className={adminField} aria-label="Proposed destination" defaultValue="">
                <option value="">Same destination</option>
                {tours.map((tour) => <option key={tour.id} value={tour.id}>{tour.name}</option>)}
              </select>
            </div>
            <div><button type="submit" disabled={alternative.busy} className={adminButton("plain")}>Send alternative</button></div>
          </form>
          <Feedback {...alternative} />
        </Panel>
      )}

      {canQuote && (
        <Panel title={status === "QUOTED" ? "Revise quotation" : "Create quotation"}>
          <form className="grid gap-3" onSubmit={submitQuote}>
            <div className="grid gap-3 md:grid-cols-4">
              <input name="amount" type="number" step="0.01" min="0.01" required placeholder="Amount" aria-label="Amount" className={adminField} />
              <input name="additionalCharges" type="number" step="0.01" min="0" placeholder="Extra charges" aria-label="Additional charges" className={adminField} />
              <input name="currency" defaultValue={props.currency} maxLength={3} aria-label="Currency" className={adminField} />
              <input name="validDays" type="number" min="1" max="60" defaultValue={7} aria-label="Valid for (days)" className={adminField} />
            </div>
            <textarea name="includedServices" required rows={3} minLength={3} placeholder="Included services" className={adminField} />
            <textarea name="notes" rows={2} placeholder="Notes (optional)" className={adminField} />
            <div><button type="submit" disabled={quote.busy} className={adminButton()}>Send quotation</button></div>
          </form>
          <Feedback {...quote} />
        </Panel>
      )}

      {["QUOTE_ACCEPTED", "PAYMENT_PENDING"].includes(status) && (
        <Panel title={status === "PAYMENT_PENDING" ? "Re-send payment instructions" : "Send payment instructions"}>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              instructions.run("POST", `${api}/payment`, { action: "SEND_INSTRUCTIONS", instructions: text(form, "instructions") }, "Payment instructions sent");
            }}
          >
            <textarea name="instructions" required rows={4} minLength={10} placeholder="Bank details / MB Way number and how to reference the payment" className={adminField} />
            <div><button type="submit" disabled={instructions.busy} className={adminButton()}>Send instructions</button></div>
          </form>
          <Feedback {...instructions} />
        </Panel>
      )}

      {status === "PAYMENT_PENDING" && (
        <Panel title="Record payment received">
          <p className="mb-3 text-[13px] text-sand">
            Record a payment only after you have checked the money arrived. Expected amount: <strong className="text-cream">{props.currency} {props.expectedAmount?.toFixed(2)}</strong>.
          </p>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              received.run("POST", `${api}/payment`, {
                action: "RECORD_RECEIVED",
                method: text(form, "method"),
                amount: number(form, "amount"),
                paymentReference: text(form, "paymentReference"),
                notes: text(form, "notes"),
                verified: form.get("verified") === "on",
              }, "Payment recorded");
            }}
          >
            <div className="grid gap-3 md:grid-cols-3">
              <select name="method" required className={adminField} aria-label="Method" defaultValue="BANK_TRANSFER">
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="MBWAY">MB Way</option>
                <option value="CASH">Cash</option>
                <option value="CARD_TERMINAL">Card terminal</option>
                <option value="OTHER">Other</option>
              </select>
              <input name="amount" type="number" step="0.01" min="0.01" required defaultValue={props.expectedAmount ?? undefined} aria-label="Amount received" className={adminField} />
              <input name="paymentReference" placeholder="Payment reference" aria-label="Payment reference" className={adminField} />
            </div>
            <input name="notes" placeholder="Notes (optional)" aria-label="Notes" className={adminField} />
            <label className="flex items-start gap-2 text-[13px] text-sand">
              <input type="checkbox" name="verified" required className="mt-1" />
              I have verified that this payment was received.
            </label>
            <div><button type="submit" disabled={received.busy} className={adminButton()}>Mark payment received</button></div>
          </form>
          <Feedback {...received} />
        </Panel>
      )}

      {status === "PAYMENT_RECEIVED" && (
        <Panel title="Confirm booking">
          <p className="mb-3 text-[13px] text-sand">Payment is verified. Confirming needs a vehicle and a driver, schedules the trip and notifies the customer.</p>
          <button type="button" disabled={confirm.busy} className={adminButton()} onClick={() => confirm.run("POST", `${api}/confirm`, undefined, "Booking confirmed and scheduled")}>
            Confirm booking
          </button>
          <Feedback {...confirm} />
        </Panel>
      )}

      {open && (
        <Panel title="Close booking">
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              if (!window.confirm("Cancel this booking? The customer will be notified.")) return;
              close.run("PATCH", `${api}/status`, { status: "CANCELLED", note: text(form, "note") || undefined }, "Booking cancelled");
            }}
          >
            <input name="note" placeholder="Cancellation reason" aria-label="Cancellation reason" className={adminField} />
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={close.busy} className={adminButton("danger")}>Cancel booking</button>
              {status === "SCHEDULED" && (
                <button type="button" disabled={close.busy} className={adminButton("plain")} onClick={() => close.run("PATCH", `${api}/status`, { status: "COMPLETED" }, "Marked as completed")}>
                  Mark completed
                </button>
              )}
            </div>
          </form>
          <Feedback {...close} />
        </Panel>
      )}
    </div>
  );
}
