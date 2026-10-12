import { budgets, regions } from "@/data/destinations";
import type { Region } from "@/types";

type DestinationFiltersProps = {
  region: Region;
  budgetIndex: number;
  onRegionChange: (region: Region) => void;
  onBudgetChange: (index: number) => void;
};

// Pill-shaped filter button
function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full border px-[14px] py-2 font-sans text-[11px] font-semibold tracking-[1.4px] uppercase [transition:color_0.25s,border-color_0.25s,background_0.25s] ${
        on
          ? "border-gold bg-gold text-dark"
          : "border-cream/14 bg-transparent text-muted hover:border-cream/35 hover:text-cream"
      }`}
    >
      {label}
    </button>
  );
}

// Region and budget filter rows
export default function DestinationFilters({ region, budgetIndex, onRegionChange, onBudgetChange }: DestinationFiltersProps) {
  return (
    <div className="mt-8 flex flex-col gap-4">
      <div className="grid grid-cols-[64px_1fr] items-center gap-3">
        <span className="text-[10.5px] font-semibold tracking-[2px] text-gold uppercase">Region</span>
        <div className="flex flex-wrap gap-2">
          {regions.map((r) => (
            <Chip key={r} label={r} on={r === region} onClick={() => onRegionChange(r)} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[64px_1fr] items-center gap-3">
        <span className="text-[10.5px] font-semibold tracking-[2px] text-gold uppercase">Budget</span>
        <div className="flex flex-wrap gap-2">
          {budgets.map((budget, index) => (
            <Chip key={budget.label} label={budget.label} on={index === budgetIndex} onClick={() => onBudgetChange(index)} />
          ))}
        </div>
      </div>
    </div>
  );
}
