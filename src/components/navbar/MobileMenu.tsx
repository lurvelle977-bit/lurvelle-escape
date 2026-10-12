"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BOOKING_HREF, navLinks } from "@/data/navigation";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {/* Mobile navigation pill */}
      <header className="pointer-events-none fixed inset-x-0 top-[14px] z-50 flex justify-center">
        <div className="animate-nav-drop-mobile pointer-events-auto relative flex w-[calc(100%-32px)] max-w-[398px] items-center justify-between gap-[10px] rounded-full bg-[rgba(15,14,11,0.6)] py-2 pr-2 pl-[10px] shadow-[0_14px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.16),inset_0_0_0_1px_rgba(255,255,255,0.07)] backdrop-blur-[28px] backdrop-saturate-[1.8]">
          <Link
            href="/#top"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-charcoal shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_0_0_1px_rgba(198,161,91,0.4)]"
          >
            <Image src="/images/logo.png" alt="Lurvelle Escapes" width={22} height={22} className="block h-[22px] w-auto" />
          </Link>

          <Link
            href={BOOKING_HREF}
            className="rounded-full bg-[linear-gradient(180deg,#F6F5EA_0%,#E4E1D0_100%)] px-[22px] py-[13px] text-[11px] font-bold tracking-[1.1px] text-charcoal uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_14px_rgba(0,0,0,0.35)] hover:text-charcoal"
          >
            Book Now
          </Link>

          {/* Menu toggle (two bars turn into a cross) */}
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="flex h-11 w-11 shrink-0 cursor-pointer flex-col items-center justify-center gap-[5px] rounded-full border-none bg-[rgba(245,243,234,0.08)]"
          >
            <span
              className="ease-lux block h-[1.5px] w-4 bg-cream transition-transform duration-[350ms]"
              style={{ transform: open ? "translateY(3.25px) rotate(45deg)" : "none" }}
            />
            <span
              className="ease-lux block h-[1.5px] w-4 bg-cream transition-transform duration-[350ms]"
              style={{ transform: open ? "translateY(-3.25px) rotate(-45deg)" : "none" }}
            />
          </button>
        </div>
      </header>

      {/* Full-screen menu overlay */}
      <div
        className={`fixed inset-0 z-40 flex flex-col justify-center bg-[rgba(15,14,11,0.97)] px-9 backdrop-blur-[20px] transition-opacity duration-[400ms] ease-[ease] ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {navLinks.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
            className="flex items-baseline justify-between border-b border-cream/10 py-[18px] font-serif text-[28px] text-cream hover:text-gold"
          >
            {link.label}
            <span className="font-sans text-[11px] font-semibold tracking-[2px] text-gold">{link.num}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
