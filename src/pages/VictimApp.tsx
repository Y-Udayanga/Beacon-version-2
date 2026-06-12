import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMediaCapture } from "@/hooks/useMediaCapture";
import { api, type TriageResult } from "@/lib/api";
import { VictimStepIndicator } from "@/components/victim/VictimStepIndicator";
import { VictimStartStep } from "@/components/victim/VictimStartStep";
import { VictimCaptureStep } from "@/components/victim/VictimCaptureStep";
import { VictimDescribeStep } from "@/components/victim/VictimDescribeStep";
import { VictimSubmittingStep } from "@/components/victim/VictimSubmittingStep";
import { VictimResultsStep } from "@/components/victim/VictimResultsStep";

type Step = "start" | "capture" | "describe" | "submitting" | "results";

const STEP_NUMBER: Record<Exclude<Step, "submitting">, number> = {
  start: 1,
  capture: 2,
  describe: 2,
  results: 3,
};

export default function VictimApp() {
  const [step, setStep] = useState<Step>("start");
  const [description, setDescription] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const geo = useGeolocation();
  const media = useMediaCapture();

  const handleReportWithCamera = useCallback(async () => {
    setSubmitError(null);
    try {
      await media.startCapture();
      setStep("capture");
    } catch {
      // Camera/mic unavailable — route to the describe-only path
      setSubmitError(
        "We couldn't access your camera. You can still report by describing what's happening."
      );
      setStep("describe");
    }
  }, [media]);

  const handleDescribeOnly = useCallback(() => {
    setSubmitError(null);
    setStep("describe");
  }, []);

  const handleBackToStart = useCallback(() => {
    setSubmitError(null);
    setStep("start");
  }, []);

  const handleCancelCapture = useCallback(() => {
    media.reset();
    setSubmitError(null);
    setStep("start");
  }, [media]);

  const handleSendCapture = useCallback(async () => {
    try {
      const audioBlob = await media.stopCapture();
      setStep("submitting");

      const triageResult = await api.submitEmergency({
        image: media.image ?? undefined,
        audio: audioBlob ?? undefined,
        description: description || undefined,
        reporter_phone: reporterPhone || undefined,
        location_lat: geo.latitude ?? undefined,
        location_lng: geo.longitude ?? undefined,
      });

      setResult(triageResult);
      setStep("results");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to send your report"
      );
      setStep("describe");
    }
  }, [media, description, reporterPhone, geo.latitude, geo.longitude]);

  const handleSendDescribe = useCallback(async () => {
    if (!description.trim()) {
      setSubmitError("Please describe your emergency before sending.");
      return;
    }
    setSubmitError(null);
    setStep("submitting");
    try {
      const triageResult = await api.submitEmergency({
        description,
        reporter_phone: reporterPhone || undefined,
        location_lat: geo.latitude ?? undefined,
        location_lng: geo.longitude ?? undefined,
      });
      setResult(triageResult);
      setStep("results");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to send your report"
      );
      setStep("describe");
    }
  }, [description, reporterPhone, geo.latitude, geo.longitude]);

  const handleReset = useCallback(() => {
    media.reset();
    setResult(null);
    setDescription("");
    setReporterPhone("");
    setSubmitError(null);
    setStep("start");
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

      {/* Step indicator (hidden during the full-screen submitting overlay) */}
      {step !== "submitting" && (
        <VictimStepIndicator current={STEP_NUMBER[step]} total={3} />
      )}

      <AnimatePresence mode="wait">
        {step === "start" && (
          <VictimStartStep
            key="start"
            geo={geo}
            error={submitError || media.error}
            onReportWithCamera={handleReportWithCamera}
            onDescribeOnly={handleDescribeOnly}
          />
        )}

        {step === "capture" && (
          <VictimCaptureStep
            key="capture"
            imagePreview={media.imagePreview}
            error={submitError}
            onSend={handleSendCapture}
            onCancel={handleCancelCapture}
          />
        )}

        {step === "describe" && (
          <VictimDescribeStep
            key="describe"
            geo={geo}
            description={description}
            reporterPhone={reporterPhone}
            error={submitError}
            onDescriptionChange={setDescription}
            onReporterPhoneChange={setReporterPhone}
            onSend={handleSendDescribe}
            onBack={handleBackToStart}
          />
        )}

        {step === "submitting" && (
          <VictimSubmittingStep key="submitting" imagePreview={media.imagePreview} />
        )}

        {step === "results" && result && (
          <VictimResultsStep
            key="results"
            result={result}
            geo={geo}
            onReset={handleReset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
