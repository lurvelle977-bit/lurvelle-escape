import Image from "next/image";
import Link from "next/link";
import { BOOKING_HREF } from "@/data/navigation";
import type { Destination } from "@/types";

type DestinationCardProps = {
  destination: Destination;
  variant: "desktop" | "mobile";
  routeInfo?: string;
};

// Detail card for the selected destination
export default function DestinationCard({ destination, variant, routeInfo }: DestinationCardProps) {
  const desktop = variant === "desktop";

  return (
    <div className={desktop ? "animate-card-in" : "animate-card-in-mobile"}>
      <div className={`relative ${desktop ? "h-[140px]" : "h-[150px]"}`}>
        <Image src={destination.image} alt={destination.name} fill sizes="(min-width: 768px) 360px, 400px" className="object-cover" />
      </div>
      <div className={desktop ? "px-5 pt-[18px] pb-5" : "px-[18px] pt-4 pb-[18px]"}>
        <div className={`font-serif text-cream ${desktop ? "text-xl" : "text-[19px]"}`}>{destination.name}</div>
        <p className="mt-2 text-[12.5px] leading-[1.6] text-sand">{destination.blurb}</p>

        {/* Driving distance from Lisbon (desktop map only) */}
        {desktop && (
          <div className="mt-3 text-[11px] font-semibold tracking-[1.4px] text-gold uppercase">{routeInfo}</div>
        )}

        <div className={`flex justify-between gap-3 text-xs text-muted ${desktop ? "mt-[14px]" : "mt-3"}`}>
          <span>{destination.hours}</span>
          <span className="text-gold">{destination.price}</span>
        </div>
        <Link
          href={BOOKING_HREF}
          className={`block rounded-full bg-gold text-center text-[11px] font-semibold tracking-[1.5px] text-dark uppercase hover:text-dark ${
            desktop ? "mt-4 py-3" : "mt-[14px] py-[13px]"
          }`}
        >
          Book this escape
        </Link>
      </div>
    </div>
  );
}
