import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import Eyebrow from "./Eyebrow";

type SectionHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  // "small" is used by the About section heading
  size?: "default" | "small";
  titleClassName?: string;
};

// Gold eyebrow label with a serif heading, shared by every home section
export default function SectionHeader({ eyebrow, title, size = "default", titleClassName }: SectionHeaderProps) {
  return (
    <div>
      <Eyebrow className="2xl:text-xs">{eyebrow}</Eyebrow>
      <h2
        className={cn(
          "mt-[14px] font-serif font-medium text-cream md:mt-4 lg:mt-[18px]",
          size === "small"
            ? "text-[30px] leading-[1.25] md:text-[36px] lg:text-[clamp(40px,2.6vw,50px)] lg:leading-[1.2]"
            : "text-[32px] leading-[1.2] md:text-[38px] lg:text-[clamp(44px,2.9vw,56px)] lg:leading-[1.15]",
          titleClassName,
        )}
      >
        {title}
      </h2>
    </div>
  );
}
