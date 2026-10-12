import Link from "next/link";
import { mobileFormFields } from "@/data/contact";

const underlineInput =
  "border-0 border-b border-cream/20 bg-transparent py-[13px] text-[15px] text-cream outline-none focus:border-gold";

// Mobile contact form with underlined fields
export default function MobileContactForm() {
  return (
    <div className="mt-10 flex flex-col gap-[26px]">
      {mobileFormFields.map((field) => (
        <input
          key={field.name}
          name={field.name}
          type={field.type}
          placeholder={field.placeholder}
          aria-label={field.placeholder}
          className={underlineInput}
        />
      ))}
      <textarea
        name="message"
        rows={3}
        placeholder="Where would you like to go?"
        aria-label="Where would you like to go?"
        className={`resize-none ${underlineInput}`}
      />
      <Link
        href="#contact"
        className="mt-2 block rounded-full bg-gold px-9 py-[17px] text-center text-xs font-semibold tracking-[1.5px] text-dark uppercase hover:bg-gold-light hover:text-dark"
      >
        Send message
      </Link>
    </div>
  );
}
