import { Luggage, User } from "lucide-react";
import Image from "next/image";
import type { Vehicle } from "@/content/fleet";

// Fleet vehicle card
export default function FleetCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <article className="flex flex-col border border-cream/12 bg-cream/3 px-[22px] pt-6 transition-[border-color,translate,box-shadow] duration-300 lg:px-6 lg:pt-[26px] lg:hover:-translate-y-1 lg:hover:border-gold lg:hover:shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
      <h3 className="font-serif text-xl text-cream lg:text-[22px] 2xl:text-2xl">{vehicle.className}</h3>
      <div className="mt-1.5 text-xs leading-[1.6] text-muted lg:mt-2 lg:min-h-10 lg:text-[12.5px] 2xl:text-[13.5px]">{vehicle.name}</div>

      {/* Vehicle photo */}
      <div className="relative mx-[-2px] mt-4 h-[150px] overflow-hidden md:h-[170px] lg:mx-[-4px] lg:mt-[18px] lg:mb-5 lg:aspect-[16/9] lg:h-auto xl:aspect-[16/10]">
        <Image
          src={vehicle.image}
          alt={vehicle.name}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
          style={{ objectPosition: vehicle.imagePosition }}
        />
      </div>

      {/* Passengers and luggage */}
      <div className="mt-4 flex justify-between gap-3 border-t border-cream/10 pt-[14px] pb-[18px] lg:mt-auto lg:pt-4 lg:pb-5">
        <span className="inline-flex items-center gap-[7px] text-xs text-sand">
          <User size={14} strokeWidth={1.8} aria-hidden="true" className="text-gold" />
          {vehicle.seats}
        </span>
        <span className="inline-flex items-center gap-[7px] text-xs text-sand">
          <Luggage size={14} strokeWidth={1.8} aria-hidden="true" className="text-gold" />
          {vehicle.bags}
        </span>
      </div>
    </article>
  );
}
