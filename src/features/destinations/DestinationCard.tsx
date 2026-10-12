import Image from "next/image";
import ButtonLink from "@/components/ui/Button";
import { BOOKING_HREF } from "@/config/site";
import { formatHours, formatPrice, type Tour } from "@/content/tours";
import { cn } from "@/lib/cn";

type DestinationCardProps = {
  tour: Tour;
  variant: "desktop" | "mobile";
  routeInfo?: string;
};

// Detail card for the selected tour
export default function DestinationCard({ tour, variant, routeInfo }: DestinationCardProps) {
  const desktop = variant === "desktop";

  return (
    <div className={desktop ? "animate-card-in" : "animate-card-in-mobile"}>
      <div className={cn("relative", desktop ? "h-[140px]" : "h-[150px]")}>
        <Image src={tour.image} alt={tour.name} fill sizes="(min-width: 768px) 360px, 400px" className="object-cover" />
      </div>
      <div className={desktop ? "px-5 pt-[18px] pb-5" : "px-[18px] pt-4 pb-[18px]"}>
        <h2 className={cn("font-serif text-cream", desktop ? "text-xl" : "text-[19px]")}>{tour.name}</h2>
        <p className="mt-2 text-[12.5px] leading-[1.6] text-sand">{tour.blurb}</p>

        {/* Driving distance from Lisbon */}
        {routeInfo && <div className="mt-3 text-[11px] font-semibold tracking-[1.4px] text-gold uppercase">{routeInfo}</div>}

        <div className={cn("flex justify-between gap-3 text-xs text-muted", desktop ? "mt-[14px]" : "mt-3")}>
          <span>{formatHours(tour)}</span>
          <span className="text-gold">{formatPrice(tour)}</span>
        </div>
        <ButtonLink href={BOOKING_HREF} className={cn("flex text-[11px]", desktop ? "mt-4 py-3" : "mt-[14px] py-[13px]")}>
          Book this escape
        </ButtonLink>
      </div>
    </div>
  );
}
