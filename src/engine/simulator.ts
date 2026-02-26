/* ---------------------------------------------------------------
 * simulator.ts — Monte Carlo simulation orchestrator
 *
 * Runs the iteration loop by:
 *  1. Reading registered distribution inputs & outputs from storage
 *  2. Backing up original cell formulas
 *  3. For each iteration:
 *     a. Sample all distributions
 *     b. Write sampled values to input cells
 *     c. Trigger Excel recalculation
 *     d. Read output cell values
 *  4. Restore original formulas
 *  5. Compute statistics & sensitivity
 * --------------------------------------------------------------- */

/* global Excel */

import {
    SimulationConfig,
    SimulationResults,
    SimulationOutput,
    OutputResults,
    SimulationProgress,
    DistributionInput,
} from "./types";
import {
    sampleDistribution,
    seedRng,
    setUseSeededRng,
    resetSamplerState,
} from "./distributions";
import { computeStatistics } from "./statistics";
import { computeSensitivity } from "./sensitivity";
import { getInputs, getOutputs, setSimulating, setCurrentIteration } from "../shared/storage";

/** Cancellation flag */
let _cancelled = false;

export function cancelSimulation(): void {
    _cancelled = true;
}

/**
 * Run a full Monte Carlo simulation.
 *
 * @param config         Simulation settings
 * @param onProgress     Callback for progress updates
 * @returns              Full simulation results
 */
export async function runSimulation(
    config: SimulationConfig,
    onProgress?: (p: SimulationProgress) => void
): Promise<SimulationResults> {
    _cancelled = false;
    const inputs = getInputs();
    const outputs = getOutputs();

    if (inputs.length === 0) {
        throw new Error(
            "No distribution inputs found. Use MC.Normal(), MC.Triangular(), etc. in cells first."
        );
    }
    if (outputs.length === 0) {
        throw new Error(
            "No output cells found. Use MC.Output() to mark output cells first."
        );
    }

    // Setup PRNG
    if (config.seed > 0) {
        seedRng(config.seed);
        setUseSeededRng(true);
    } else {
        setUseSeededRng(false);
    }
    resetSamplerState();

    setSimulating(true);
    const startTime = Date.now();

    // Results collectors
    const outputValues: number[][] = outputs.map(() => []);
    const inputSamples: number[][] = [];

    // Store original formulas and run iterations
    try {
        await Excel.run(async (ctx) => {
            const sheet = ctx.workbook.worksheets.getActiveWorksheet();

            // Load original formulas for input cells
            const inputRanges = inputs.map((inp) => {
                const range = sheet.getRange(inp.cellAddress);
                range.load("formulas");
                return range;
            });

            // Load output ranges
            const outputRanges = outputs.map((out) => {
                const range = sheet.getRange(out.cellAddress);
                range.load("values");
                return range;
            });

            await ctx.sync();

            // Save original formulas
            const originalFormulas = inputRanges.map(
                (r) => r.formulas[0][0] as string
            );

            try {
                // ── Iteration Loop ──────────────────────────────
                const batchSize = 1; // One iteration per Excel.run sync

                for (let iter = 0; iter < config.iterations; iter++) {
                    if (_cancelled) break;

                    // Sample all inputs
                    const samples: number[] = [];
                    for (let j = 0; j < inputs.length; j++) {
                        const val = sampleDistribution(
                            inputs[j].type,
                            inputs[j].params
                        );
                        samples.push(val);
                        inputRanges[j].values = [[val]];
                    }
                    inputSamples.push(samples);

                    // Recalculate
                    ctx.application.calculate(Excel.CalculationType.full);

                    // Read outputs
                    for (const r of outputRanges) {
                        r.load("values");
                    }
                    await ctx.sync();

                    for (let k = 0; k < outputs.length; k++) {
                        const val = outputRanges[k].values[0][0];
                        outputValues[k].push(
                            typeof val === "number" ? val : parseFloat(String(val)) || 0
                        );
                    }

                    setCurrentIteration(iter + 1);

                    // Progress callback (throttled)
                    if (onProgress && (iter % 10 === 0 || iter === config.iterations - 1)) {
                        const elapsed = Date.now() - startTime;
                        const ips = ((iter + 1) / elapsed) * 1000;
                        onProgress({
                            status: _cancelled ? "cancelled" : "running",
                            currentIteration: iter + 1,
                            totalIterations: config.iterations,
                            iterationsPerSecond: ips,
                            elapsedMs: elapsed,
                            estimatedRemainingMs:
                                ips > 0
                                    ? ((config.iterations - iter - 1) / ips) * 1000
                                    : 0,
                        });
                    }
                }
            } finally {
                // ── Restore original formulas ───────────────────
                for (let j = 0; j < inputs.length; j++) {
                    inputRanges[j].formulas = [[originalFormulas[j]]];
                }
                await ctx.sync();
            }
        });
    } catch (error) {
        console.error("[MC] Simulation failed in runSimulation inside Excel.run:", error);
        throw error; // Re-throw so useSimulation hook can catch and display it
    } finally {
        setSimulating(false);
    }

    const elapsedMs = Date.now() - startTime;

    // ── Compute statistics ──────────────────────────────────────
    const outputResults: OutputResults[] = outputs.map((out, idx) => ({
        outputId: out.id,
        name: out.name,
        cellAddress: out.cellAddress,
        values: outputValues[idx],
        stats: computeStatistics(outputValues[idx], config.confidenceLevel),
    }));

    // ── Compute sensitivity for each output ─────────────────────
    const sensitivityMap = new Map<string, ReturnType<typeof computeSensitivity>>();
    const inputNames = inputs.map((i) => i.name);
    const inputIds = inputs.map((i) => i.id);

    for (let k = 0; k < outputs.length; k++) {
        const sens = computeSensitivity(
            inputSamples,
            outputValues[k],
            inputNames,
            inputIds
        );
        sensitivityMap.set(outputs[k].id, sens);
    }

    // Final progress
    if (onProgress) {
        onProgress({
            status: _cancelled ? "cancelled" : "completed",
            currentIteration: _cancelled ? 0 : config.iterations,
            totalIterations: config.iterations,
            iterationsPerSecond: (config.iterations / elapsedMs) * 1000,
            elapsedMs,
            estimatedRemainingMs: 0,
        });
    }

    return {
        config,
        outputs: outputResults,
        sensitivity: sensitivityMap,
        elapsedMs,
        inputSamples,
    };
}
