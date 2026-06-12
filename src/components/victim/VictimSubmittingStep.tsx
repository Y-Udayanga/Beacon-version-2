import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface VictimSubmittingStepProps {
  imagePreview?: string | null;
}

/**
 * Step 3 — Submitting. Full-screen reassuring overlay shown while the report
 * is sent and analyzed. Plain language, no "AI is analyzing" jargon.
 */
export function VictimSubmittingStep({ imagePreview }: VictimSubmittingStepProps) {
  return (
    <motion.div
      key="submitting"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
    >
      {/* Blurred background image, if a photo was captured */}
      {imagePreview && (
        <img
          src={imagePreview}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-xl opacity-20"
        />
      )}
      <div className="absolute inset-0 bg-background/80" />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-16 h-16 text-primary" />
        </motion.div>
        <div className="space-y-2">
          <motion.p
            className="text-lg font-semibold text-foreground"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Sending your report…
          </motion.p>
          <p className="text-sm text-muted-foreground">
            Stay safe. Help is being notified.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default VictimSubmittingStep;
