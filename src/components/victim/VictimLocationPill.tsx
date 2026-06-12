import { MapPin, ExternalLink, Loader2 } from "lucide-react";
import { cn, googleMapsUrl } from "@/lib/utils";

interface VictimLocationPillProps {
  loading: boolean;
  error: string | null;
  latitude: number | null;
  longitude: number | null;
  className?: string;
}

/**
 * Friendly location status pill. Hides raw coordinates and reassures the
 * user that location is shared with dispatchers. Offers an optional tap to
 * open Google Maps when coordinates are available.
 */
export function VictimLocationPill({
  loading,
  error,
  latitude,
  longitude,
  className,
}: VictimLocationPillProps) {
  const hasCoords = latitude != null && longitude != null;

  if (loading) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs",
          "bg-muted/60 border border-border text-muted-foreground",
          className
        )}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Detecting your location…</span>
      </div>
    );
  }

  if (!hasCoords || error) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs",
          "bg-severity-4/10 border border-severity-4/30 text-severity-4",
          className
        )}
      >
        <MapPin className="w-3.5 h-3.5" />
        <span>Location unavailable — you can still report</span>
      </div>
    );
  }

  return (
    <a
      href={googleMapsUrl(latitude, longitude) || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs",
        "bg-severity-1/10 border border-severity-1/30 text-severity-1",
        "hover:bg-severity-1/20 transition-colors",
        className
      )}
    >
      <MapPin className="w-3.5 h-3.5" />
      <span>Location detected — shared with dispatchers</span>
      <ExternalLink className="w-3 h-3 opacity-70" />
    </a>
  );
}

export default VictimLocationPill;
