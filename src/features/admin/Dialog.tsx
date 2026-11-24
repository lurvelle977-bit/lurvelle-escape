"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

// Accessible overlay for the admin: a centred modal or a right-side drawer. Closes on Escape and backdrop click,
// moves focus into the panel and gives it back on close.
export default function Dialog({ title, onClose, variant = "modal", children }: { title: string; onClose: () => void; variant?: "modal" | "drawer"; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  // Keep the latest onClose without re-running the effect (which would steal focus on every render)
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  return createPortal(
    <div className={cn("fixed inset-0 z-50 flex bg-ink/80", variant === "drawer" ? "justify-end" : "items-center justify-center p-4")} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "overflow-y-auto bg-charcoal text-sand shadow-form outline-none",
          variant === "drawer" ? "h-full w-full max-w-[460px] border-l border-cream/10 p-6" : "w-full max-w-[440px] rounded-md border border-cream/10 p-6",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-[11px] font-semibold tracking-[2px] text-gold uppercase">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mt-1 cursor-pointer text-[20px] leading-none text-muted hover:text-gold">×</button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
