import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import SectionHeader from "@/components/ui/SectionHeader";
import BookingForm from "@/features/booking/BookingForm";
import { VEHICLE_CATEGORY_KEYS } from "@/lib/vehicleCategories";
import { db } from "@/server/db/pool";
import { listVehicles } from "@/server/repositories/resource.repository";
import { getPublicDestinations } from "@/server/services/content.service";

export const metadata: Metadata = {
  title: "Book a tour or ride",
  description: "Request a private tour or chauffeur ride. We review every request and reply with availability and pricing.",
};

// Booking page: a request form, not an instant booking
export default async function BookPage({ searchParams }: PageProps<"/book">) {
  const { destination } = await searchParams;
  const { tours } = await getPublicDestinations();
  // Only offer categories that have at least one active vehicle registered in the admin dashboard
  const activeCategories = new Set((await listVehicles(db)).filter((vehicle) => vehicle.isActive).map((vehicle) => vehicle.category));
  const vehicleCategories = VEHICLE_CATEGORY_KEYS.filter((key) => activeCategories.has(key));
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
            vehicleCategories={vehicleCategories}
            initialDestination={typeof destination === "string" ? destination : undefined}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
