import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import ButtonLink from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import { isValidCustomerToken } from "@/server/auth/tokens";
import { REFERENCE_PATTERN } from "@/server/domain/reference";

export const metadata: Metadata = { title: "Request received", robots: { index: false } };

// Shown after a booking request is submitted. It shows the reference only, never personal details,
// and it does not say the booking is confirmed because it is still awaiting review.
export default async function BookingSuccessPage({ searchParams }: PageProps<"/book/success">) {
  const { ref, t } = await searchParams;
  const reference = typeof ref === "string" ? ref : "";
  const token = typeof t === "string" ? t : "";
  if (!REFERENCE_PATTERN.test(reference) || !isValidCustomerToken(reference, token)) notFound();

  return (
    <>
      <Navbar page="destinations" />
      <main className="site-container pt-[120px] pb-24 lg:pt-[190px] lg:pb-[130px]">
        <div className="mx-auto max-w-[620px] text-center">
          <Eyebrow>Request received</Eyebrow>
          <h1 className="mt-4 font-serif text-[32px] leading-[1.2] font-medium text-cream md:text-[42px]">Thank you — we have your request</h1>
          <div className="mx-auto mt-8 inline-block rounded-md bg-charcoal/65 px-8 py-5 shadow-form">
            <p className="text-[11px] tracking-[2px] text-muted uppercase">Booking reference</p>
            <p className="mt-1 font-serif text-[28px] tracking-[2px] text-gold" data-testid="booking-reference">
              {reference}
            </p>
          </div>
          <p className="mx-auto mt-8 max-w-[500px] text-[14.5px] leading-[1.8] text-pretty text-sand">
            Your request is <strong className="font-semibold text-cream">awaiting review</strong> and is not a confirmed booking yet. Our team will contact you about availability and pricing, usually within a few hours. We will
            also email you a copy of your request.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href={`/booking/${reference}?t=${token}`} className="px-8 py-[15px]">
              Follow your request
            </ButtonLink>
            <Link href="/" className="text-[13px] text-sand hover:text-cream">
              Back to home
            </Link>
          </div>
          <p className="mt-6 text-[12px] text-faint">Keep your reference handy and quote it if you contact us.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
