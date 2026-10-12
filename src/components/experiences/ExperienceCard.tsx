import Image from "next/image";
import Link from "next/link";
import { BOOKING_HREF } from "@/data/navigation";
import type { Experience } from "@/types";

type ExperienceCardProps = {
  experience: Experience;
  featured?: boolean;
};

// Tour card with a photo (featured = large Sintra card)
export default function ExperienceCard({ experience, featured = false }: ExperienceCardProps) {
  return (
    <Link
      href={BOOKING_HREF}
      className={`flex flex-col text-inherit hover:text-inherit ${
        featured ? "col-span-2 mb-7 lg:col-span-1 lg:row-span-2 lg:mb-0" : "mb-[26px] lg:mb-10"
      }`}
    >
      {/* Photo with slow zoom on hover */}
      <div className={`overflow-hidden rounded-[2px] ${featured ? "lg:flex lg:flex-1 lg:flex-col" : ""}`}>
        <div
          className={`ease-lux relative transition-transform duration-800 hover:scale-[1.04] ${
            featured ? "h-[300px] md:h-[420px] lg:h-auto lg:min-h-[420px] lg:flex-1" : "h-[130px] md:h-[210px] lg:aspect-[3/2] lg:h-auto"
          }`}
        >
          {experience.image && (
            <Image
              src={experience.image}
              alt={experience.name}
              fill
              sizes={featured ? "(min-width: 1024px) 40vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
              className="object-cover"
            />
          )}
        </div>
      </div>

      {/* Name, duration and price */}
      {featured ? (
        <div className="flex items-baseline justify-between gap-4 border-b border-cream/10 pt-4 pb-[18px] lg:py-5">
          <div>
            <div className="font-serif text-[21px] text-cream lg:text-2xl 2xl:text-[28px]">{experience.name}</div>
            <div className="mt-[5px] text-xs text-muted lg:mt-1.5 lg:text-[12.5px] 2xl:text-[13.5px]">{experience.hours}</div>
          </div>
          <div className="text-[12.5px] whitespace-nowrap text-gold lg:text-[13px] 2xl:text-sm">{experience.price}</div>
        </div>
      ) : (
        <div className="border-b border-cream/10 pt-3 pb-[14px] lg:flex lg:items-baseline lg:justify-between lg:gap-3 lg:py-4">
          <div>
            <div className="font-serif text-base leading-[1.3] text-cream lg:text-lg lg:leading-normal 2xl:text-xl">{experience.name}</div>
            <div className="mt-1 text-[11.5px] text-muted lg:text-xs 2xl:text-[13px]">{experience.hours}</div>
          </div>
          <div className="mt-1.5 text-xs whitespace-nowrap text-gold lg:mt-0 lg:text-[12.5px] 2xl:text-[13.5px]">{experience.price}</div>
        </div>
      )}
    </Link>
  );
}
