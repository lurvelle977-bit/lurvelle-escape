"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { BOOKING_HREF, navLinks } from "@/data/navigation";
import MobileMenu from "./MobileMenu";

type NavbarProps = {
  // Page the navbar is shown on
  page?: "home" | "destinations";
};

export default function Navbar({ page = "home" }: NavbarProps) {
  const [highlight, setHighlight] = useState({ left: 0, width: 0, visible: false });

  // The destinations page hides the About link on desktop
  const links = page === "destinations" ? navLinks.filter((link) => link.id !== "about") : navLinks;

  // Slide the glass highlight under the hovered link
  const handleLinkEnter = (event: MouseEvent<HTMLAnchorElement>) => {
    const link = event.currentTarget;
    setHighlight({ left: link.offsetLeft, width: link.offsetWidth, visible: true });
  };

  return (
    <>
      {/* Desktop navigation pill */}
      <header className="pointer-events-none fixed inset-x-0 top-5 z-50 hidden justify-center lg:flex">
        <div className="animate-nav-drop pointer-events-auto relative flex items-center gap-[10px] overflow-hidden rounded-full bg-[rgba(15,14,11,0.55)] py-2 pr-2 pl-[10px] shadow-[0_18px_50px_rgba(0,0,0,0.5),0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.16),inset_0_0_0_1px_rgba(255,255,255,0.07)] backdrop-blur-[28px] backdrop-saturate-[1.8]">
          <span className="animate-nav-sheen pointer-events-none absolute inset-y-0 left-0 w-[38%] bg-[linear-gradient(105deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.07)_45%,rgba(255,255,255,0)_100%)]" />

          <Link
            href="/#top"
            className="ease-spring relative flex h-11 w-11 items-center justify-center rounded-full bg-charcoal shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_0_0_1px_rgba(198,161,91,0.4)] transition-transform duration-[450ms] hover:scale-[1.08] hover:-rotate-12"
          >
            <Image src="/images/logo.png" alt="Lurvelle Escapes" width={24} height={24} className="block h-6 w-auto" />
          </Link>

          <nav className="relative flex items-center" onMouseLeave={() => setHighlight((h) => ({ ...h, visible: false }))}>
            <span
              className="pointer-events-none absolute inset-y-1 rounded-full bg-[rgba(245,243,234,0.13)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] [transition:left_0.4s_var(--ease-lux),width_0.4s_var(--ease-lux),opacity_0.25s_ease]"
              style={{ left: highlight.left, width: highlight.width, opacity: highlight.visible ? 1 : 0 }}
            />
            {links.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                onMouseEnter={handleLinkEnter}
                className={`relative rounded-full px-[18px] py-3 text-[11.5px] font-semibold tracking-[1.4px] uppercase transition-colors duration-[250ms] hover:text-cream ${
                  link.id === page ? "text-cream" : "text-mist"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href={BOOKING_HREF}
            className="ease-spring relative rounded-full bg-[linear-gradient(180deg,#F6F5EA_0%,#E4E1D0_100%)] px-6 py-[13px] text-[11.5px] font-bold tracking-[1.15px] text-charcoal uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_14px_rgba(0,0,0,0.35)] transition-[transform,box-shadow] duration-[350ms] hover:scale-105 hover:text-charcoal hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_20px_rgba(0,0,0,0.45)]"
          >
            Book Now
          </Link>
        </div>
      </header>

      {/* Mobile navigation pill and menu */}
      <MobileMenu />
    </>
  );
}
