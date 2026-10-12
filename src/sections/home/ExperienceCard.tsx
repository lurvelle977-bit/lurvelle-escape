import Image from "next/image";
import Link from "next/link";
import { BOOKING_HREF } from "@/config/site";
import { formatDuration, formatPrice, type Tour } from "@/content/tours";
import { cn } from "@/lib/cn";

type ExperienceCardProps = {
  tour: Tour;
  featured?: boolean;
};

// Tour card with a photo (featured = large card spanning two rows on desktop)
export default function ExperienceCard({ tour, featured = false }: ExperienceCardProps) {
  return (
    <Link
      href={BOOKING_HREF}
      className={cn(
        "group flex flex-col text-inherit hover:text-inherit",
        featured ? "col-span-2 mb-7 lg:col-span-1 lg:row-span-2 lg:mb-0" : "mb-[26px] lg:mb-10",
      )}
    >
      {/* Photo with slow zoom on hover */}
      <div className={cn("overflow-hidden rounded-[2px]", featured && "lg:flex lg:flex-1 lg:flex-col")}>
        <div
          className={cn(
            "ease-lux relative transition-transform duration-800 group-hover:scale-[1.04]",
            featured ? "h-[300px] md:h-[420px] lg:h-auto lg:min-h-[420px] lg:flex-1" : "h-[130px] md:h-[210px] lg:aspect-[3/2] lg:h-auto",
          )}
        >
          <Image
            src={tour.image}
            alt={tour.name}
            fill
            sizes={featured ? "(min-width: 1024px) 40vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
            className="object-cover"
          />
        </div>
      </div>

      {/* Name, duration and price */}
      {featured ? (
        <div className="flex items-baseline justify-between gap-4 border-b border-cream/10 pt-4 pb-[18px] lg:py-5">
          <div>
            <h3 className="font-serif text-[21px] text-cream lg:text-2xl 2xl:text-[28px]">{tour.name}</h3>
            <div className="mt-[5px] text-xs text-muted lg:mt-1.5 lg:text-[12.5px] 2xl:text-[13.5px]">{formatDuration(tour)}</div>
          </div>
          <div className="text-[12.5px] whitespace-nowrap text-gold lg:text-[13px] 2xl:text-sm">{formatPrice(tour)}</div>
        </div>
      ) : (
        <div className="border-b border-cream/10 pt-3 pb-[14px] lg:flex lg:items-baseline lg:justify-between lg:gap-3 lg:py-4">
          <div>
            <h3 className="font-serif text-base leading-[1.3] text-cream lg:text-lg lg:leading-normal 2xl:text-xl">{tour.name}</h3>
            <div className="mt-1 text-[11.5px] text-muted lg:text-xs 2xl:text-[13px]">{formatDuration(tour)}</div>
          </div>
          <div className="mt-1.5 text-xs whitespace-nowrap text-gold lg:mt-0 lg:text-[12.5px] 2xl:text-[13.5px]">{formatPrice(tour)}</div>
        </div>
      )}
    </Link>
  );
}
