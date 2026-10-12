import Link from "next/link";
import SectionHeader from "@/components/ui/SectionHeader";
import { BOOKING_HREF } from "@/config/site";
import { cardTours, customTour, featuredTour, formatDuration, formatPrice, rowTours } from "@/content/tours";
import ExperienceCard from "./ExperienceCard";

// Text-only rows: the remaining tours plus the custom tour
const rows = [
  ...rowTours.map((tour) => ({ name: tour.name, duration: formatDuration(tour), price: formatPrice(tour) })),
  customTour,
];

export default function Experiences() {
  return (
    <section id="experiences" className="pt-[90px] pb-5 lg:pt-[130px] lg:pb-10">
      <div className="site-container">
        {/* Section heading and intro */}
        <div className="lg:flex lg:items-end lg:justify-between lg:gap-10">
          <SectionHeader
            eyebrow="01 — Experiences"
            title="Handpicked journeys around Portugal"
            titleClassName="lg:max-w-[12em]"
          />
          <p className="mt-4 text-sm leading-[1.7] text-pretty text-muted md:max-w-[520px] lg:mt-0 lg:mb-1.5 lg:max-w-[320px] 2xl:max-w-[380px] 2xl:text-[15px]">
            From half-day city escapes to full days on the coast — every tour is private, unhurried, and yours to shape.
          </p>
        </div>

        {/* Featured tour and photo cards */}
        <div className="mt-10 grid grid-cols-2 gap-x-4 md:mt-12 md:gap-x-6 lg:mt-16 lg:grid-cols-[1.6fr_1fr_1fr] lg:gap-x-10">
          <ExperienceCard tour={featuredTour} featured />
          {cardTours.map((tour) => (
            <ExperienceCard key={tour.id} tour={tour} />
          ))}
        </div>

        {/* Text-only tour rows */}
        <div className="flex flex-col md:grid md:grid-cols-2 md:gap-x-6 lg:mt-2 lg:grid-cols-3 lg:gap-10">
          {rows.map((row) => (
            <Link
              key={row.name}
              href={BOOKING_HREF}
              className="flex items-baseline justify-between gap-3 border-b border-cream/10 py-[18px] text-inherit hover:text-inherit lg:py-[22px] lg:hover:border-gold/50"
            >
              <div>
                <h3 className="font-serif text-[17px] text-cream lg:text-lg 2xl:text-xl">{row.name}</h3>
                <div className="mt-1 text-[11.5px] text-muted lg:text-xs 2xl:text-[13px]">{row.duration}</div>
              </div>
              <div className="text-xs whitespace-nowrap text-gold lg:text-[12.5px] 2xl:text-[13.5px]">{row.price}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
