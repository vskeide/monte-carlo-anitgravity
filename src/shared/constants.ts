/* ---------------------------------------------------------------
 * constants.ts — Shared constants
 * --------------------------------------------------------------- */

export const DEFAULT_ITERATIONS = 1000;
export const MIN_ITERATIONS = 100;
export const MAX_ITERATIONS = 50000;
export const DEFAULT_SEED = 0;  // 0 = random
export const DEFAULT_CONFIDENCE = 0.90;

/** Chart colour palette — modern, professional */
export const COLORS = {
    primary: "#4F46E5",  // Indigo
    primaryDark: "#3730A3",
    secondary: "#0EA5E9",  // Sky blue
    accent: "#8B5CF6",  // Violet
    success: "#10B981",  // Emerald
    warning: "#F59E0B",  // Amber
    danger: "#EF4444",  // Red
    neutral: "#6B7280",  // Gray

    // Chart-specific
    histogram: "#4F46E5",
    histogramHover: "#6366F1",
    cdf: "#0EA5E9",
    percentileLine: "#F59E0B",
    percentileFill: "rgba(79, 70, 229, 0.12)",
    tornadoPositive: "#4F46E5",
    tornadoNegative: "#EF4444",

    // Background
    chartBg: "#FFFFFF",
    gridLine: "#E5E7EB",
    axisText: "#374151",
    labelText: "#6B7280",
};

/** Number formatting */
export function formatNumber(value: number, decimals = 2): string {
    if (Math.abs(value) >= 1e9) {
        return (value / 1e9).toFixed(decimals) + "B";
    }
    if (Math.abs(value) >= 1e6) {
        return (value / 1e6).toFixed(decimals) + "M";
    }
    if (Math.abs(value) >= 1e3) {
        return (value / 1e3).toFixed(decimals) + "K";
    }
    return value.toFixed(decimals);
}

export function formatPercent(value: number, decimals = 1): string {
    return (value * 100).toFixed(decimals) + "%";
}
