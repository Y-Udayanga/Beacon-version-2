import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Camera,
  AlertTriangle,
  UserSearch,
  Search,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VictimLocationPill } from "./VictimLocationPill";
import { VictimSafetyBanner } from "./VictimSafetyBanner";

interface VictimStartStepProps {
  geo: {
    loading: boolean;
    error: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  error?: string | null;
  onReportWithCamera: () => void;
  onDescribeOnly: () => void;
}

/**
 * Step 1 — Start. One obvious primary action ("Report with Photo & Voice"),
 * a de-emphasized secondary path for describing without a camera, friendly
 * location status, the safety banner, and small missing-person footer links.
 */
export function VictimStartStep({
  geo,
  error,
  onReportWithCamera,
  onDescribeOnly,
}: VictimStartStepProps) {
  return (
    <motion.div
      key="start"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 flex flex-col items-center px-4 pb-10"
    >
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Hero */}
        <div className="text-center mt-6 mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Report an emergency
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            We'll alert dispatchers and share your location.
          </p>
        </div>

        {/* Location pill */}
        <VictimLocationPill
          loading={geo.loading}
          error={geo.error}
          latitude={geo.latitude}
          longitude={geo.longitude}
          className="mb-5"
        />

        {/* Error display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 w-full px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm text-center"
          >
            <AlertTriangle className="w-4 h-4 inline mr-2 -mt-0.5" />
            {error}
          </motion.div>
        )}

        {/* Primary CTA */}
        <motion.button
          onClick={onReportWithCamera}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl",
            "bg-destructive text-destructive-foreground font-bold text-lg",
            "glow-red cursor-pointer select-none",
            "active:scale-[0.98] transition-transform"
          )}
        >
          <Camera className="w-6 h-6" />
          Report with Photo &amp; Voice
        </motion.button>

        {/* Secondary, de-emphasized path */}
        <button
          onClick={onDescribeOnly}
          className={cn(
            "mt-4 inline-flex items-center gap-1.5 text-sm font-medium",
            "text-primary hover:text-primary/80 transition-colors"
          )}
        >
          Describe emergency without camera
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Safety banner */}
        <VictimSafetyBanner className="mt-8 w-full" />

        {/* De-emphasized missing-person footer links */}
        <div className="mt-10 pt-6 border-t border-border/50 w-full flex flex-col items-center gap-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
            Not an emergency?
          </p>
          <div className="flex items-center gap-5">
            <Link
              to="/missing"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <UserSearch className="w-3.5 h-3.5" />
              Report Missing Person
            </Link>
            <Link
              to="/missing-dashboard"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              View Missing Persons
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default VictimStartStep;
