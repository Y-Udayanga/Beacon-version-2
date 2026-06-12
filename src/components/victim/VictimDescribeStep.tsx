import { motion } from "framer-motion";
import { Send, ArrowLeft, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { VictimLocationPill } from "./VictimLocationPill";

interface VictimDescribeStepProps {
  geo: {
    loading: boolean;
    error: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  description: string;
  reporterPhone: string;
  error?: string | null;
  onDescriptionChange: (value: string) => void;
  onReporterPhoneChange: (value: string) => void;
  onSend: () => void;
  onBack: () => void;
}

/**
 * Step 2b — Describe only. The fallback path when the camera isn't used.
 * Prominent "What is happening?" textarea, optional phone number for callback
 * (maps to reporter_phone), location status, and a sticky "Send Report" CTA.
 */
export function VictimDescribeStep({
  geo,
  description,
  reporterPhone,
  error,
  onDescriptionChange,
  onReporterPhoneChange,
  onSend,
  onBack,
}: VictimDescribeStepProps) {
  return (
    <motion.div
      key="describe"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 flex flex-col items-center px-4 pb-28"
    >
      <div className="w-full max-w-sm flex flex-col">
        {/* Back */}
        <button
          onClick={onBack}
          className="self-start mt-2 mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Location pill */}
        <VictimLocationPill
          loading={geo.loading}
          error={geo.error}
          latitude={geo.latitude}
          longitude={geo.longitude}
          className="self-center mb-5"
        />

        {/* What is happening */}
        <label
          htmlFor="victim-description"
          className="text-base font-semibold text-foreground mb-2"
        >
          What is happening?
        </label>
        <textarea
          id="victim-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Tell us what's going on, where, and who needs help…"
          rows={5}
          autoFocus
          className={cn(
            "w-full px-4 py-3 rounded-xl resize-none",
            "bg-card border border-border text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
            "text-sm leading-relaxed"
          )}
        />

        {/* Optional phone */}
        <label
          htmlFor="victim-phone"
          className="text-sm font-medium text-foreground mt-5 mb-2"
        >
          Phone number{" "}
          <span className="text-muted-foreground font-normal">
            (optional — so dispatchers can call you back)
          </span>
        </label>
        <input
          id="victim-phone"
          type="tel"
          inputMode="tel"
          value={reporterPhone}
          onChange={(e) => onReporterPhoneChange(e.target.value)}
          placeholder="e.g. +1 555 0100"
          className={cn(
            "w-full px-4 py-3 rounded-xl",
            "bg-card border border-border text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
            "text-sm"
          )}
        />

        {/* Error display */}
        {error && (
          <div className="mt-5 w-full px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm text-center">
            <AlertTriangle className="w-4 h-4 inline mr-2 -mt-0.5" />
            {error}
          </div>
        )}
      </div>

      {/* Sticky Send Report */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-background via-background/95 to-transparent">
        <motion.button
          onClick={onSend}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "w-full max-w-sm mx-auto flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl",
            "bg-destructive text-destructive-foreground font-bold text-base",
            "glow-red cursor-pointer active:scale-[0.98] transition-transform"
          )}
        >
          <Send className="w-5 h-5" />
          Send Report
        </motion.button>
      </div>
    </motion.div>
  );
}

export default VictimDescribeStep;
