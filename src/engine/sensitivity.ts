/* ---------------------------------------------------------------
 * sensitivity.ts — Regression-based sensitivity analysis
 *
 * For each output, we compute the standardised regression
 * coefficient (SRC) between every input column and the output
 * column across all iterations.  This answers: "How much does
 * each input contribute to the variance of the output?"
 *
 * We also compute Spearman rank correlations for robustness.
 * --------------------------------------------------------------- */

import { SensitivityResult } from "./types";

/**
 * Compute sensitivity results for one output.
 *
 * @param inputSamples  Matrix: rows = iterations, cols = input variables
 * @param outputValues  Array of output values (one per iteration)
 * @param inputNames    Names of input variables
 * @param inputIds      IDs of input variables
 */
export function computeSensitivity(
    inputSamples: number[][],
    outputValues: number[],
    inputNames: string[],
    inputIds: string[]
): SensitivityResult[] {
    const n = outputValues.length;
    const numInputs = inputNames.length;
    if (n < 3 || numInputs === 0) return [];

    const results: SensitivityResult[] = [];

    for (let j = 0; j < numInputs; j++) {
        // Extract column j
        const x: number[] = new Array(n);
        for (let i = 0; i < n; i++) {
            x[i] = inputSamples[i]?.[j] ?? 0;
        }

        const src = standardisedRegressionCoefficient(x, outputValues);
        const rho = spearmanRankCorrelation(x, outputValues);

        results.push({
            inputId: inputIds[j],
            inputName: inputNames[j],
            coefficient: src,
            rankCorrelation: rho,
        });
    }

    // Sort by absolute coefficient descending
    results.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
    return results;
}

/** Standardised regression coefficient (bivariate) */
function standardisedRegressionCoefficient(x: number[], y: number[]): number {
    const n = x.length;
    const mx = mean(x);
    const my = mean(y);
    const sx = stdDev(x, mx);
    const sy = stdDev(y, my);
    if (sx === 0 || sy === 0) return 0;

    let cov = 0;
    for (let i = 0; i < n; i++) {
        cov += (x[i] - mx) * (y[i] - my);
    }
    cov /= n;

    // SRC = (cov / var_x) * (std_x / std_y) = correlation(x,y)
    return cov / (sx * sy);
}

/** Spearman rank correlation */
function spearmanRankCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const rx = ranks(x);
    const ry = ranks(y);
    return standardisedRegressionCoefficient(rx, ry);
}

/** Compute ranks (1-based, average ties) */
function ranks(arr: number[]): number[] {
    const n = arr.length;
    const indexed = arr.map((val, idx) => ({ val, idx }));
    indexed.sort((a, b) => a.val - b.val);

    const result = new Array<number>(n);
    let i = 0;
    while (i < n) {
        let j = i;
        while (j < n - 1 && indexed[j + 1].val === indexed[i].val) j++;
        const avgRank = (i + j) / 2 + 1;
        for (let k = i; k <= j; k++) {
            result[indexed[k].idx] = avgRank;
        }
        i = j + 1;
    }
    return result;
}

function mean(arr: number[]): number {
    let s = 0;
    for (let i = 0; i < arr.length; i++) s += arr[i];
    return s / arr.length;
}

function stdDev(arr: number[], m: number): number {
    let s = 0;
    for (let i = 0; i < arr.length; i++) {
        const d = arr[i] - m;
        s += d * d;
    }
    return Math.sqrt(s / arr.length);
}
