import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  HeartPulse,
  AlertTriangle,
  Truck,
  Shield,
  Flame,
  Users,
  Languages,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { cn, severityColor, severityLabel, googleMapsUrl } from "@/lib/utils";
import type { TriageResult } from "@/lib/api";
import { TypewriterText } from "./TypewriterText";

interface VictimResultsStepProps {
  result: TriageResult;
  geo: {
    latitude: number | null;
    longitude: number | null;
  };
  onReset: () => void;
}

const unitIcons: Record<string, typeof Truck> = {
  ambulance: Truck,
  police: Shield,
  fire: Flame,
  search_rescue: Users,
};

/**
 * Reassurance-first hero tone derived from severity.
 * Low/moderate → green, high → amber, critical/emergency → red.
 */
function heroTone(severity: number) {
  if (severity >= 4) {
    return {
      ring: "border-destructive/40 bg-destructive/10",
      glow: "glow-red",
      icon: "text-destructive",
    };
  }
  if (severity === 3) {
    return {
      ring: "border-severity-4/40 bg-severity-4/10",
      glow: "glow-amber",
      icon: "text-severity-4",
    };
  }
  return {
    ring: "border-severity-1/40 bg-severity-1/10",
    glow: "glow-green",
    icon: "text-severity-1",
  };
}

export function VictimResultsStep({
  result,
  geo,
  onReset,
}: VictimResultsStepProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const unitsDispatched =
    !!result.dispatched_units && result.dispatched_units.length > 0;
  const tone = heroTone(result.severity);

  const heroMessage =
    result.severity >= 4 && unitsDispatched
      ? "Emergency units are being dispatched"
      : "Report received — help is being coordinated";

  const hasTranslation =
    result.translated_text &&
    result.detected_language &&
    result.detected_language !== "en";

  return (
    <motion.div
      key="results"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="relative z-10 px-4 pb-10 pt-2"
    >
      <div className="max-w-lg mx-auto space-y-5">
        {/* 1. Status hero */}
        <div
          className={cn(
            "mt-4 flex flex-col items-center text-center gap-3 px-6 py-7 rounded-2xl border",
            tone.ring,
            tone.glow
          )}
        >
          <CheckCircle2 className={cn("w-12 h-12", tone.icon)} />
          <h2 className="text-xl font-bold text-foreground leading-snug">
            {heroMessage}
          </h2>
          <p className="text-sm text-muted-foreground">
            Stay where you are if it's safe. Keep your phone nearby.
          </p>
        </div>

        {/* 2. First aid — highest priority after hero */}
        {result.first_aid_instructions && (
          <div className="rounded-xl px-4 py-4 bg-severity-1/10 border border-severity-1/30">
            <div className="flex items-center gap-2 mb-3">
              <HeartPulse className="w-5 h-5 text-severity-1" />
              <p className="text-sm font-semibold text-severity-1 uppercase tracking-wider">
                What you can do now
              </p>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              <TypewriterText text={result.first_aid_instructions} />
            </p>
          </div>
        )}

        {/* 3. Your location */}
        {geo.latitude != null && geo.longitude != null && (
          <div className="glass rounded-xl px-4 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Your location
            </p>
            <a
              href={googleMapsUrl(geo.latitude, geo.longitude) || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg",
                "bg-primary/10 border border-primary/30",
                "hover:bg-primary/20 transition-colors group"
              )}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/15">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground font-medium">
                  Shared with dispatchers
                </p>
                <p className="text-xs text-muted-foreground">
                  Open in Google Maps
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
            </a>
          </div>
        )}

        {/* 4. Dispatched units */}
        {unitsDispatched && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider px-1">
              Help on the way
            </p>
            {result.dispatched_units!.map((unit, i) => {
              const Icon = unitIcons[unit.unit_type] || AlertTriangle;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="glass rounded-xl px-4 py-3 flex items-center gap-4"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/15">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-medium capitalize">
                      {unit.unit_type.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ETA: {unit.eta_minutes} min
                    </p>
                  </div>
                  <div className="text-right">
                    <motion.div
                      className="w-2.5 h-2.5 rounded-full bg-severity-1 mx-auto"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      En route
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* 5. Collapsible details (dispatcher-style data) */}
        <div className="glass rounded-xl overflow-hidden">
          <button
            onClick={() => setDetailsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
            aria-expanded={detailsOpen}
          >
            <span className="text-sm font-medium text-foreground">
              Details
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                detailsOpen && "rotate-180"
              )}
            />
          </button>

          <AnimatePresence initial={false}>
            {detailsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border/50">
                  {/* Severity + category */}
                  <div className="flex flex-wrap items-center gap-2 pt-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-xs font-semibold",
                        severityColor(result.severity)
                      )}
                    >
                      Severity {result.severity} — {severityLabel(result.severity)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium capitalize">
                      {result.category.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Threats */}
                  {result.threats_detected.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                        Threat assessment
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.threats_detected.map((threat, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-destructive/15 text-destructive text-xs font-medium border border-destructive/30"
                          >
                            {threat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended actions */}
                  {result.recommended_actions.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                        Recommended actions
                      </p>
                      <ul className="space-y-1.5">
                        {result.recommended_actions.map((action, i) => (
                          <li
                            key={i}
                            className="text-sm text-foreground flex items-start gap-2"
                          >
                            <span className="text-primary mt-0.5">&#x2022;</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Translation */}
                  {hasTranslation && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Languages className="w-4 h-4 text-primary" />
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                          Translation ({result.detected_language})
                        </p>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {result.translated_text}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 6. Report another emergency */}
        <div className="pt-2 flex justify-center">
          <motion.button
            onClick={onReset}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full",
              "bg-card border border-border text-foreground font-medium text-sm",
              "hover:bg-secondary transition-colors cursor-pointer"
            )}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <RotateCcw className="w-4 h-4" />
            Report Another Emergency
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default VictimResultsStep;
