import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import BookingFilters from "@/features/admin/BookingFilters";
import BookingRowActions from "@/features/admin/BookingRowActions";
import { VEHICLE_CATEGORIES } from "@/lib/vehicleCategories";
import { formatDateTime, StatusBadge } from "@/features/admin/ui";
import { requireAdminPage } from "@/server/auth/page";
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
    for (const key of ["q", "status", "type", "category", "assignment", "dates", "from", "to"] as const) {
      if (filters[key]) params.set(key, filters[key]);
    }
    params.set("page", String(nextPage));
    return `/admin?${params}`;
  };

  // e.g. the last row of the last page was just deleted: go to the new last page, keeping the filters
  if (page > pages) redirect(link(pages));

  return (
    <>
      <h1 className="font-serif text-[30px] text-cream">Bookings</h1>
      <BookingFilters />

      <div className="mt-6 overflow-x-auto rounded-md bg-charcoal/65 shadow-form">
        <table className="w-full min-w-[1180px] text-left text-[13.5px]">
          <thead className="text-[11px] tracking-[1.5px] text-muted uppercase">
            <tr>
              <th className="p-4 font-semibold">Reference</th>
              <th className="p-4 font-semibold">Customer</th>
              <th className="p-4 font-semibold">Trip</th>
              <th className="p-4 font-semibold">Travel Date</th>
              <th className="p-4 font-semibold">Vehicle Category</th>
              <th className="p-4 font-semibold">Assigned Vehicle</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Requested</th>
              <th className="p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={9} className="p-6 text-center text-muted">No bookings match the selected filters.</td></tr>
            )}
            {items.map((booking) => (
              <tr key={booking.id} className="border-t border-cream/8 hover:bg-cream/4">
                <td className="p-4"><Link href={`/admin/bookings/${booking.reference}`} className="font-semibold text-gold">{booking.reference}</Link></td>
                <td className="p-4 text-cream">{booking.customer.name}<div className="text-[12px] text-muted">{booking.customer.email}</div></td>
                <td className="p-4 text-cream">{booking.destinationName ?? booking.customDestination}<div className="text-[12px] text-muted">{booking.bookingType === "TOUR_PACKAGE" ? "Tour package" : "Vehicle / ride"} · {booking.passengers} pax</div></td>
                <td className="p-4 text-cream">{booking.travelDate}</td>
                <td className="p-4 text-cream">
                  {booking.bookingType === "TOUR_PACKAGE" ? (
                    <span className="text-muted">Not Applicable</span>
                  ) : booking.vehicleCategory ? (
                    VEHICLE_CATEGORIES[booking.vehicleCategory]
                  ) : (
                    <span className="text-muted">Not Specified</span>
                  )}
                </td>
                <td className="p-4 text-cream">
                  {booking.vehicleName ? (
                    <>
                      {booking.vehicleName}
                      <div className="text-[12px] text-muted">{booking.vehiclePlate}</div>
                    </>
                  ) : (
                    <span className="text-[12.5px] text-muted">Not Assigned</span>
                  )}
                </td>
                <td className="p-4"><StatusBadge status={booking.status} /></td>
                <td className="p-4 text-muted">{formatDateTime(booking.createdAt)}</td>
                <td className="p-4"><BookingRowActions reference={booking.reference} customerName={booking.customer.name} /></td>
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
