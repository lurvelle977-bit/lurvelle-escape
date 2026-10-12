"use client";

import { Star } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import Eyebrow from "@/components/ui/Eyebrow";
import { BOOKING_HREF, RATING } from "@/config/site";
import { customTour, tours } from "@/content/tours";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import DestinationCard from "./DestinationCard";
import DestinationFilters from "./DestinationFilters";
import DestinationList from "./DestinationList";
import MobileMap from "./MobileMap";
import { budgets, DEFAULT_TOUR_ID, type RegionFilter } from "./data/filters";
import { describeRoute } from "./lib/geo";

// Leaflet needs the browser, so the desktop map only loads on the client
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="h-[clamp(560px,calc(100vh_-_200px),900px)] rounded-[2px] bg-ink shadow-[inset_0_0_0_1px] shadow-gold/25" />,
});

// Destinations page: filters, list, map and detail card
export default function DestinationsExplorer() {
  const isDesktop = useIsDesktop();
  const [selectedId, setSelectedId] = useState(DEFAULT_TOUR_ID);
  const [region, setRegion] = useState<RegionFilter>("All");
  const [budgetIndex, setBudgetIndex] = useState(0);

  // Tours matching the region and budget filters
  const budget = budgets[budgetIndex];
  const visible = tours.filter((t) => (region === "All" || t.region === region) && t.cost >= budget.min && t.cost <= budget.max);
  const visibleIds = visible.map((t) => t.id);

  // Keep a visible tour selected when filters change
  const activeId = visible.length && !visibleIds.includes(selectedId) ? visible[0].id : selectedId;
  const active = tours.find((t) => t.id === activeId) ?? tours[0];

  // List, empty state and custom tour row (sits in the left column on desktop, under the card below it)
  const list = (
    <>
      <DestinationList tours={visible} activeId={activeId} onSelect={setSelectedId} />
      {visible.length === 0 && (
        <p className="border-b border-cream/8 px-4 py-7 text-[13.5px] leading-[1.7] text-muted">
          No escapes match those filters — try widening the budget, or ask us for a custom tour below.
        </p>
      )}
      <Link
        href={BOOKING_HREF}
        className="flex items-baseline justify-between gap-3 border-b border-cream/8 px-[14px] py-[18px] lg:px-4 lg:py-5"
      >
        <span className="font-serif text-base text-cream lg:text-[17px]">{customTour.name}</span>
        <span className="text-xs whitespace-nowrap text-gold">{customTour.price}</span>
      </Link>
    </>
  );

  return (
    <main className="mx-auto max-w-[430px] overflow-x-hidden px-5 pt-[104px] pb-[70px] md:grid md:max-w-[800px] md:grid-cols-2 md:items-start md:gap-x-10 md:px-10 md:pt-[120px] lg:max-w-[clamp(1280px,82vw,1640px)] lg:grid-cols-[minmax(340px,400px)_1fr] lg:gap-12 lg:overflow-x-visible lg:px-8 lg:pt-[150px] lg:pb-[90px] xl:gap-16 2xl:grid-cols-[440px_1fr] 2xl:px-12">
      <div>
        <Eyebrow>Destinations</Eyebrow>
        <h1 className="mt-[14px] font-serif text-[32px] leading-[1.2] font-medium text-cream lg:mt-[18px] lg:text-[40px] lg:leading-[1.15]">
          Where would you <br className="hidden lg:block" />
          like to escape?
        </h1>
        <p className="mt-[14px] text-[13.5px] leading-[1.7] text-pretty text-muted lg:mt-4 lg:text-sm">
          Choose a destination on the map or from the list.
        </p>

        <DestinationFilters region={region} budgetIndex={budgetIndex} onRegionChange={setRegion} onBudgetChange={setBudgetIndex} />

        {/* Google rating */}
        <div className="mt-[22px] hidden items-center gap-2 border border-gold/30 bg-cream/3 px-4 py-[14px] text-[12.5px] text-sand lg:flex">
          <span aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-cream text-[10px] font-bold text-charcoal">
            G
          </span>
          <span className="flex text-gold" aria-label="5 stars">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} size={12} fill="currentColor" strokeWidth={0} aria-hidden="true" />
            ))}
          </span>
          <span>
            <span className="font-semibold text-cream">{RATING.score}</span> · {RATING.reviews} Google reviews · {RATING.award}
          </span>
        </div>

        {/* Mobile and tablet map */}
        {!isDesktop && (
          <div className="lg:hidden">
            <MobileMap tours={tours} visibleIds={visibleIds} activeId={activeId} onSelect={setSelectedId} />
          </div>
        )}

        <div className="hidden lg:block">{list}</div>
      </div>

      <div className="md:pt-2 lg:pt-0">
        {isDesktop ? (
          <LeafletMap tours={tours} visibleIds={visibleIds} activeId={activeId} onSelect={setSelectedId} />
        ) : (
          <div className="lg:hidden">
            {/* Selected tour card */}
            {visible.length > 0 && (
              <div className="mt-1 overflow-hidden rounded-[2px] bg-charcoal/92 shadow-gold-frame md:mt-0">
                <DestinationCard key={active.id} tour={active} variant="mobile" routeInfo={describeRoute(active)} />
              </div>
            )}
            {list}
          </div>
        )}
      </div>
    </main>
  );
}
