import { RiskLevel } from "../types";

// ─── Risk Level Helpers ──────────────────────────────────────
export const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string; badge: string }> = {
  low:      { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  badge: "bg-green-100 text-green-700" },
  moderate: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-700" },
  high:     { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", badge: "bg-orange-100 text-orange-700" },
  critical: { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    badge: "bg-red-100 text-red-700" },
};

export const getRiskColor = (level: RiskLevel) => RISK_COLORS[level] || RISK_COLORS.low;

export const getRiskEmoji = (level: RiskLevel): string => ({
  low: "✅", moderate: "⚠️", high: "🔶", critical: "🚨",
}[level] || "❓");


// ─── Number / Format Helpers ─────────────────────────────────
export const formatPercent = (value: number, decimals = 1): string =>
  `${(value * 100).toFixed(decimals)}%`;

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const formatBMI = (bmi: number): { value: string; category: string; color: string } => {
  const value = bmi.toFixed(1);
  if (bmi < 18.5) return { value, category: "Underweight", color: "text-blue-600" };
  if (bmi < 25)   return { value, category: "Normal",      color: "text-green-600" };
  if (bmi < 30)   return { value, category: "Overweight",  color: "text-yellow-600" };
  return            { value, category: "Obese",          color: "text-red-600" };
};

export const formatBloodPressure = (sys?: number, dia?: number): string => {
  if (!sys || !dia) return "—";
  const category =
    sys >= 180 || dia >= 110 ? "Hypertensive Crisis" :
    sys >= 140 || dia >= 90  ? "High"                :
    sys >= 130 || dia >= 80  ? "Elevated"            :
    sys < 90  || dia < 60   ? "Low"                 : "Normal";
  return `${sys}/${dia} (${category})`;
};


// ─── Date Helpers ────────────────────────────────────────────
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", options || { day: "numeric", month: "short", year: "numeric" });
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const timeAgo = (date: string | Date): string => {
  const d    = typeof date === "string" ? new Date(date) : date;
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60)   return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
};


// ─── Validation Helpers ──────────────────────────────────────
export const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (password.length < 8)           errors.push("At least 8 characters");
  if (!/[A-Z]/.test(password))       errors.push("One uppercase letter");
  if (!/[a-z]/.test(password))       errors.push("One lowercase letter");
  if (!/[0-9]/.test(password))       errors.push("One number");
  return { valid: errors.length === 0, errors };
};


// ─── Chart Helpers ───────────────────────────────────────────
export const CHART_COLORS = {
  blue:   { border: "#3b82f6", background: "rgba(59,130,246,0.1)" },
  red:    { border: "#ef4444", background: "rgba(239,68,68,0.1)"  },
  green:  { border: "#10b981", background: "rgba(16,185,129,0.1)" },
  yellow: { border: "#f59e0b", background: "rgba(245,158,11,0.1)" },
  purple: { border: "#8b5cf6", background: "rgba(139,92,246,0.1)" },
};

export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { position: "bottom" as const, labels: { boxWidth: 12, font: { size: 12 } } },
    tooltip: { backgroundColor: "#1f2937", titleFont: { size: 12 }, bodyFont: { size: 11 } },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { grid: { color: "#f3f4f6" }, ticks: { font: { size: 11 } } },
  },
};


// ─── Misc ────────────────────────────────────────────────────
export const truncate = (text: string, maxLen: number): string =>
  text.length > maxLen ? text.slice(0, maxLen) + "…" : text;

export const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

export const slugify = (text: string): string =>
  text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
