import SectionHeader from "@/components/ui/SectionHeader";
import { pricingNotes, tiers } from "@/content/tiers";
import TierCard from "./TierCard";

export default function ComfortTiers() {
  return (
    <section id="tiers" className="pt-[90px] lg:pt-[130px]">
      <div className="site-container">
        <SectionHeader eyebrow="02 — Comfort" title="Three levels of travel" />

        {/* Tier cards */}
        <div className="mt-10 flex flex-col gap-4 md:mt-12 md:grid md:grid-cols-3 lg:mt-16 lg:gap-0 lg:border-t lg:border-cream/10">
          {tiers.map((tier) => (
            <TierCard key={tier.name} tier={tier} />
          ))}
        </div>

        {/* Pricing notes */}
        <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-cream/10 py-[22px] md:grid-cols-4 lg:mt-0 lg:flex lg:justify-between lg:gap-6 lg:py-6">
          {pricingNotes.map((note) => (
            <li key={note} className="text-[11px] font-semibold tracking-[1.8px] text-faint uppercase lg:tracking-[2px]">
              {note}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
