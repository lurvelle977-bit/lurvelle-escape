"use client";

import { useState, type FormEvent } from "react";
import { desktopFormFields, MESSAGE_MAX_LENGTH } from "@/data/contact";

// How long the "Message sent" confirmation stays visible
const SENT_DURATION_MS = 2600;

const idleBorder = "rgba(245,243,234,0.14)";
const filledBorder = "rgba(198,161,91,0.5)";
const focusGlow = "0 0 0 3px rgba(198,161,91,0.15)";

// Desktop contact form with focus glow, filled checkmarks and animated send button
export default function ContactForm() {
  const [focused, setFocused] = useState("");
  const [filled, setFilled] = useState<Record<string, boolean>>({});
  const [messageLength, setMessageLength] = useState(0);
  const [sendHover, setSendHover] = useState(false);
  const [sent, setSent] = useState(false);

  // Handle form submission (shows a confirmation, no backend yet)
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sent) return;
    setSent(true);
    setTimeout(() => setSent(false), SENT_DURATION_MS);
  };

  const messageFocused = focused === "message";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md bg-[rgba(26,24,18,0.65)] px-7 pt-8 pb-7 lg:px-11 lg:pt-11 lg:pb-10 shadow-[inset_0_0_0_1px_rgba(198,161,91,0.18),0_30px_80px_rgba(0,0,0,0.4)]"
    >
      <div className="flex flex-col gap-[18px]">
        {/* Name, email and phone inputs */}
        {desktopFormFields.map((field) => {
          const isFocused = focused === field.name;
          const isFilled = !!filled[field.name];
          return (
            <div key={field.name} className="relative">
              <input
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                aria-label={field.placeholder}
                onFocus={() => setFocused(field.name)}
                onBlur={() => setFocused("")}
                onChange={(event) => setFilled((f) => ({ ...f, [field.name]: event.target.value.trim().length > 1 }))}
                className="w-full rounded-[4px] border bg-[rgba(15,14,11,0.5)] px-[18px] py-4 text-[14.5px] text-cream outline-none [transition:border-color_0.3s,box-shadow_0.3s]"
                style={{
                  borderColor: isFocused ? "#C6A15B" : isFilled ? filledBorder : idleBorder,
                  boxShadow: isFocused ? focusGlow : "none",
                }}
              />
              <span
                className="absolute top-1/2 right-4 text-[13px] text-gold [transition:opacity_0.3s,transform_0.35s_var(--ease-spring)]"
                style={{ opacity: isFilled ? 1 : 0, transform: `translateY(-50%) scale(${isFilled ? 1 : 0.4})` }}
              >
                ✓
              </span>
            </div>
          );
        })}

        {/* Message with character counter */}
        <div className="relative">
          <textarea
            name="message"
            rows={4}
            maxLength={MESSAGE_MAX_LENGTH}
            placeholder="Your message — where would you like to go?"
            aria-label="Your message"
            onFocus={() => setFocused("message")}
            onBlur={() => setFocused("")}
            onChange={(event) => setMessageLength(event.target.value.length)}
            className="block w-full resize-none rounded-[4px] border bg-[rgba(15,14,11,0.5)] px-[18px] py-4 font-sans text-[14.5px] text-cream outline-none [transition:border-color_0.3s,box-shadow_0.3s]"
            style={{
              borderColor: messageFocused ? "#C6A15B" : messageLength > 0 ? filledBorder : idleBorder,
              boxShadow: messageFocused ? focusGlow : "none",
            }}
          />
          <span className="absolute right-4 bottom-[14px] text-[11px] text-faint">
            {messageLength > 0 ? `${messageLength} / ${MESSAGE_MAX_LENGTH}` : ""}
          </span>
        </div>

        {/* Send button with shine sweep */}
        <button
          type="submit"
          onMouseEnter={() => setSendHover(true)}
          onMouseLeave={() => setSendHover(false)}
          className="relative mt-1.5 cursor-pointer overflow-hidden rounded-[4px] border-none bg-[linear-gradient(180deg,#DCBD82_0%,#C6A15B_100%)] py-[18px] font-sans text-xs font-bold tracking-[2px] text-dark uppercase [transition:transform_0.3s_var(--ease-lux),box-shadow_0.3s]"
          style={{
            transform: sent ? "scale(0.98)" : sendHover ? "translateY(-2px)" : "translateY(0)",
            boxShadow: sendHover && !sent ? "0 14px 34px rgba(198,161,91,0.35)" : "0 6px 18px rgba(0,0,0,0.3)",
          }}
        >
          <span className="relative z-[1]">{sent ? "Message sent ✓" : "Send message"}</span>
          <span
            className="absolute inset-y-0 left-[-40%] w-[40%] bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.45)_50%,transparent_100%)] transition-transform duration-700 ease-[ease]"
            style={{ transform: sendHover ? "translateX(350%)" : "translateX(0)" }}
          />
        </button>
      </div>
    </form>
  );
}
