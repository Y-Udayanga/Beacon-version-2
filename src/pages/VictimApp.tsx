import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  StopCircle,
  MapPin,
  Loader2,
  HeartPulse,
  AlertTriangle,
  Truck,
  Shield,
  Flame,
  Users,
  Languages,
  RotateCcw,
  UserSearch,
} from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMediaCapture } from "@/hooks/useMediaCapture";
import { api, type TriageResult } from "@/lib/api";
import { cn, severityColor, severityLabel } from "@/lib/utils";

type AppState = "ready" | "capturing" | "analyzing" | "results";

const unitIcons: Record<string, typeof Truck> = {
  ambulance: Truck,
  police: Shield,
  fire: Flame,
  search_rescue: Users,
};

function TypewriterText({ text, speed = 30 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    indexRef.current = 0;

    const interval = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current <= text.length) {
        setDisplayed(text.slice(0, indexRef.current));
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-0.5 h-4 bg-severity-1 ml-0.5 animate-pulse align-text-bottom" />
      )}
    </span>
  );
}

function PulsingRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-destructive/40"
          initial={{ width: 200, height: 200, opacity: 0.6 }}
          animate={{
            width: [200, 340],
            height: [200, 340],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeOut",
          }}
          style={{ x: "-50%", y: "-50%", left: "50%", top: "50%" }}
        />
      ))}
    </div>
  );
}

export default function VictimApp() {
  const [appState, setAppState] = useState<AppState>("ready");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const geo = useGeolocation();
  const media = useMediaCapture();

  const handlePanicSnap = useCallback(async () => {
    setSubmitError(null);
    await media.startCapture();
    setAppState("capturing");
  }, [media]);

  const handleStopAndSubmit = useCallback(async () => {
    try {
      const audioBlob = await media.stopCapture();
      setAppState("analyzing");

      const triageResult = await api.submitEmergency({
        image: media.image ?? undefined,
        audio: audioBlob ?? undefined,
        description: description || undefined,
        location_lat: geo.latitude ?? undefined,
        location_lng: geo.longitude ?? undefined,
      });

      setResult(triageResult);
      setAppState("results");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit emergency"
      );
      setAppState("ready");
    }
  }, [media, description, geo.latitude, geo.longitude]);

  const handleReset = useCallback(() => {
    media.reset();
    setResult(null);
    setDescription("");
    setSubmitError(null);
    setAppState("ready");
  }, [media]);

  return (
    <div className="min-h-dvh bg-background relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-destructive/5 via-transparent to-primary/5 pointer-events-none" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-border/50">
        <Link
          to="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="sr-only">Back</span>
        </Link>
        <h1 className="text-lg font-bold text-gradient">Crisis Copilot</h1>
        <div className="w-5" />
      </header>

      {/* Location indicator */}
      <div className="relative z-10 flex items-center justify-center gap-2 px-4 py-2 text-xs">
        <MapPin className="w-3.5 h-3.5 text-primary" />
        {geo.loading ? (
          <span className="text-muted-foreground animate-pulse">
            Detecting location...
          </span>
        ) : geo.error ? (
          <span className="text-destructive">{geo.error}</span>
        ) : (
          <span className="text-muted-foreground">
            {geo.latitude?.toFixed(4)}, {geo.longitude?.toFixed(4)}
          </span>
        )}
      </div>

      {/* Main content area */}
      <AnimatePresence mode="wait">
        {/* STATE 1: Ready */}
        {appState === "ready" && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 flex flex-col items-center justify-center px-4"
            style={{ minHeight: "calc(100dvh - 100px)" }}
          >
            {/* Error display */}
            {(media.error || submitError) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm text-center max-w-sm"
              >
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                {media.error || submitError}
              </motion.div>
            )}

            {/* Panic button area */}
            <div className="relative flex items-center justify-center mb-10">
              <PulsingRings />
              <motion.button
                onClick={handlePanicSnap}
                className={cn(
                  "relative z-10 flex flex-col items-center justify-center rounded-full",
                  "bg-destructive text-destructive-foreground font-bold",
                  "w-[200px] h-[200px] md:w-[240px] md:h-[240px]",
                  "glow-red cursor-pointer select-none",
                  "active:scale-95 transition-transform"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Camera className="w-12 h-12 mb-2" />
                <span className="text-lg md:text-xl tracking-wide">
                  PANIC SNAP
                </span>
              </motion.button>
            </div>

            {/* Description input */}
            <div className="w-full max-w-sm mb-8">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your emergency..."
                rows={3}
                className={cn(
                  "w-full px-4 py-3 rounded-xl resize-none",
                  "bg-card border border-border text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                  "text-sm"
                )}
              />
            </div>

            {/* Missing person link */}
            <Link
              to="/missing"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <UserSearch className="w-4 h-4" />
              Report Missing Person
            </Link>
          </motion.div>
        )}

        {/* STATE 2: Capturing */}
        {appState === "capturing" && (
          <motion.div
            key="capturing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 flex flex-col items-center px-4 pt-4"
            style={{ minHeight: "calc(100dvh - 100px)" }}
          >
            {/* Camera preview */}
            <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden bg-card border border-border mb-6">
              {media.imagePreview ? (
                <img
                  src={media.imagePreview}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}

              {/* Recording indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2 glass px-3 py-1.5 rounded-full">
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-destructive"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-xs text-foreground font-medium">
                  Recording audio...
                </span>
              </div>
            </div>

            {/* Stop button */}
            <motion.button
              onClick={handleStopAndSubmit}
              className={cn(
                "flex items-center gap-3 px-8 py-4 rounded-full",
                "bg-destructive text-destructive-foreground font-semibold text-base",
                "glow-red cursor-pointer",
                "active:scale-95 transition-transform"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <StopCircle className="w-6 h-6" />
              Stop & Submit
            </motion.button>
          </motion.div>
        )}

        {/* STATE 3: Analyzing */}
        {appState === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          >
            {/* Blurred background image */}
            {media.imagePreview && (
              <img
                src={media.imagePreview}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-xl opacity-20"
              />
            )}
            <div className="absolute inset-0 bg-background/80" />

            <div className="relative z-10 flex flex-col items-center gap-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-16 h-16 text-primary" />
              </motion.div>
              <motion.p
                className="text-lg font-medium text-foreground shimmer px-4 py-2 rounded-lg"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                AI is analyzing your situation...
              </motion.p>
            </div>
          </motion.div>
        )}

        {/* STATE 4: Results */}
        {appState === "results" && result && (
          <motion.div
            key="results"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative z-10 px-4 pb-8 pt-2"
            style={{ minHeight: "calc(100dvh - 100px)" }}
          >
            <div className="max-w-lg mx-auto space-y-5">
              {/* Severity Badge */}
              <div className="flex justify-center pt-4">
                <div
                  className={cn(
                    "inline-flex items-center gap-3 px-6 py-3 rounded-full text-white font-bold text-xl",
                    severityColor(result.severity)
                  )}
                >
                  <span className="text-2xl">{result.severity}</span>
                  <span className="text-base">
                    &mdash; {severityLabel(result.severity)}
                  </span>
                </div>
              </div>

              {/* Category */}
              <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Category
                  </p>
                  <p className="text-foreground font-medium capitalize">
                    {result.category.replace(/_/g, " ")}
                  </p>
                </div>
              </div>

              {/* Threat Assessment */}
              {result.threats_detected.length > 0 && (
                <div className="glass rounded-xl px-4 py-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Threat Assessment
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.threats_detected.map((threat, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-destructive/15 text-destructive text-sm font-medium border border-destructive/30"
                      >
                        {threat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* First Aid Instructions */}
              {result.first_aid_instructions && (
                <div className="rounded-xl px-4 py-4 bg-severity-1/10 border border-severity-1/30">
                  <div className="flex items-center gap-2 mb-3">
                    <HeartPulse className="w-5 h-5 text-severity-1" />
                    <p className="text-sm font-semibold text-severity-1 uppercase tracking-wider">
                      First Aid Instructions
                    </p>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    <TypewriterText text={result.first_aid_instructions} />
                  </p>
                </div>
              )}

              {/* Recommended Actions */}
              {result.recommended_actions.length > 0 && (
                <div className="glass rounded-xl px-4 py-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Recommended Actions
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

              {/* Translated Text */}
              {result.translated_text &&
                result.detected_language &&
                result.detected_language !== "en" && (
                  <div className="rounded-xl px-4 py-4 bg-primary/10 border border-primary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Languages className="w-5 h-5 text-primary" />
                      <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                        Translation ({result.detected_language})
                      </p>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {result.translated_text}
                    </p>
                  </div>
                )}

              {/* Dispatched Units */}
              {result.dispatched_units &&
                result.dispatched_units.length > 0 &&
                result.severity >= 4 && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider px-1">
                      Dispatched Units
                    </p>
                    {result.dispatched_units.map((unit, i) => {
                      const Icon =
                        unitIcons[unit.unit_type] || AlertTriangle;
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

              {/* Reset button */}
              <div className="pt-4 flex justify-center">
                <motion.button
                  onClick={handleReset}
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
        )}
      </AnimatePresence>
    </div>
  );
}
