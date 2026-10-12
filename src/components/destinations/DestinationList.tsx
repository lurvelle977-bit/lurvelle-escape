import Image from "next/image";
import type { Destination } from "@/types";

type DestinationListProps = {
  destinations: Destination[];
  activeId: string;
  onSelect: (id: string) => void;
  variant: "desktop" | "mobile";
};

// Clickable list of destinations with thumbnails
export default function DestinationList({ destinations, activeId, onSelect, variant }: DestinationListProps) {
  const desktop = variant === "desktop";

  return (
    <div className={`border-t border-cream/8 ${desktop ? "mt-5" : "mt-9"}`}>
      {destinations.map((destination) => {
        const active = destination.id === activeId;
        return (
          <button
            key={destination.id}
            type="button"
            onClick={() => onSelect(destination.id)}
            className={`flex w-full cursor-pointer items-center border-b border-l border-b-cream/8 text-left transition-colors duration-[250ms] ${
              desktop ? "gap-4 px-4 py-[18px]" : "gap-[14px] px-[14px] py-4"
            } ${active ? "border-l-gold bg-gold/8" : `border-l-transparent ${desktop ? "hover:bg-cream/4" : ""}`}`}
          >
            <div className={`relative shrink-0 overflow-hidden rounded-[2px] ${desktop ? "h-14 w-14" : "h-[52px] w-[52px]"}`}>
              <Image src={destination.image} alt="" fill sizes="56px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className={`font-serif text-cream ${desktop ? "text-base" : "text-[15px]"}`}>{destination.name}</div>
              <div className={`mt-[3px] text-muted ${desktop ? "text-xs" : "text-[11.5px]"}`}>{destination.hours}</div>
            </div>
            <div className={`whitespace-nowrap text-gold ${desktop ? "text-xs" : "text-[11.5px]"}`}>{destination.price}</div>
          </button>
        );
      })}
    </div>
  );
}
