import { cn } from "@/lib/utils";

interface VictimStepIndicatorProps {
  current: number;
  total?: number;
  label?: string;
}

/**
 * Compact progress indicator for the victim flow.
 * Shows "Step X of Y" plus a row of dots so users know where they are.
 */
export function VictimStepIndicator({
  current,
  total = 3,
  label,
}: VictimStepIndicatorProps) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="relative z-10 flex flex-col items-center gap-1.5 px-4 py-2">
      <p className="text-xs text-muted-foreground font-medium tracking-wide">
        {label ?? `Step ${current} of ${total}`}
      </p>
      <div className="flex items-center gap-1.5" aria-hidden>
        {steps.map((step) => (
          <span
            key={step}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              step === current
                ? "w-6 bg-primary"
                : step < current
                  ? "w-1.5 bg-primary/60"
                  : "w-1.5 bg-border"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export default VictimStepIndicator;
