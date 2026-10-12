import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "gold" | "light";

const variants: Record<Variant, string> = {
  // Solid gold call to action
  gold: "bg-gold font-semibold tracking-[1.5px] text-dark hover:bg-gold-light hover:text-dark",
  // Pale glossy pill used for "Book Now" in the navigation
  light: "bg-linear-to-b from-pearl to-pearl-shade font-bold tracking-[1.1px] text-charcoal shadow-pill hover:text-charcoal",
};

// Shared classes so <button> elements can match the link styling
export function buttonClasses(variant: Variant = "gold", className?: string) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center rounded-full text-center text-xs uppercase transition-[color,background-color,transform,box-shadow] duration-300",
    variants[variant],
    className,
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant };

// Pill-shaped call-to-action link
export default function ButtonLink({ variant = "gold", className, ...props }: ButtonLinkProps) {
  return <Link {...props} className={buttonClasses(variant, className)} />;
}
