import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EyebrowProps = {
  children: ReactNode;
  // "md" heads a section, "sm" labels a field or detail
  size?: "md" | "sm";
  as?: "div" | "span" | "p";
  id?: string;
  className?: string;
};

// Small gold upper-case label shown above headings and next to details
export default function Eyebrow({ children, size = "md", as: Tag = "div", id, className }: EyebrowProps) {
  return (
    <Tag
      id={id}
      className={cn(
        "font-semibold text-gold uppercase",
        size === "md" ? "text-[11px] tracking-[2.5px] lg:tracking-[3px]" : "text-[11px] tracking-[2px]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
