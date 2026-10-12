import SectionHeader from "@/components/ui/SectionHeader";
import { contactItems, EMAIL, EMAIL_HREF, PHONE, PHONE_HREF } from "@/data/contact";
import ContactForm from "./ContactForm";
import ContactIcon from "./ContactIcon";
import MobileContactForm from "./MobileContactForm";

export default function Contact() {
  return (
    <section id="contact" className="pt-[100px] lg:pt-[150px]">
      {/* Desktop layout: details on the left, form card on the right */}
      <div className="site-container hidden pb-[90px] md:grid md:grid-cols-[1fr_1.3fr] md:items-start md:gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-20 lg:pb-[110px]">
        <div>
          <SectionHeader eyebrow="05 — Contact" title="Get in touch" />
          <p className="mt-[22px] max-w-[340px] text-[14.5px] leading-[1.8] text-pretty text-muted 2xl:max-w-[400px] 2xl:text-base">
            We are here to help you plan your perfect trip.
          </p>
          <div className="mt-10 flex flex-col gap-[22px] lg:mt-12 lg:gap-[26px]">
            {contactItems.map((item) => (
              <a key={item.label} href={item.href} className="flex items-center gap-[18px] text-inherit hover:text-inherit">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/45 [transition:background_0.3s,border-color_0.3s] hover:border-gold hover:bg-gold/12">
                  <ContactIcon name={item.icon} />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-[10.5px] font-semibold tracking-[2px] text-gold uppercase">{item.label}</span>
                  <span className="text-[14px] text-cream lg:text-[15px] 2xl:text-base">{item.value}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
        <ContactForm />
      </div>

      {/* Mobile layout: form first, then contact details */}
      <div className="px-6 pb-20 md:hidden">
        <SectionHeader eyebrow="05 — Contact" title="Plan your escape" />
        <p className="mt-4 text-sm leading-[1.8] text-pretty text-muted">
          Tell us where you&apos;d like to go — we reply within a few hours, every day of the week.
        </p>
        <MobileContactForm />
        <div className="mt-[52px] flex flex-col gap-[14px] border-t border-cream/10 pt-9">
          <a href={PHONE_HREF} className="text-[15px] text-cream hover:text-gold">
            {PHONE}
          </a>
          <a href={EMAIL_HREF} className="text-[15px] text-cream hover:text-gold">
            {EMAIL}
          </a>
          <span className="text-[13.5px] text-muted">Lisbon, Portugal · 24/7 support</span>
        </div>
      </div>
    </section>
  );
}
