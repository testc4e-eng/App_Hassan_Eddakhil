import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function FilterField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

export type CompareScenarioOption = {
  run_id: number;
  scenario_name: string;
  disabled?: boolean;
};

function resolveCompareScenariosLabel(
  selected: CompareScenarioOption[],
  placeholder: string
): string {
  if (!selected.length) return placeholder;
  if (selected.length === 1) return selected[0].scenario_name;
  if (selected.length === 2) {
    const joined = selected.map((item) => item.scenario_name).join(", ");
    if (joined.length <= 42) return joined;
    return "2 scénarios sélectionnés";
  }
  return `${selected.length} scénarios sélectionnés`;
}

export function CompareScenariosMultiSelect({
  options,
  selectedIds,
  onToggle,
  className,
  placeholder = "Choisir des scénarios",
}: {
  options: CompareScenarioOption[];
  selectedIds: number[];
  onToggle: (runId: number) => void;
  className?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedOptions = useMemo(
    () => options.filter((option) => selectedIds.includes(option.run_id)),
    [options, selectedIds]
  );

  const displayLabel = useMemo(
    () => resolveCompareScenariosLabel(selectedOptions, placeholder),
    [placeholder, selectedOptions]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Scénarios à comparer"
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            !selectedOptions.length && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate text-left">{displayLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-2"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {options.map((run) => {
            const checked = selectedIds.includes(run.run_id);
            const disabled = Boolean(run.disabled);

            return (
              <label
                key={`compare-scenario-${run.run_id}`}
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <Checkbox
                  className="mt-0.5"
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={() => {
                    if (!disabled) onToggle(run.run_id);
                  }}
                />
                <span className="min-w-0 flex-1 leading-snug">
                  {disabled ? `${run.scenario_name} - indisponible` : run.scenario_name}
                </span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function CompareScenariosCodeMultiSelect({
  options,
  selectedCodes,
  onToggle,
  className,
  placeholder = "Choisir des scénarios",
}: {
  options: Array<{ code: string; label: string; disabled?: boolean }>;
  selectedCodes: string[];
  onToggle: (code: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedOptions = useMemo(
    () => options.filter((option) => selectedCodes.includes(option.code)),
    [options, selectedCodes]
  );

  const displayLabel = useMemo(() => {
    if (!selectedOptions.length) return placeholder;
    if (selectedOptions.length === 1) return selectedOptions[0].label;
    if (selectedOptions.length === 2) {
      const joined = selectedOptions.map((item) => item.label).join(", ");
      if (joined.length <= 42) return joined;
      return "2 scénarios sélectionnés";
    }
    return `${selectedOptions.length} scénarios sélectionnés`;
  }, [placeholder, selectedOptions]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Scénarios à comparer"
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            !selectedOptions.length && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate text-left">{displayLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-2"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {options.map((scenario) => {
            const checked = selectedCodes.includes(scenario.code);
            const disabled = Boolean(scenario.disabled);

            return (
              <label
                key={`compare-scenario-code-${scenario.code}`}
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <Checkbox
                  className="mt-0.5"
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={() => {
                    if (!disabled) onToggle(scenario.code);
                  }}
                />
                <span className="min-w-0 flex-1 leading-snug">{scenario.label}</span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
