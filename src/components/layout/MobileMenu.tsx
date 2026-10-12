"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ButtonLink from "@/components/ui/Button";
import { BOOKING_HREF, navLinks, SITE_NAME } from "@/config/site";
import { cn } from "@/lib/cn";

const MENU_ID = "mobile-menu";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const wasOpen = useRef(false);

  // While open: lock page scroll, close on Escape, and move focus into the menu
  useEffect(() => {
    if (!open) {
      // Return focus to the toggle when the menu closes
      if (wasOpen.current) toggleRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    firstLinkRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      {/* Mobile navigation pill */}
      <header className="pointer-events-none fixed inset-x-0 top-[14px] z-50 flex justify-center">
        <div className="animate-nav-drop-mobile pointer-events-auto relative flex w-[calc(100%-32px)] max-w-[398px] items-center justify-between gap-[10px] rounded-full bg-ink/60 py-2 pr-2 pl-[10px] shadow-[0_14px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.16),inset_0_0_0_1px_rgba(255,255,255,0.07)] backdrop-blur-[28px] backdrop-saturate-[1.8]">
          <Link
            href="/#top"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-charcoal shadow-logo"
          >
            <Image src="/images/logo.png" alt={SITE_NAME} width={22} height={22} className="block h-[22px] w-auto" />
          </Link>

          <ButtonLink href={BOOKING_HREF} variant="light" className="px-[22px] py-[13px] text-[11px]">
            Book Now
          </ButtonLink>

          {/* Menu toggle (two bars turn into a cross) */}
          <button
            ref={toggleRef}
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={MENU_ID}
            onClick={() => setOpen((value) => !value)}
            className="flex h-11 w-11 shrink-0 cursor-pointer flex-col items-center justify-center gap-[5px] rounded-full border-none bg-cream/8"
          >
            <span
              className="ease-lux block h-[1.5px] w-4 bg-cream transition-transform duration-350"
              style={{ transform: open ? "translateY(3.25px) rotate(45deg)" : "none" }}
            />
            <span
              className="ease-lux block h-[1.5px] w-4 bg-cream transition-transform duration-350"
              style={{ transform: open ? "translateY(-3.25px) rotate(-45deg)" : "none" }}
            />
          </button>
        </div>
      </header>

      {/* Full-screen menu overlay (inert while closed so it can't be tabbed into) */}
      <nav
        id={MENU_ID}
        aria-label="Main"
        inert={!open}
        className={cn(
          "fixed inset-0 z-40 flex flex-col justify-center bg-ink/97 px-9 backdrop-blur-[20px] transition-opacity duration-400 ease-[ease]",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {navLinks.map((link, index) => (
          <Link
            key={link.id}
            ref={index === 0 ? firstLinkRef : undefined}
            href={link.href}
            onClick={() => setOpen(false)}
            className="flex items-baseline justify-between border-b border-cream/10 py-[18px] font-serif text-[28px] text-cream hover:text-gold"
          >
            {link.label}
            <span className="font-sans text-[11px] font-semibold tracking-[2px] text-gold">{link.num}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
