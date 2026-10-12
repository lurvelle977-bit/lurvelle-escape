import { trustPoints } from "@/data/experiences";

// Trust points repeated twice so the marquee loops seamlessly
const marqueeItems = [...trustPoints, ...trustPoints];

export default function TrustBar() {
  return (
    <>
      {/* Desktop scrolling marquee */}
      <div className="relative hidden overflow-hidden border-b border-cream/8 py-7 lg:block">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[120px] bg-[linear-gradient(90deg,#0F0E0B_0%,transparent_100%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-[120px] bg-[linear-gradient(270deg,#0F0E0B_0%,transparent_100%)]" />
        <div className="animate-trust-scroll flex w-max">
          {marqueeItems.map((point, index) => (
            <span
              key={`${point}-${index}`}
              className="inline-flex items-center gap-7 pr-7 text-[11px] font-semibold tracking-[2px] whitespace-nowrap text-muted uppercase"
            >
              {point}
              <span className="h-1 w-1 shrink-0 rounded-full bg-gold" />
            </span>
          ))}
        </div>
      </div>

      {/* Mobile two-column list */}
      <div className="grid grid-cols-2 gap-x-5 gap-y-[14px] border-b border-cream/8 p-6 md:grid-cols-4 md:px-10 md:py-7 lg:hidden">
        {trustPoints.map((point) => (
          <span key={point} className="text-[10.5px] font-semibold tracking-[1.8px] text-muted uppercase">
            {point}
          </span>
        ))}
      </div>
    </>
  );
}
