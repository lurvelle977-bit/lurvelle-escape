import Link from "next/link";
import { fleet } from "@/data/fleet";
import { BOOKING_HREF } from "@/data/navigation";
import SectionHeader from "@/components/ui/SectionHeader";
import FleetCard from "./FleetCard";

export default function Fleet() {
  return (
    <section id="fleet" className="pt-[90px] lg:pt-[130px]">
      <div className="site-container">
        {/* Heading with "More Fleet" link */}
        <div className="flex items-end justify-between gap-5 lg:gap-10">
          <SectionHeader eyebrow="03 — Fleet" title="Our Fleet" />
          <Link
            href={BOOKING_HREF}
            className="mb-1 inline-flex items-center gap-1.5 border-b border-gold pb-[5px] text-[11px] font-semibold tracking-[1.5px] whitespace-nowrap text-cream uppercase hover:text-gold lg:mb-2 lg:gap-2 lg:pb-1.5 lg:text-xs lg:tracking-[2px]"
          >
            More Fleet <span className="text-gold">↗</span>
          </Link>
        </div>

        {/* Vehicle cards */}
        <div className="mt-10 flex flex-col gap-4 md:mt-12 md:grid md:grid-cols-2 md:gap-5 lg:mt-14 xl:grid-cols-4">
          {fleet.map((vehicle) => (
            <FleetCard key={vehicle.className} vehicle={vehicle} />
          ))}
        </div>
      </div>
    </section>
  );
}
