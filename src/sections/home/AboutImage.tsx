"use client";

import Image from "next/image";
import type { MouseEvent } from "react";

const frame = "absolute h-[26px] w-[26px] border-gold opacity-0 transition-[opacity,translate] duration-600 ease-lux group-hover:translate-0 group-hover:opacity-100";

// Write the pointer offset to CSS variables (no React re-render per mouse move)
function handleMove(event: MouseEvent<HTMLDivElement>) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  el.style.setProperty("--parallax-x", `${(50 - x) * 0.06}px`);
  el.style.setProperty("--parallax-y", `${(50 - y) * 0.06}px`);
}

function handleLeave(event: MouseEvent<HTMLDivElement>) {
  event.currentTarget.style.setProperty("--parallax-x", "0px");
  event.currentTarget.style.setProperty("--parallax-y", "0px");
}

// Desktop About photo with mouse parallax, corner frame and caption reveal
export default function AboutImage() {
  return (
    <div className="group relative overflow-hidden rounded-[2px]" onMouseMove={handleMove} onMouseLeave={handleLeave}>
      <div className="ease-lux relative aspect-[6/5] w-full transition-[translate,scale,filter] duration-1100 group-hover:brightness-104 group-hover:saturate-108 motion-safe:group-hover:translate-x-(--parallax-x) motion-safe:group-hover:translate-y-(--parallax-y) motion-safe:group-hover:scale-106">
        <Image src="/images/about-lisbon-new.jpg" alt="Praça da Figueira, Lisbon" fill sizes="50vw" className="object-cover" />
      </div>

      {/* Gold corner frame */}
      <span aria-hidden="true" className={`${frame} top-[18px] left-[18px] -translate-2 border-t border-l`} />
      <span aria-hidden="true" className={`${frame} right-[18px] bottom-[18px] translate-2 border-r border-b`} />

      {/* Caption */}
      <div
        aria-hidden="true"
        className="ease-lux absolute inset-x-0 bottom-0 flex translate-y-2.5 items-baseline justify-between gap-3 bg-linear-to-b from-ink/0 to-ink/85 px-6 py-[22px] opacity-0 transition-[opacity,translate] duration-600 group-hover:translate-y-0 group-hover:opacity-100"
      >
        <span className="font-serif text-[17px] text-cream">Praça da Figueira, Lisbon</span>
        <span className="text-[11px] font-semibold tracking-[2px] whitespace-nowrap text-gold uppercase">Golden hour</span>
      </div>
    </div>
  );
}
