import Image from "next/image";
import SectionHeader from "@/components/ui/SectionHeader";
import { aboutText, stats } from "@/content/about";
import AboutImage from "./AboutImage";

export default function About() {
  return (
    <section id="about" className="pt-[100px] lg:pt-[150px]">
      <div className="site-container md:grid md:grid-cols-2 md:items-center md:gap-10 lg:gap-20">
        {/* Desktop interactive photo */}
        <div className="hidden lg:block">
          <AboutImage />
        </div>

        {/* Mobile photo */}
        <div className="overflow-hidden rounded-[2px] lg:hidden">
          <div className="relative h-[260px] md:h-[440px]">
            <Image src="/images/about-lisbon.jpg" alt="Lisbon" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
        </div>

        {/* Text and statistics */}
        <div className="mt-9 md:mt-0">
          <SectionHeader eyebrow="04 — About" title="A quieter way to see Portugal" size="small" />
          <p className="mt-[18px] text-[14.5px] leading-[1.85] text-pretty text-sand lg:mt-6 lg:max-w-[440px] lg:text-[15px] 2xl:max-w-[520px] 2xl:text-base">
            {aboutText}
          </p>
          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-7 lg:mt-12 lg:max-w-[400px] lg:gap-x-12 lg:gap-y-8 2xl:max-w-[460px]">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="mt-1 text-[11px] font-semibold tracking-[1.8px] text-muted uppercase lg:tracking-[2px]">{stat.label}</dt>
                <dd className="font-serif text-[30px] text-gold lg:text-[34px] 2xl:text-[40px]">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
