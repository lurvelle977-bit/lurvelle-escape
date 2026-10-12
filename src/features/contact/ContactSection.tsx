import SectionHeader from "@/components/ui/SectionHeader";
import { contactItems } from "@/config/site";
import ContactForm from "./ContactForm";

// Contact section: on mobile the form comes before the details, from tablet up they sit side by side
export default function ContactSection() {
  return (
    <section id="contact" className="pt-[100px] lg:pt-[150px]">
      <div className="site-container grid pb-20 md:grid-cols-[1fr_1.3fr] md:items-start md:gap-x-10 md:pb-[90px] lg:grid-cols-[1fr_1.2fr] lg:gap-x-20 lg:pb-[110px]">
        <div>
          <SectionHeader
            eyebrow="05 — Contact"
            title={
              <>
                <span className="md:hidden">Plan your escape</span>
                <span className="hidden md:inline">Get in touch</span>
              </>
            }
          />
          <p className="mt-4 max-w-[340px] text-sm leading-[1.8] text-pretty text-muted md:mt-[22px] md:text-[14.5px] 2xl:max-w-[400px] 2xl:text-base">
            Tell us where you&apos;d like to go — we reply within a few hours, every day of the week.
          </p>
        </div>

        <div className="md:col-start-2 md:row-span-2 md:row-start-1">
          <ContactForm />
        </div>

        {/* Phone, email, address and hours */}
        <ul className="mt-[52px] flex flex-col gap-[22px] border-t border-cream/10 pt-9 md:mt-10 md:border-t-0 md:pt-0 lg:mt-12 lg:gap-[26px]">
          {contactItems.map(({ label, value, href, icon: Icon }) => {
            const content = (
              <>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/45 transition-[background-color,border-color] duration-300 group-hover:border-gold group-hover:bg-gold/12">
                  <Icon size={17} strokeWidth={1.6} aria-hidden="true" className="text-gold" />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold tracking-[2px] text-gold uppercase">{label}</span>
                  <span className="text-[14px] text-cream lg:text-[15px] 2xl:text-base">{value}</span>
                </span>
              </>
            );
            return (
              <li key={label}>
                {href ? (
                  <a href={href} className="group flex items-center gap-[18px] text-inherit hover:text-inherit">
                    {content}
                  </a>
                ) : (
                  <div className="flex items-center gap-[18px]">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
