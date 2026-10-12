import Chip from "@/components/ui/Chip";
import Eyebrow from "@/components/ui/Eyebrow";
import { budgets, regions, type RegionFilter } from "./data/filters";

type DestinationFiltersProps = {
  region: RegionFilter;
  budgetIndex: number;
  onRegionChange: (region: RegionFilter) => void;
  onBudgetChange: (index: number) => void;
};

// Region and budget filter rows
export default function DestinationFilters({ region, budgetIndex, onRegionChange, onBudgetChange }: DestinationFiltersProps) {
  return (
    <div className="mt-8 flex flex-col gap-4">
      <div role="group" aria-labelledby="filter-region" className="grid grid-cols-[64px_1fr] items-center gap-3">
        <Eyebrow id="filter-region" as="span" size="sm">
          Region
        </Eyebrow>
        <div className="flex flex-wrap gap-2">
          {regions.map((r) => (
            <Chip key={r} label={r} on={r === region} onClick={() => onRegionChange(r)} />
          ))}
        </div>
      </div>
      <div role="group" aria-labelledby="filter-budget" className="grid grid-cols-[64px_1fr] items-center gap-3">
        <Eyebrow id="filter-budget" as="span" size="sm">
          Budget
        </Eyebrow>
        <div className="flex flex-wrap gap-2">
          {budgets.map((budget, index) => (
            <Chip key={budget.label} label={budget.label} on={index === budgetIndex} onClick={() => onBudgetChange(index)} />
          ))}
        </div>
      </div>
    </div>
  );
}
