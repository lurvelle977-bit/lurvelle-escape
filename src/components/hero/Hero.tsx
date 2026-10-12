import Image from "next/image";
import Link from "next/link";
import { BOOKING_HREF } from "@/data/navigation";

export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] items-end overflow-hidden lg:min-h-[92vh]">
      {/* Background photo */}
      <Image
        src="/images/hero-bg.png"
        alt=""
        fill
        preload
        sizes="100vw"
        className="object-cover object-[center_35%]"
      />

      {/* Dark gradient overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,14,11,0.5)_0%,rgba(15,14,11,0.2)_40%,rgba(15,14,11,0.95)_100%)] lg:bg-[linear-gradient(180deg,rgba(15,14,11,0.35)_0%,rgba(15,14,11,0.15)_40%,rgba(15,14,11,0.92)_100%)]" />
      <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(15,14,11,0.8)_0%,rgba(15,14,11,0.45)_40%,rgba(15,14,11,0)_75%)] lg:block" />

      {/* Hero content */}
      <div className="animate-rise-in site-container relative w-full pb-14 md:pb-20 lg:pb-24 2xl:pb-28">
        <div className="text-[11px] font-semibold tracking-[2.5px] text-gold uppercase lg:text-xs lg:tracking-[3px]">
          Private chauffeur &amp; tours — Lisbon
        </div>
        <h1 className="mt-4 font-serif text-[44px] leading-[1.1] font-medium tracking-[-0.5px] text-cream md:mt-5 md:text-[60px] md:leading-[1.08] lg:text-[clamp(72px,4.6vw,96px)] lg:leading-[1.08]">
          Discover Lisbon,
          <br />
          <em className="font-normal text-gold">your way.</em>
        </h1>

        <div className="mt-5 md:mt-7 lg:mt-9 lg:flex lg:items-end lg:justify-between lg:gap-10">
          <p className="max-w-[320px] text-[15px] leading-[1.75] text-pretty text-sand md:max-w-[420px] md:text-base lg:max-w-[400px] 2xl:max-w-[460px] 2xl:text-lg">
            Private tours and executive transfers with professional drivers — quiet comfort from door to door.
          </p>

          {/* Call-to-action buttons */}
          <div className="mt-8 flex flex-col gap-[18px] md:flex-row md:items-center md:gap-7 lg:mt-0 lg:shrink-0">
            <Link
              href="/#experiences"
              className="block rounded-full bg-gold px-8 py-[17px] text-center text-xs font-semibold tracking-[1.5px] text-dark uppercase transition-colors duration-[250ms] hover:bg-gold-light hover:text-dark md:py-4"
            >
              Explore experiences
            </Link>
            <Link
              href={BOOKING_HREF}
              className="p-[6px] text-center text-xs font-semibold tracking-[1.5px] text-cream uppercase hover:text-gold md:border-b md:border-cream/35 md:p-0 md:pb-1 md:hover:border-gold/70"
            >
              Book a private car
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
