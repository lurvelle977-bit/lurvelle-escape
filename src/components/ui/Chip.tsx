import { cn } from "@/lib/cn";

type ChipProps = {
  label: string;
  on: boolean;
  onClick: () => void;
};

// Pill-shaped toggle button used by the filters
export default function Chip({ label, on, onClick }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full border px-[14px] py-2 font-sans text-[11px] font-semibold tracking-[1.4px] uppercase transition-[color,border-color,background-color] duration-250",
        on ? "border-gold bg-gold text-dark" : "border-cream/14 bg-transparent text-muted hover:border-cream/35 hover:text-cream",
      )}
    >
      {label}
    </button>
  );
}
