import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookingActions from "@/features/admin/BookingActions";
import BookingEditPanel from "@/features/admin/BookingEditPanel";
import { VEHICLE_CATEGORIES } from "@/lib/vehicleCategories";
import { formatDateTime, Panel, StatusBadge } from "@/features/admin/ui";
import { requireAdminPage } from "@/server/auth/page";
import { db } from "@/server/db/pool";
import { AppError } from "@/server/http/errors";
import { listDestinations } from "@/server/repositories/content.repository";
import { getAdminBookingDetail } from "@/server/services/booking.service";

export const metadata: Metadata = { title: "Booking" };

// Admin booking detail: customer and trip, lifecycle actions, quotations, payments, notifications and full history
export default async function AdminBookingPage({ params }: PageProps<"/admin/bookings/[reference]">) {
  await requireAdminPage();
  const { reference } = await params;
  const detail = await getAdminBookingDetail(reference).catch((error) => {
    if (error instanceof AppError && error.code === "NOT_FOUND") return null;
    throw error;
  });
  if (!detail) notFound();
  const { booking, events, quotations, payments, notifications, availability } = detail;
  const destinations = (await listDestinations(db, { onlyActive: true })).map((d) => ({ id: d.slug, name: d.name }));
  const pending = payments.find((payment) => payment.status === "PENDING");

  const rows: [string, string][] = [
    ["Type", booking.bookingType === "TOUR_PACKAGE" ? "Tour package" : "Vehicle / ride"],
    ...(booking.bookingType === "VEHICLE_RIDE" ? ([["Vehicle category", booking.vehicleCategory ? VEHICLE_CATEGORIES[booking.vehicleCategory] : "Not specified"]] as [string, string][]) : []),
    ["Destination", `${booking.destinationName ?? booking.customDestination ?? "—"}${booking.destinationType === "CUSTOM" ? " (custom)" : ""}`],
    ["Travel date", booking.travelDate],
    ["Pickup", booking.pickupLocation],
    ["Passengers", String(booking.passengers)],
    ["Notes", booking.notes ?? "—"],
    ["Assigned vehicle", booking.vehicleName ? `${booking.vehicleName} (${booking.vehiclePlate})` : "Not assigned"],
    ["Driver", booking.driverName ? `${booking.driverName} · ${booking.driverPhone}` : "Not assigned"],
    ["Quoted", booking.quotedAmount === null ? "—" : `${booking.currency} ${booking.quotedAmount.toFixed(2)}`],
    ["Payment", booking.paymentStatus.replace(/_/g, " ")],
  ];

  return (
    <>
      <Link href="/admin" className="text-[13px] text-sand hover:text-gold">← All bookings</Link>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <h1 className="font-serif text-[30px] text-cream">{booking.reference}</h1>
        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid content-start gap-5">
          <Panel title="Customer">
            <p className="text-cream">{booking.customer.name}</p>
            <p className="mt-1 text-[13px]"><a href={`mailto:${booking.customer.email}`}>{booking.customer.email}</a></p>
            <p className="mt-1 text-[13px]">
              <a href={`https://wa.me/${booking.customer.whatsapp.replace(/^\+/, "")}`} target="_blank" rel="noopener noreferrer">{booking.customer.whatsapp} (WhatsApp)</a>
            </p>
          </Panel>
          <Panel title="Trip">
            <dl className="grid gap-2.5">
              {rows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[130px_1fr] gap-3 text-[13.5px]">
                  <dt className="text-muted">{label}</dt>
                  <dd className="break-words whitespace-pre-line text-cream">{value}</dd>
                </div>
              ))}
            </dl>
            {booking.cancelReason && <p className="mt-3 text-[13px] text-[#e8907f]">Cancelled: {booking.cancelReason}</p>}
          </Panel>

          <Panel title="History">
            <ol className="grid gap-3">
              {[...events].reverse().map((event) => (
                <li key={event.id} className="border-l border-gold/40 pl-3 text-[13px]">
                  <span className="text-cream">{event.type.replace(/_/g, " ").toLowerCase()}</span>
                  {event.toStatus && <span className="text-muted"> → {event.toStatus.replace(/_/g, " ")}</span>}
                  {event.message && <div className="text-sand">{event.message}</div>}
                  <div className="text-[11.5px] text-muted">{formatDateTime(event.createdAt)} · {event.actorName ?? event.actorType.toLowerCase()}</div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="grid content-start gap-5">
          {!["CANCELLED", "COMPLETED"].includes(booking.status) && (
            <BookingEditPanel
              key={booking.updatedAt}
              reference={booking.reference}
              travelDate={booking.travelDate}
              pickupLocation={booking.pickupLocation}
              passengers={booking.passengers}
              notes={booking.notes}
            />
          )}
          <BookingActions
            destinations={destinations}
            key={`${booking.status}-${booking.updatedAt}`}
            reference={booking.reference}
            status={booking.status}
            paymentStatus={booking.paymentStatus}
            travelDate={booking.travelDate}
            vehicleId={booking.vehicleId}
            driverId={booking.driverId}
            currency={booking.currency}
            expectedAmount={pending?.expectedAmount ?? null}
            vehicles={availability.vehicles.map((vehicle) => ({ id: vehicle.id, name: vehicle.name, label: `${vehicle.name} · ${vehicle.plate} · ${vehicle.passengerCapacity} seats` }))}
            drivers={availability.drivers.map((driver) => ({ id: driver.id, name: driver.name, label: `${driver.name} · ${driver.phone}` }))}
          />

          {quotations.length > 0 && (
            <Panel title="Quotations">
              <ul className="grid gap-3 text-[13px]">
                {quotations.map((quotation) => (
                  <li key={quotation.id} className="border-b border-cream/8 pb-3 last:border-0">
                    <span className="text-cream">v{quotation.version} · {quotation.currency} {quotation.totalAmount.toFixed(2)}</span>{" "}
                    <span className="text-muted">({quotation.status.toLowerCase()}, valid until {quotation.validUntil.slice(0, 10)})</span>
                    <div className="text-sand whitespace-pre-line">{quotation.includedServices}</div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {payments.length > 0 && (
            <Panel title="Payments">
              <ul className="grid gap-3 text-[13px]">
                {payments.map((payment) => (
                  <li key={payment.id} className="border-b border-cream/8 pb-3 last:border-0">
                    <span className="text-cream">{payment.currency} {payment.expectedAmount.toFixed(2)}</span> <span className="text-muted">({payment.status.toLowerCase()})</span>
                    {payment.status === "RECEIVED" && (
                      <div className="text-sand">
                        {payment.method?.replace(/_/g, " ").toLowerCase()} · ref {payment.paymentReference ?? "—"} · verified by {payment.verifiedByName} on {payment.verifiedAt && formatDateTime(payment.verifiedAt)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title="Notifications">
            {notifications.length === 0 ? (
              <p className="text-[13px] text-muted">None yet.</p>
            ) : (
              <ul className="grid gap-2 text-[12.5px]">
                {notifications.map((notification, index) => (
                  <li key={index} className="text-sand">
                    {notification.channel.toLowerCase()} · {notification.template.replace(/_/g, " ")} →{" "}
                    <span className={notification.status === "SENT" ? "text-[#8fcf9d]" : notification.status === "FAILED" ? "text-[#e8907f]" : "text-muted"}>{notification.status.toLowerCase()}</span>
                    {notification.error && <span className="text-muted"> ({notification.error})</span>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
