import Image from "next/image";
import { formatHours, formatPrice, type Tour } from "@/content/tours";
import { cn } from "@/lib/cn";

type DestinationListProps = {
  tours: Tour[];
  activeId: string;
  onSelect: (id: string) => void;
};

// Clickable list of tours with thumbnails
export default function DestinationList({ tours, activeId, onSelect }: DestinationListProps) {
  return (
    <ul className="mt-9 border-t border-cream/8 lg:mt-5">
      {tours.map((tour) => {
        const active = tour.id === activeId;
        return (
          <li key={tour.id}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(tour.id)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-[14px] border-b border-l border-b-cream/8 px-[14px] py-4 text-left transition-colors duration-250 lg:gap-4 lg:px-4 lg:py-[18px]",
                active ? "border-l-gold bg-gold/8" : "border-l-transparent lg:hover:bg-cream/4",
              )}
            >
              <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[2px] lg:h-14 lg:w-14">
                <Image src={tour.image} alt="" fill sizes="56px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-serif text-[15px] text-cream lg:text-base">{tour.name}</div>
                <div className="mt-[3px] text-[11.5px] text-muted lg:text-xs">{formatHours(tour)}</div>
              </div>
              <div className="text-[11.5px] whitespace-nowrap text-gold lg:text-xs">{formatPrice(tour)}</div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
