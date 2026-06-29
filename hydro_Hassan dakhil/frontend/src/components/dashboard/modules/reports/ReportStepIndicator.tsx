import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { REPORT_STEPS } from "@/components/dashboard/modules/reports/reportTypes";

type Props = {
  currentStep: number;
  onStepClick?: (step: number) => void;
};

export function ReportStepIndicator({ currentStep, onStepClick }: Props) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-sm">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {REPORT_STEPS.map((step) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick?.(step.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                active && "border-primary bg-primary/5",
                done && !active && "border-emerald-200 bg-emerald-50/60",
                !active && !done && "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  active && "bg-primary text-primary-foreground",
                  done && !active && "bg-emerald-600 text-white",
                  !active && !done && "bg-slate-100 text-slate-600"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : step.id}
              </span>
              <span className="text-xs font-semibold leading-tight text-slate-800">{step.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
