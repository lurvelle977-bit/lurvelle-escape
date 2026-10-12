"use client";

import Image from "next/image";
import { useState, type MouseEvent } from "react";

// Desktop About photo with mouse parallax, corner frame and caption reveal
export default function AboutImage() {
  const [hover, setHover] = useState({ on: false, x: 50, y: 50 });

  // Track the pointer position as a percentage of the image
  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHover({
      on: true,
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  const { on, x, y } = hover;
  const imageTransform = on ? `scale(1.06) translate(${(50 - x) * 0.06}px, ${(50 - y) * 0.06}px)` : "scale(1) translate(0,0)";
  const frameTransition = "opacity 0.5s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)";

  return (
    <div
      className="relative cursor-pointer overflow-hidden rounded-[2px]"
      onMouseEnter={() => setHover((h) => ({ ...h, on: true }))}
      onMouseLeave={() => setHover({ on: false, x: 50, y: 50 })}
      onMouseMove={handleMove}
    >
      <div
        className="relative aspect-[6/5] w-full"
        style={{
          transform: imageTransform,
          filter: on ? "saturate(1.08) brightness(1.04)" : "saturate(1) brightness(1)",
          transition: "transform 1.1s cubic-bezier(0.22,1,0.36,1), filter 0.7s ease",
        }}
      >
        <Image
          src="/images/about-lisbon-new.png"
          alt="Praça da Figueira, Lisbon"
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {/* Gold corner frame */}
      <span
        className="absolute top-[18px] left-[18px] h-[26px] w-[26px] border-t border-l border-gold"
        style={{ opacity: on ? 1 : 0, transform: on ? "translate(0,0)" : "translate(-8px,-8px)", transition: frameTransition }}
      />
      <span
        className="absolute right-[18px] bottom-[18px] h-[26px] w-[26px] border-r border-b border-gold"
        style={{ opacity: on ? 1 : 0, transform: on ? "translate(0,0)" : "translate(8px,8px)", transition: frameTransition }}
      />

      {/* Caption */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-baseline justify-between gap-3 bg-[linear-gradient(180deg,rgba(15,14,11,0)_0%,rgba(15,14,11,0.85)_100%)] px-6 py-[22px]"
        style={{ opacity: on ? 1 : 0, transform: on ? "translateY(0)" : "translateY(10px)", transition: frameTransition }}
      >
        <span className="font-serif text-[17px] text-cream">Praça da Figueira, Lisbon</span>
        <span className="text-[10.5px] font-semibold tracking-[2px] whitespace-nowrap text-gold uppercase">Golden hour</span>
      </div>
    </div>
  );
}
