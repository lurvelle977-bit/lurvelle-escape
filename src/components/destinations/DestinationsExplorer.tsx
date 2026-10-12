"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { budgets, DEFAULT_DESTINATION_ID, destinations } from "@/data/destinations";
import { BOOKING_HREF } from "@/data/navigation";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import type { Region } from "@/types";
import DestinationCard from "./DestinationCard";
import DestinationFilters from "./DestinationFilters";
import DestinationList from "./DestinationList";
import MobileMap from "./MobileMap";

// Leaflet needs the browser, so the desktop map only loads on the client
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="h-[clamp(560px,calc(100vh_-_200px),900px)] rounded-[2px] bg-ink shadow-[inset_0_0_0_1px_rgba(198,161,91,0.25)]" />,
});

// "Custom Private Tour" row under the list
function CustomTourLink({ desktop }: { desktop: boolean }) {
  return (
    <Link
      href={BOOKING_HREF}
      className={`flex items-baseline justify-between gap-3 border-b border-cream/8 ${desktop ? "px-4 py-5" : "px-[14px] py-[18px]"}`}
    >
      <span className={`font-serif text-cream ${desktop ? "text-[17px]" : "text-base"}`}>Custom Private Tour</span>
      <span className="text-xs whitespace-nowrap text-gold">On request</span>
    </Link>
  );
}

// Destinations page: filters, list, map and detail card
export default function DestinationsExplorer() {
  const isDesktop = useIsDesktop();
  const [selectedId, setSelectedId] = useState(DEFAULT_DESTINATION_ID);
  const [region, setRegion] = useState<Region>("All");
  const [budgetIndex, setBudgetIndex] = useState(0);

  // Destinations matching the region and budget filters
  const budget = budgets[budgetIndex];
  const visible = destinations.filter(
    (d) => (region === "All" || d.region === region) && d.cost >= budget.min && d.cost <= budget.max,
  );
  const visibleIds = visible.map((d) => d.id);

  // Keep a visible destination selected when filters change
  const activeId = visible.length && !visibleIds.includes(selectedId) ? visible[0].id : selectedId;

  // Destination shown in the mobile card (mobile has no filters)
  const selected = destinations.find((d) => d.id === selectedId) ?? destinations[0];

  return (
    <>
      {/* Desktop layout */}
      <main className="mx-auto hidden max-w-[clamp(1280px,82vw,1640px)] grid-cols-[minmax(340px,400px)_1fr] items-start gap-12 px-8 pt-[150px] pb-[90px] lg:grid xl:gap-16 2xl:grid-cols-[440px_1fr] 2xl:px-12">
        <aside>
          <div className="text-[11px] font-semibold tracking-[3px] text-gold uppercase">Destinations</div>
          <h1 className="mt-[18px] font-serif text-[40px] leading-[1.15] font-medium text-cream">
            Where would you
            <br />
            like to escape?
          </h1>
          <p className="mt-4 text-sm leading-[1.7] text-pretty text-muted">Select a destination on the map or from the list.</p>

          <DestinationFilters
            region={region}
            budgetIndex={budgetIndex}
            onRegionChange={setRegion}
            onBudgetChange={setBudgetIndex}
          />

          {/* Google rating */}
          <div className="mt-[22px] flex items-center gap-2 border border-gold/30 bg-cream/3 px-4 py-[14px] text-[12.5px] text-sand">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-cream text-[10px] font-bold text-charcoal">
              G
            </span>
            <span className="tracking-[1px] text-gold">★★★★★</span>
            <span className="font-semibold text-cream">4.9</span> · 312 Google reviews · Travellers&apos; Choice 2026
          </div>

          <DestinationList destinations={visible} activeId={activeId} onSelect={setSelectedId} variant="desktop" />

          {/* Empty state when no destination matches */}
          {visible.length === 0 && (
            <div className="border-b border-cream/8 px-4 py-7 text-[13.5px] leading-[1.7] text-muted">
              No escapes match those filters — try widening the budget, or ask us for a custom tour below.
            </div>
          )}

          <CustomTourLink desktop />
        </aside>

        {isDesktop && (
          <LeafletMap destinations={destinations} visibleIds={visibleIds} activeId={activeId} onSelect={setSelectedId} />
        )}
      </main>

      {/* Mobile layout (tablet: map on the left, card and list on the right) */}
      <main className="mx-auto max-w-[430px] overflow-x-hidden px-5 pt-[104px] pb-[70px] md:grid md:max-w-[800px] md:grid-cols-2 md:items-start md:gap-x-10 md:px-10 md:pt-[120px] lg:hidden">
        <div>
          <div className="text-[11px] font-semibold tracking-[2.5px] text-gold uppercase">Destinations</div>
          <h1 className="mt-[14px] font-serif text-[32px] leading-[1.2] font-medium text-cream">Where would you like to escape?</h1>
          <p className="mt-[14px] text-[13.5px] leading-[1.7] text-pretty text-muted">Tap a destination on the map or from the list.</p>

          <MobileMap destinations={destinations} activeId={selectedId} onSelect={setSelectedId} />
        </div>

        <div className="md:pt-2">
          {/* Selected destination card */}
          <div className="mt-1 overflow-hidden rounded-[2px] bg-[rgba(26,24,18,0.92)] shadow-[0_24px_60px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(198,161,91,0.3)] md:mt-0">
            <DestinationCard key={selected.id} destination={selected} variant="mobile" />
          </div>

          <DestinationList destinations={destinations} activeId={selectedId} onSelect={setSelectedId} variant="mobile" />
          <CustomTourLink desktop={false} />
        </div>
      </main>
    </>
  );
}
