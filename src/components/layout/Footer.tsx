import Image from "next/image";
import { SITE_NAME } from "@/config/site";
import { cn } from "@/lib/cn";

type FooterProps = {
  // Destinations page uses a wider column
  wide?: boolean;
};

export default function Footer({ wide = false }: FooterProps) {
  return (
    <footer className="border-t border-cream/8">
      <div
        className={cn(
          "flex flex-col items-center gap-3 px-6 py-7 md:flex-row md:justify-between md:gap-6 md:px-10 lg:mx-auto lg:p-8 2xl:px-12",
          wide ? "lg:max-w-[clamp(1280px,82vw,1640px)]" : "lg:max-w-[clamp(1180px,78vw,1560px)]",
        )}
      >
        <Image src="/images/logo.png" alt={SITE_NAME} width={22} height={22} className="h-5 w-auto opacity-85 lg:h-[22px]" />
        <span className="text-xs text-faint">
          © {new Date().getFullYear()} {SITE_NAME} · Lisbon, Portugal
        </span>
      </div>
    </footer>
  );
}
