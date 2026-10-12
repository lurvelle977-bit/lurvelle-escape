import Image from "next/image";
import Link from "next/link";
import ButtonLink from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import { BOOKING_HREF, SITE_TAGLINE } from "@/config/site";

export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] items-end overflow-hidden lg:min-h-[92vh]">
      {/* Background photo */}
      <Image
        src="/images/hero-bg.jpg"
        alt=""
        fill
        preload
        sizes="100vw"
        className="object-cover object-[center_35%]"
      />

      {/* Dark gradient overlays */}
      <div className="absolute inset-0 bg-linear-to-b from-ink/50 via-ink/20 via-40% to-ink/95 lg:from-ink/35 lg:via-ink/15 lg:to-ink/92" />
      <div className="absolute inset-0 hidden bg-linear-to-r from-ink/80 via-ink/45 via-40% to-ink/0 to-75% lg:block" />

      {/* Hero content */}
      <div className="animate-rise-in site-container relative w-full pb-14 md:pb-20 lg:pb-24 2xl:pb-28">
        <Eyebrow className="lg:text-xs">Private chauffeur &amp; tours — Lisbon</Eyebrow>
        <h1 className="mt-4 font-serif text-[44px] leading-[1.1] font-medium tracking-[-0.5px] text-cream md:mt-5 md:text-[60px] md:leading-[1.08] lg:text-[clamp(72px,4.6vw,96px)] lg:leading-[1.08]">
          Discover Lisbon,
          <br />
          <em className="font-normal text-gold">your way.</em>
        </h1>

        <div className="mt-5 md:mt-7 lg:mt-9 lg:flex lg:items-end lg:justify-between lg:gap-10">
          <p className="max-w-[320px] text-[15px] leading-[1.75] text-pretty text-sand md:max-w-[420px] md:text-base lg:max-w-[400px] 2xl:max-w-[460px] 2xl:text-lg">
            {SITE_TAGLINE}
          </p>

          {/* Call-to-action buttons */}
          <div className="mt-8 flex flex-col gap-[18px] md:flex-row md:items-center md:gap-7 lg:mt-0 lg:shrink-0">
            <ButtonLink href="/#experiences" className="px-8 py-[17px] md:py-4">
              Explore experiences
            </ButtonLink>
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
