import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Eyebrow from "@/components/ui/Eyebrow";
import QuotationResponse from "@/features/booking/QuotationResponse";
import { customerStatus } from "@/features/booking/statusCopy";
import { AppError } from "@/server/http/errors";
import { getCustomerBooking } from "@/server/services/booking.service";

export const metadata: Metadata = { title: "Your booking", robots: { index: false } };

// Private booking page reached from the emailed link. The token in the URL is the only credential.
export default async function CustomerBookingPage({ params, searchParams }: PageProps<"/booking/[reference]">) {
  const { reference } = await params;
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : "";

  const booking = await getCustomerBooking(reference, token).catch((error) => {
    if (error instanceof AppError && error.code === "NOT_FOUND") return null;
    throw error;
  });
  if (!booking) notFound();

  const status = customerStatus[booking.status];
  const quotation = booking.quotation;
  const canRespond = booking.status === "QUOTED" && quotation?.status === "SENT" && !quotation.expired;

  const rows: [string, string][] = [
    ["Service", booking.bookingType === "TOUR_PACKAGE" ? "Tour package" : "Vehicle / ride"],
    ["Destination", booking.destination ?? "—"],
    ["Travel date", booking.travelDate],
    ["Pickup", booking.pickupLocation],
    ["Passengers", String(booking.passengers)],
    ...(booking.vehicle ? ([["Vehicle", booking.vehicle]] as [string, string][]) : []),
    ...(booking.driver ? ([["Driver", booking.driver]] as [string, string][]) : []),
  ];

  return (
    <>
      <Navbar page="destinations" />
      <main className="site-container pt-[110px] pb-20 lg:pt-[170px] lg:pb-[110px]">
        <div className="mx-auto max-w-[680px]">
          <Eyebrow>Booking {booking.reference}</Eyebrow>
          <h1 className="mt-3 font-serif text-[30px] leading-[1.2] font-medium text-cream md:text-[38px]">{status.label}</h1>
          <p className="mt-3 text-[14.5px] leading-[1.8] text-sand">{status.message}</p>

          <dl className="mt-8 grid gap-3 rounded-md bg-charcoal/65 p-6 shadow-form">
            {rows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[110px_1fr] gap-3 text-[14px]">
                <dt className="text-muted">{label}</dt>
                <dd className="break-words text-cream">{value}</dd>
              </div>
            ))}
          </dl>

          {quotation && (
            <section className="mt-6 rounded-md bg-charcoal/65 p-6 shadow-form" aria-labelledby="quotation-heading">
              <Eyebrow as="p" id="quotation-heading">
                Quotation
              </Eyebrow>
              <p className="mt-2 font-serif text-[32px] text-gold">
                {quotation.currency} {quotation.total.toFixed(2)}
              </p>
              {quotation.additionalCharges > 0 && (
                <p className="text-[12px] text-muted">
                  Includes {quotation.currency} {quotation.additionalCharges.toFixed(2)} additional charges
                </p>
              )}
              <p className="mt-4 text-[14px] whitespace-pre-line text-cream">{quotation.includedServices}</p>
              {quotation.notes && <p className="mt-3 text-[13px] whitespace-pre-line text-muted">{quotation.notes}</p>}
              {quotation.status === "SENT" && (
                <p className="mt-3 text-[12px] text-muted">
                  {quotation.expired ? "This quotation has expired. Please contact us for an updated one." : `Valid until ${quotation.validUntil.slice(0, 10)}`}
                </p>
              )}
              {canRespond && <QuotationResponse reference={booking.reference} token={token} />}
            </section>
          )}

          {booking.paymentInstructions && (
            <section className="mt-6 rounded-md bg-charcoal/65 p-6 shadow-form">
              <Eyebrow as="p">How to pay</Eyebrow>
              <p className="mt-3 text-[14px] leading-[1.8] whitespace-pre-line text-cream">{booking.paymentInstructions}</p>
              <p className="mt-3 text-[12px] text-muted">Use {booking.reference} as the payment reference. Your booking is confirmed once we verify your payment.</p>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
