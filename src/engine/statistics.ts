/* ---------------------------------------------------------------
 * statistics.ts — Compute descriptive statistics from simulation
 *                 output arrays.  Pure math, no Excel dependency.
 * --------------------------------------------------------------- */

import { OutputStatistics } from "./types";

/** Compute full statistics for an array of simulation output values */
export function computeStatistics(
    values: number[],
    confidenceLevel = 0.9
): OutputStatistics {
    const n = values.length;
    if (n === 0) {
        return emptyStats();
    }

    // Sort a copy for percentiles/median
    const sorted = [...values].sort((a, b) => a - b);

    const minimum = sorted[0];
    const maximum = sorted[n - 1];
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    // Median
    const median =
        n % 2 === 0
            ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
            : sorted[Math.floor(n / 2)];

    // Variance, StdDev
    let sumSqDiff = 0;
    let sumCubDiff = 0;
    let sumQuadDiff = 0;
    for (let i = 0; i < n; i++) {
        const diff = values[i] - mean;
        const d2 = diff * diff;
        sumSqDiff += d2;
        sumCubDiff += d2 * diff;
        sumQuadDiff += d2 * d2;
    }
    const variance = sumSqDiff / n;
    const stdDev = Math.sqrt(variance);

    // Skewness (Fisher)
    const skewness =
        stdDev > 0 ? (sumCubDiff / n) / (stdDev * stdDev * stdDev) : 0;

    // Excess kurtosis (Fisher)
    const kurtosis =
        stdDev > 0
            ? (sumQuadDiff / n) / (variance * variance) - 3
            : 0;

    // Mode (histogram-based approximation)
    const mode = computeMode(sorted);

    // Percentiles
    const percentiles = {
        p1: percentile(sorted, 0.01),
        p5: percentile(sorted, 0.05),
        p10: percentile(sorted, 0.10),
        p25: percentile(sorted, 0.25),
        p50: percentile(sorted, 0.50),
        p75: percentile(sorted, 0.75),
        p90: percentile(sorted, 0.90),
        p95: percentile(sorted, 0.95),
        p99: percentile(sorted, 0.99),
    };

    // Confidence interval
    const alpha = (1 - confidenceLevel) / 2;
    const confidenceInterval: [number, number] = [
        percentile(sorted, alpha),
        percentile(sorted, 1 - alpha),
    ];

    // Probability of negative outcome
    let negCount = 0;
    for (let i = 0; i < n; i++) {
        if (values[i] < 0) negCount++;
    }
    const probNegative = negCount / n;

    return {
        minimum,
        maximum,
        mean,
        median,
        mode,
        stdDev,
        variance,
        skewness,
        kurtosis,
        percentiles,
        confidenceInterval,
        probNegative,
        count: n,
    };
}

/** Linear interpolation percentile on a sorted array */
export function percentile(sorted: number[], p: number): number {
    const n = sorted.length;
    if (n === 0) return 0;
    if (n === 1) return sorted[0];
    const idx = p * (n - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    const frac = idx - lo;
    return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

/** Mode approximation — bin the data and find the peak */
function computeMode(sorted: number[]): number {
    const n = sorted.length;
    if (n <= 2) return sorted[0];
    const range = sorted[n - 1] - sorted[0];
    if (range === 0) return sorted[0];

    // Sturges' formula for bin count
    const numBins = Math.max(
        10,
        Math.min(200, Math.ceil(1 + 3.322 * Math.log10(n)))
    );
    const binWidth = range / numBins;
    const bins = new Uint32Array(numBins);

    for (let i = 0; i < n; i++) {
        let bin = Math.floor((sorted[i] - sorted[0]) / binWidth);
        if (bin >= numBins) bin = numBins - 1;
        bins[bin]++;
    }

    let maxBin = 0;
    let maxCount = 0;
    for (let i = 0; i < numBins; i++) {
        if (bins[i] > maxCount) {
            maxCount = bins[i];
            maxBin = i;
        }
    }

    // Return midpoint of the modal bin
    return sorted[0] + (maxBin + 0.5) * binWidth;
}

/** Create an empty stats object (for 0-length data) */
function emptyStats(): OutputStatistics {
    return {
        minimum: 0,
        maximum: 0,
        mean: 0,
        median: 0,
        mode: 0,
        stdDev: 0,
        variance: 0,
        skewness: 0,
        kurtosis: 0,
        percentiles: {
            p1: 0, p5: 0, p10: 0, p25: 0, p50: 0,
            p75: 0, p90: 0, p95: 0, p99: 0,
        },
        confidenceInterval: [0, 0],
        probNegative: 0,
        count: 0,
    };
}

/** Compute histogram bin data for charting */
export interface HistogramBin {
    x0: number;
    x1: number;
    count: number;
    frequency: number;   // count / total
    density: number;     // frequency / binWidth
}

export function computeHistogram(
    values: number[],
    numBins?: number
): HistogramBin[] {
    const n = values.length;
    if (n === 0) return [];

    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;

    if (range === 0) {
        return [{ x0: min - 0.5, x1: max + 0.5, count: n, frequency: 1, density: 1 }];
    }

    const bins =
        numBins ??
        Math.max(20, Math.min(100, Math.ceil(1 + 3.322 * Math.log10(n))));
    const binWidth = range / bins;
    const result: HistogramBin[] = [];

    for (let i = 0; i < bins; i++) {
        result.push({
            x0: min + i * binWidth,
            x1: min + (i + 1) * binWidth,
            count: 0,
            frequency: 0,
            density: 0,
        });
    }

    for (let i = 0; i < n; i++) {
        let idx = Math.floor((sorted[i] - min) / binWidth);
        if (idx >= bins) idx = bins - 1;
        result[idx].count++;
    }

    for (let i = 0; i < bins; i++) {
        result[i].frequency = result[i].count / n;
        result[i].density = result[i].frequency / binWidth;
    }

    return result;
}

/** Compute cumulative distribution data for CDF chart */
export interface CDFPoint {
    x: number;
    cdf: number;  // proportion ≤ x
}

export function computeCDF(values: number[], numPoints = 200): CDFPoint[] {
    const n = values.length;
    if (n === 0) return [];

    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;

    if (range === 0) {
        return [
            { x: min - 0.5, cdf: 0 },
            { x: min, cdf: 1 },
        ];
    }

    const points: CDFPoint[] = [];
    const step = range / (numPoints - 1);

    let sortedIdx = 0;
    for (let i = 0; i < numPoints; i++) {
        const x = min + i * step;
        while (sortedIdx < n && sorted[sortedIdx] <= x) {
            sortedIdx++;
        }
        points.push({ x, cdf: sortedIdx / n });
    }

    return points;
}
