/* ---------------------------------------------------------------
 * types.ts — Shared type definitions for the Monte Carlo engine
 * --------------------------------------------------------------- */

/** Supported distribution types */
export type DistributionType =
    | "normal"
    | "triangular"
    | "pert"
    | "uniform"
    | "lognormal"
    | "discrete";

/** A registered distribution input */
export interface DistributionInput {
    id: string;
    /** Excel cell address, e.g. "Sheet1!B5" */
    cellAddress: string;
    /** Distribution type */
    type: DistributionType;
    /** Distribution parameters */
    params: Record<string, number | number[]>;
    /** User-given name */
    name: string;
    /** The formula string to restore after simulation */
    originalFormula?: string;
}

/** A registered simulation output */
export interface SimulationOutput {
    id: string;
    /** Excel cell address */
    cellAddress: string;
    /** User-given name */
    name: string;
}

/** Configuration for a simulation run */
export interface SimulationConfig {
    /** Number of iterations */
    iterations: number;
    /** Random seed (0 = random) */
    seed: number;
    /** Confidence level for intervals (e.g. 0.90) */
    confidenceLevel: number;
    /** Threshold for P(X < threshold) metric (default: 0) */
    probabilityThreshold: number;
}

/** Results for a single output across all iterations */
export interface OutputResults {
    outputId: string;
    name: string;
    cellAddress: string;
    /** Raw iteration values */
    values: number[];
    /** Computed statistics */
    stats: OutputStatistics;
}

/** Full statistics for one output */
export interface OutputStatistics {
    minimum: number;
    maximum: number;
    mean: number;
    median: number;
    mode: number;
    stdDev: number;
    variance: number;
    skewness: number;
    kurtosis: number;
    /** Key percentiles */
    percentiles: {
        p1: number;
        p5: number;
        p10: number;
        p25: number;
        p50: number;
        p75: number;
        p90: number;
        p95: number;
        p99: number;
    };
    /** Confidence interval [lower, upper] */
    confidenceInterval: [number, number];
    /** Probability of result being negative */
    probNegative: number;
    /** Count of iterations */
    count: number;
}

/** Sensitivity result for tornado chart */
export interface SensitivityResult {
    inputId: string;
    inputName: string;
    /** Standardised regression coefficient */
    coefficient: number;
    /** Rank correlation coefficient */
    rankCorrelation: number;
}

/** Overall simulation results */
export interface SimulationResults {
    config: SimulationConfig;
    outputs: OutputResults[];
    sensitivity: Map<string, SensitivityResult[]>;
    /** Elapsed time in ms */
    elapsedMs: number;
    /** Matrix of input samples: rows=iterations, cols=inputs */
    inputSamples: number[][];
}

/** Simulation status */
export type SimulationStatus =
    | "idle"
    | "running"
    | "paused"
    | "completed"
    | "error"
    | "cancelled";

/** Progress update */
export interface SimulationProgress {
    status: SimulationStatus;
    currentIteration: number;
    totalIterations: number;
    iterationsPerSecond: number;
    elapsedMs: number;
    estimatedRemainingMs: number;
}
