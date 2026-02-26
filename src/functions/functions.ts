/* ---------------------------------------------------------------
 * functions.ts — Excel Custom Functions (MC namespace)
 *
 * These run in the Custom Functions runtime.  Each function
 * registers the distribution in shared storage and returns either
 * the static expected value (when not simulating) or a sampled
 * random value (during simulation).
 *
 * Custom function JSDoc tags are used by custom-functions-metadata
 * to generate functions.json automatically.  Since we're doing
 * this manually, we just define and associate them.
 * --------------------------------------------------------------- */

/* global CustomFunctions */

import { registerInput, registerOutput, isSimulating } from "../shared/storage";
import {
    sampleNormal,
    staticNormal,
    sampleUniform,
    staticUniform,
    sampleTriangular,
    staticTriangular,
    samplePERT,
    staticPERT,
    sampleLognormal,
    staticLognormal,
} from "../engine/distributions";
import { DistributionType } from "../engine/types";

// ── Helper: generate a stable ID from address context ───────────

let _callCounter = 0;

function nextId(prefix: string): string {
    return `${prefix}_${++_callCounter}`;
}

function registerDist(
    type: DistributionType,
    params: Record<string, number | number[]>,
    name?: string
): void {
    const id = nextId(type);
    registerInput({
        id,
        cellAddress: "", // Populated at runtime when possible
        type,
        params,
        name: name || `${type}_${id}`,
    });
}

// ── MC.NORMAL ───────────────────────────────────────────────────

function mcNormal(
    mean: number,
    stdev: number,
    name?: string
): number {
    registerDist("normal", { mean, stdev }, name);
    if (isSimulating()) return sampleNormal(mean, stdev);
    return staticNormal(mean, stdev);
}

// ── MC.UNIFORM ──────────────────────────────────────────────────

function mcUniform(
    min: number,
    max: number,
    name?: string
): number {
    registerDist("uniform", { min, max }, name);
    if (isSimulating()) return sampleUniform(min, max);
    return staticUniform(min, max);
}

// ── MC.TRIANGULAR ───────────────────────────────────────────────

function mcTriangular(
    min: number,
    mode: number,
    max: number,
    name?: string
): number {
    registerDist("triangular", { min, mode, max }, name);
    if (isSimulating()) return sampleTriangular(min, mode, max);
    return staticTriangular(min, mode, max);
}

// ── MC.PERT ─────────────────────────────────────────────────────

function mcPERT(
    min: number,
    mode: number,
    max: number,
    name?: string
): number {
    registerDist("pert", { min, mode, max }, name);
    if (isSimulating()) return samplePERT(min, mode, max);
    return staticPERT(min, mode, max);
}

// ── MC.LOGNORMAL ────────────────────────────────────────────────

function mcLognormal(
    mu: number,
    sigma: number,
    name?: string
): number {
    registerDist("lognormal", { mu, sigma }, name);
    if (isSimulating()) return sampleLognormal(mu, sigma);
    return staticLognormal(mu, sigma);
}

// ── MC.OUTPUT ───────────────────────────────────────────────────
// Pass-through that marks a cell as a simulation output.

function mcOutput(value: number, name: string): number {
    const id = nextId("output");
    registerOutput({
        id,
        cellAddress: "",  // Populated contextually
        name: name || `Output_${id}`,
    });
    return value;
}

// ── MC.SIMID ────────────────────────────────────────────────────
// Returns the current iteration number (0 when not simulating).

function mcSimId(): number {
    return 0; // Updated during simulation via the engine
}

// ── Register with Excel ─────────────────────────────────────────

Office.onReady(() => {
    // Associate functions with their names in the MC namespace
    CustomFunctions.associate("NORMAL", mcNormal);
    CustomFunctions.associate("UNIFORM", mcUniform);
    CustomFunctions.associate("TRIANGULAR", mcTriangular);
    CustomFunctions.associate("PERT", mcPERT);
    CustomFunctions.associate("LOGNORMAL", mcLognormal);
    CustomFunctions.associate("OUTPUT", mcOutput);
    CustomFunctions.associate("SIMID", mcSimId);
});
