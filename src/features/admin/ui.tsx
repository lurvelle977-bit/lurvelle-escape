import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const adminField =
  "w-full rounded-[4px] border border-cream/14 bg-ink/50 px-3 py-2.5 font-sans text-[14px] text-cream outline-none transition-[border-color] focus:border-gold scheme-dark";

export const adminButton = (variant: "gold" | "plain" | "danger" = "gold") =>
  cn(
    "inline-flex cursor-pointer items-center justify-center rounded-full px-5 py-2.5 text-[11px] font-semibold tracking-[1.2px] uppercase transition-colors disabled:cursor-wait disabled:opacity-50",
    variant === "gold" && "bg-gold text-dark hover:bg-gold-light",
    variant === "plain" && "border border-cream/25 text-cream hover:border-gold hover:text-gold",
    variant === "danger" && "border border-[#e8907f]/50 text-[#e8907f] hover:bg-[#e8907f]/10",
  );

export function Panel({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-md bg-charcoal/65 p-5 shadow-form md:p-6", className)}>
      <h2 className="mb-4 text-[11px] font-semibold tracking-[2px] text-gold uppercase">{title}</h2>
      {children}
    </section>
  );
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "border-gold/60 text-gold",
  UNDER_REVIEW: "border-sand/60 text-sand",
  ALTERNATIVE_PROPOSED: "border-sand/60 text-sand",
  QUOTED: "border-sand/60 text-sand",
  QUOTE_ACCEPTED: "border-gold/60 text-gold",
  QUOTE_REJECTED: "border-[#e8907f]/60 text-[#e8907f]",
  PAYMENT_PENDING: "border-gold/60 text-gold",
  PAYMENT_RECEIVED: "border-[#8fcf9d]/60 text-[#8fcf9d]",
  CONFIRMED: "border-[#8fcf9d]/60 text-[#8fcf9d]",
  SCHEDULED: "border-[#8fcf9d]/60 text-[#8fcf9d]",
  CANCELLED: "border-[#e8907f]/60 text-[#e8907f]",
  COMPLETED: "border-cream/40 text-cream",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-block rounded-full border px-3 py-1 text-[10.5px] font-semibold tracking-[1px] whitespace-nowrap uppercase", STATUS_COLOR[status] ?? "border-cream/30 text-cream")}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export const formatDateTime = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Lisbon" });
