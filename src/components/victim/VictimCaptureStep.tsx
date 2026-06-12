import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Send, ArrowLeft, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VictimCaptureStepProps {
  imagePreview: string | null;
  error?: string | null;
  onSend: () => void;
  onCancel: () => void;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Step 2a — Capture. Shows the captured still, a recording indicator with an
 * elapsed timer, guidance on what to say, and a sticky "Send Report" CTA.
 * Back cancels the capture and returns to Step 1.
 */
export function VictimCaptureStep({
  imagePreview,
  error,
  onSend,
  onCancel,
}: VictimCaptureStepProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      key="capture"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 flex flex-col items-center px-4 pb-28"
    >
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Back / cancel */}
        <button
          onClick={onCancel}
          className="self-start mt-2 mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel
        </button>

        {/* Camera preview */}
        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-card border border-border">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {/* Recording indicator + timer */}
          <div className="absolute top-4 left-4 flex items-center gap-2 glass px-3 py-1.5 rounded-full">
            <motion.div
              className="w-2.5 h-2.5 rounded-full bg-destructive"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs text-foreground font-medium tabular-nums">
              Recording {formatElapsed(elapsed)}
            </span>
          </div>
        </div>

        {/* Instruction card */}
        <div className="mt-5 w-full glass rounded-xl px-4 py-3 text-center">
          <p className="text-sm text-foreground leading-relaxed">
            Describe what you see out loud. Tap{" "}
            <span className="font-semibold text-foreground">Send Report</span>{" "}
            when you're finished.
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-4 w-full px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm text-center">
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

export default VictimCaptureStep;
