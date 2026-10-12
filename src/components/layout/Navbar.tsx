"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import ButtonLink from "@/components/ui/Button";
import { BOOKING_HREF, navLinks, SITE_NAME } from "@/config/site";
import { cn } from "@/lib/cn";
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
        <div className="animate-nav-drop pointer-events-auto relative flex items-center gap-[10px] overflow-hidden rounded-full bg-ink/55 py-2 pr-2 pl-[10px] shadow-[0_18px_50px_rgba(0,0,0,0.5),0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.16),inset_0_0_0_1px_rgba(255,255,255,0.07)] backdrop-blur-[28px] backdrop-saturate-[1.8]">
          <span className="animate-nav-sheen pointer-events-none absolute inset-y-0 left-0 w-[38%] bg-linear-[105deg] from-white/0 via-white/7 via-45% to-white/0" />

          <Link
            href="/#top"
            className="ease-spring relative flex h-11 w-11 items-center justify-center rounded-full bg-charcoal shadow-logo transition-transform duration-450 hover:scale-[1.08] hover:-rotate-12"
          >
            <Image src="/images/logo.png" alt={SITE_NAME} width={24} height={24} className="block h-6 w-auto" />
          </Link>

          <nav
            aria-label="Main"
            className="relative flex items-center"
            onMouseLeave={() => setHighlight((h) => ({ ...h, visible: false }))}
          >
            <span
              className="ease-lux pointer-events-none absolute inset-y-1 rounded-full bg-cream/13 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-[left,width,opacity] duration-400"
              style={{ left: highlight.left, width: highlight.width, opacity: highlight.visible ? 1 : 0 }}
            />
            {links.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                aria-current={link.id === page ? "page" : undefined}
                onMouseEnter={handleLinkEnter}
                className={cn(
                  "relative rounded-full px-[18px] py-3 text-[11.5px] font-semibold tracking-[1.4px] uppercase transition-colors duration-250 hover:text-cream",
                  link.id === page ? "text-cream" : "text-mist",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <ButtonLink
            href={BOOKING_HREF}
            variant="light"
            className="ease-spring relative px-6 py-[13px] text-[11.5px] tracking-[1.15px] hover:scale-105 hover:shadow-pill-hover"
          >
            Book Now
          </ButtonLink>
        </div>
      </header>

      {/* Mobile navigation pill and menu */}
      <MobileMenu />
    </>
  );
}
