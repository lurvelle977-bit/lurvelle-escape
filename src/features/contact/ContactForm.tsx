"use client";

import { Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formFields, MESSAGE_MAX_LENGTH } from "./fields";

// How long the "Message sent" confirmation stays visible
const SENT_DURATION_MS = 2600;

// Underlined fields on mobile, boxed fields with a focus glow from tablet up
const fieldClasses =
  "peer w-full border-0 border-b border-cream/20 bg-transparent py-[13px] font-sans text-[15px] text-cream outline-none transition-[border-color,box-shadow] duration-300 focus:border-gold md:rounded-[4px] md:border md:border-cream/14 md:bg-ink/50 md:px-[18px] md:py-4 md:text-[14.5px] md:not-placeholder-shown:border-gold/50 md:focus:border-gold md:focus:ring-3 md:focus:ring-gold/15";

// Contact form with native validation, filled checkmarks and an animated send button
export default function ContactForm() {
  const [messageLength, setMessageLength] = useState(0);
  const [sent, setSent] = useState(false);

  // TODO: wire a backend — for now this only shows a confirmation
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sent) return;
    setSent(true);
    setTimeout(() => setSent(false), SENT_DURATION_MS);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 md:mt-0 md:rounded-md md:bg-charcoal/65 md:px-7 md:pt-8 md:pb-7 md:shadow-form lg:px-11 lg:pt-11 lg:pb-10"
    >
      <div className="flex flex-col gap-[26px] md:gap-[18px]">
        {/* Single-line inputs */}
        {formFields.map((field) => (
          <div key={field.name} className="relative">
            <label htmlFor={`contact-${field.name}`} className="sr-only">
              {field.label}
            </label>
            <input
              id={`contact-${field.name}`}
              name={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              required={field.required}
              placeholder={field.label}
              className={fieldClasses}
            />
            <Check
              size={14}
              aria-hidden="true"
              className="ease-spring absolute top-1/2 right-4 hidden -translate-y-1/2 scale-40 text-gold opacity-0 transition-[opacity,scale] duration-300 peer-not-placeholder-shown:scale-100 peer-not-placeholder-shown:opacity-100 md:block"
            />
          </div>
        ))}

        {/* Message with character counter */}
        <div className="relative">
          <label htmlFor="contact-message" className="sr-only">
            Your message
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={4}
            maxLength={MESSAGE_MAX_LENGTH}
            placeholder="Where would you like to go?"
            onChange={(event) => setMessageLength(event.target.value.length)}
            className={cn(fieldClasses, "block resize-none")}
          />
          <span aria-hidden="true" className="absolute right-4 bottom-[14px] hidden text-[11px] text-faint md:block">
            {messageLength > 0 ? `${messageLength} / ${MESSAGE_MAX_LENGTH}` : ""}
          </span>
        </div>

        {/* Send button with shine sweep */}
        <button
          type="submit"
          className={buttonClasses(
            "gold",
            cn(
              "group ease-lux relative mt-2 overflow-hidden px-9 py-[17px] transition-[translate,scale,box-shadow,background-color] md:mt-1.5 md:rounded-[4px] md:bg-linear-to-b md:from-gold-light md:to-gold md:py-[18px] md:font-bold md:tracking-[2px] md:shadow-[0_6px_18px_rgba(0,0,0,0.3)]",
              sent ? "scale-98" : "md:hover:-translate-y-0.5 md:hover:shadow-[0_14px_34px] md:hover:shadow-gold/35",
            ),
          )}
        >
          <span className="relative z-[1]" aria-live="polite">
            {sent ? "Message sent ✓" : "Send message"}
          </span>
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-[-40%] hidden w-[40%] bg-linear-[105deg] from-transparent via-white/45 to-transparent transition-transform duration-700 group-hover:translate-x-[350%] md:block"
          />
        </button>
      </div>
    </form>
  );
}
