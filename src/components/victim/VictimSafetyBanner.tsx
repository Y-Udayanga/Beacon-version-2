import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Standard crisis-app safety guidance. Text-only — directs the user to call
 * their local emergency number if they are in immediate danger.
 */
export function VictimSafetyBanner({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm",
        "bg-destructive/10 border border-destructive/30 text-foreground",
        className
      )}
    >
      <Phone className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
      <p className="leading-relaxed">
        <strong className="font-semibold text-destructive">
          In immediate danger?
        </strong>{" "}
        Call your local emergency number first.
      </p>
    </div>
  );
}

export default VictimSafetyBanner;
