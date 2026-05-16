import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function severityColor(severity: number): string {
  const colors: Record<number, string> = {
    1: "bg-severity-1",
    2: "bg-severity-2",
    3: "bg-severity-3",
    4: "bg-severity-4",
    5: "bg-severity-5",
  }
  return colors[severity] || "bg-muted"
}

export function severityLabel(severity: number): string {
  const labels: Record<number, string> = {
    1: "Low",
    2: "Moderate",
    3: "High",
    4: "Critical",
    5: "Emergency",
  }
  return labels[severity] || "Unknown"
}

export function categoryIcon(category: string): string {
  const icons: Record<string, string> = {
    fire: "Flame",
    medical: "Heart",
    crime: "Shield",
    natural_disaster: "CloudLightning",
    other: "AlertTriangle",
  }
  return icons[category] || "AlertTriangle"
}
