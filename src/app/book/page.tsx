import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import SectionHeader from "@/components/ui/SectionHeader";
import { tours } from "@/content/tours";
import BookingForm from "@/features/booking/BookingForm";

export const metadata: Metadata = {
  title: "Book a tour or ride",
  description: "Request a private tour or chauffeur ride. We review every request and reply with availability and pricing.",
};

// Booking page: a request form, not an instant booking
export default async function BookPage({ searchParams }: PageProps<"/book">) {
  const { destination } = await searchParams;
  return (
    <>
      <Navbar page="destinations" />
      <main className="site-container pt-[110px] pb-20 lg:pt-[170px] lg:pb-[110px]">
        <div className="mx-auto max-w-[760px]">
          <SectionHeader eyebrow="Booking request" title="Plan your escape" />
          <p className="mt-4 mb-10 max-w-[480px] text-sm leading-[1.8] text-pretty text-muted md:text-[14.5px]">
            Send us your request and our team will check availability and reply with a quotation. Nothing is charged or confirmed until you accept.
          </p>
          <BookingForm
            destinations={tours.map(({ id, name }) => ({ id, name }))}
            initialDestination={typeof destination === "string" ? destination : undefined}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
