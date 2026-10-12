import Link from "next/link";
import { BOOKING_HREF } from "@/data/navigation";
import type { Tier } from "@/types";

// Comfort level card (hover lift, gold rule and growing dashes on desktop)
export default function TierCard({ tier }: { tier: Tier }) {
  return (
    <div
      className={`group relative flex flex-col border border-cream/12 px-[26px] pt-8 pb-9 md:px-5 [transition:background_0.45s_ease,transform_0.45s_var(--ease-lux)] lg:border-0 lg:border-r lg:border-cream/10 lg:px-10 lg:pt-11 lg:pb-[52px] 2xl:px-12 2xl:pt-12 lg:hover:-translate-y-1.5 lg:hover:bg-[rgba(198,161,91,0.08)] ${
        tier.highlighted ? "bg-[rgba(198,161,91,0.05)]" : ""
      }`}
    >
      {/* Gold rule that grows across the top on hover */}
      <span className="ease-lux absolute -top-px left-0 hidden h-0.5 w-0 bg-gold transition-[width] duration-[550ms] group-hover:w-full lg:block" />

      <div className="text-[10.5px] font-semibold tracking-[2.2px] text-muted uppercase transition-colors duration-[350ms] lg:text-[11px] lg:tracking-[2.5px] lg:group-hover:text-gold">
        {tier.eyebrow}
      </div>
      <div className="mt-3 font-serif text-[25px] text-cream lg:mt-[14px] lg:text-[28px] 2xl:text-[32px]">{tier.name}</div>
      <div className="mt-1.5 text-[13px] leading-[1.6] text-muted lg:mt-2 lg:text-[13.5px] 2xl:text-[15px]">{tier.tag}</div>

      {/* Feature list */}
      <div className="mt-[22px] flex flex-col gap-[11px] lg:mt-7 lg:gap-3">
        {tier.features.map((feature, index) => (
          <div key={feature} className="flex items-center gap-3">
            <span
              className="ease-lux h-px w-[14px] shrink-0 bg-gold transition-[width] duration-[400ms] lg:group-hover:w-[26px]"
              style={{ transitionDelay: `${index * 55}ms` }}
            />
            <span className="text-[13px] text-sand lg:text-[13.5px] 2xl:text-[15px]">{feature}</span>
          </div>
        ))}
      </div>

      {/* Price and select link */}
      <div className="mt-7 flex items-baseline justify-between gap-3 md:mt-auto md:pt-7 lg:pt-9">
        <div>
          <span className="font-serif text-2xl text-cream transition-colors duration-[350ms] lg:text-[26px] lg:group-hover:text-gold 2xl:text-[30px]">
            {tier.price}
          </span>
          <span className="text-xs text-muted"> / hour</span>
        </div>
        <Link
          href={BOOKING_HREF}
          className="inline-flex items-center gap-[7px] border-b border-gold/40 pb-[3px] text-[11px] font-semibold tracking-[1.5px] text-gold uppercase hover:text-gold-light lg:text-[11.5px]"
        >
          Select
          <span className="ease-lux hidden -translate-x-1.5 opacity-0 transition-[opacity,translate] duration-[350ms] group-hover:translate-x-0 group-hover:opacity-100 lg:inline-block">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
