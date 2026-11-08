import type { Metadata } from "next";
import Link from "next/link";
import { adminButton, adminField, formatDateTime, StatusBadge } from "@/features/admin/ui";
import { requireAdminPage } from "@/server/auth/page";
import { BOOKING_STATUSES } from "@/server/domain/status";
import { listBookings } from "@/server/services/booking.service";
import { listBookingsSchema } from "@/server/validation/booking";

export const metadata: Metadata = { title: "Bookings" };

// Admin booking list: search by reference / name / email, filter by status and type, paginated
export default async function AdminBookingsPage({ searchParams }: PageProps<"/admin">) {
  await requireAdminPage();
  const raw = await searchParams;
  const parsed = listBookingsSchema.safeParse(Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])));
  const filters = parsed.success ? parsed.data : listBookingsSchema.parse({});
  const { items, total, page, pageSize } = await listBookings(filters);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const link = (nextPage: number) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.status) params.set("status", filters.status);
    if (filters.type) params.set("type", filters.type);
    params.set("page", String(nextPage));
    return `/admin?${params}`;
  };

  return (
    <>
      <h1 className="font-serif text-[30px] text-cream">Bookings</h1>
      <form method="get" className="mt-6 grid gap-3 md:grid-cols-[1fr_200px_180px_auto]">
        <label className="sr-only" htmlFor="q">Search</label>
        <input id="q" name="q" defaultValue={filters.q} placeholder="Search reference, name or email" className={adminField} />
        <label className="sr-only" htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={filters.status ?? ""} className={adminField}>
          <option value="">All statuses</option>
          {BOOKING_STATUSES.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
        </select>
        <label className="sr-only" htmlFor="type">Type</label>
        <select id="type" name="type" defaultValue={filters.type ?? ""} className={adminField}>
          <option value="">All types</option>
          <option value="TOUR_PACKAGE">Tour package</option>
          <option value="VEHICLE_RIDE">Vehicle / ride</option>
        </select>
        <button type="submit" className={adminButton()}>Filter</button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-md bg-charcoal/65 shadow-form">
        <table className="w-full min-w-[820px] text-left text-[13.5px]">
          <thead className="text-[11px] tracking-[1.5px] text-muted uppercase">
            <tr>
              <th className="p-4 font-semibold">Reference</th>
              <th className="p-4 font-semibold">Customer</th>
              <th className="p-4 font-semibold">Trip</th>
              <th className="p-4 font-semibold">Travel date</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Requested</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted">No bookings match.</td></tr>
            )}
            {items.map((booking) => (
              <tr key={booking.id} className="border-t border-cream/8 hover:bg-cream/4">
                <td className="p-4"><Link href={`/admin/bookings/${booking.reference}`} className="font-semibold text-gold">{booking.reference}</Link></td>
                <td className="p-4 text-cream">{booking.customer.name}<div className="text-[12px] text-muted">{booking.customer.email}</div></td>
                <td className="p-4 text-cream">{booking.destinationName ?? booking.customDestination}<div className="text-[12px] text-muted">{booking.bookingType === "TOUR_PACKAGE" ? "Tour package" : "Vehicle / ride"} · {booking.passengers} pax</div></td>
                <td className="p-4 text-cream">{booking.travelDate}</td>
                <td className="p-4"><StatusBadge status={booking.status} /></td>
                <td className="p-4 text-muted">{formatDateTime(booking.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-[13px] text-muted">
        <span>{total} booking{total === 1 ? "" : "s"} · page {page} of {pages}</span>
        <span className="flex gap-3">
          {page > 1 && <Link href={link(page - 1)}>← Previous</Link>}
          {page < pages && <Link href={link(page + 1)}>Next →</Link>}
        </span>
      </div>
    </>
  );
}
