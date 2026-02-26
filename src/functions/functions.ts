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

// ── Helper: stable ID from name or params ───────────────────────

let _anonCounter = 0;

function stableId(type: string, name: string | undefined, address: string): string {
    if (name) return `${type}:${name}`;
    if (address) return `${type}:${address}`;
    return `${type}_anon_${++_anonCounter}`;
}

function registerDist(
    type: DistributionType,
    params: Record<string, number | number[]>,
    name: string | undefined,
    cellAddress: string
): void {
    console.log(`[MC] RegisterDist: type=${type}, name=${name}, rawAddress=${cellAddress}`);
    const id = stableId(type, name, cellAddress);
    registerInput({
        id,
        cellAddress,
        type,
        params,
        name: name || id,
    });
}

// ── MC.NORMAL ───────────────────────────────────────────────────

function mcNormal(
    mean: number,
    stdev: number,
    name: string | undefined,
    invocation: any
): number {
    registerDist("normal", { mean, stdev }, name, invocation.address || "");
    if (isSimulating()) return sampleNormal(mean, stdev);
    return staticNormal(mean, stdev);
}

// ── MC.UNIFORM ──────────────────────────────────────────────────

function mcUniform(
    min: number,
    max: number,
    name: string | undefined,
    invocation: any
): number {
    registerDist("uniform", { min, max }, name, invocation.address || "");
    if (isSimulating()) return sampleUniform(min, max);
    return staticUniform(min, max);
}

// ── MC.TRIANGULAR ───────────────────────────────────────────────

function mcTriangular(
    min: number,
    mode: number,
    max: number,
    name: string | undefined,
    invocation: any
): number {
    registerDist("triangular", { min, mode, max }, name, invocation.address || "");
    if (isSimulating()) return sampleTriangular(min, mode, max);
    return staticTriangular(min, mode, max);
}

// ── MC.PERT ─────────────────────────────────────────────────────

function mcPERT(
    min: number,
    mode: number,
    max: number,
    name: string | undefined,
    invocation: any
): number {
    registerDist("pert", { min, mode, max }, name, invocation.address || "");
    if (isSimulating()) return samplePERT(min, mode, max);
    return staticPERT(min, mode, max);
}

// ── MC.LOGNORMAL ────────────────────────────────────────────────

function mcLognormal(
    mu: number,
    sigma: number,
    name: string | undefined,
    invocation: any
): number {
    registerDist("lognormal", { mu, sigma }, name, invocation.address || "");
    if (isSimulating()) return sampleLognormal(mu, sigma);
    return staticLognormal(mu, sigma);
}

// ── MC.OUTPUT ───────────────────────────────────────────────────
// Pass-through that marks a cell as a simulation output.

function mcOutput(value: number, name: string, invocation: any): number {
    const address = invocation.address || "";
    console.log(`[MC] mcOutput: name=${name}, rawAddress=${address}`);
    const id = stableId("output", name, address);
    registerOutput({
        id,
        cellAddress: address,
        name: name || id,
    });
    return value;
}

// ── MC.SIMID ────────────────────────────────────────────────────
// Returns the current iteration number (0 when not simulating).

function mcSimId(): number {
    return 0; // Updated during simulation via the engine
}

// ── Register with Excel ─────────────────────────────────────────
// Exported so it can be called from Office.onReady() in the shared runtime.

export function initCustomFunctions(): void {
    console.log("[MC] initCustomFunctions called");
    console.log("[MC] typeof CustomFunctions =", typeof CustomFunctions);
    try {
        CustomFunctions.associate("NORMAL", mcNormal);
        CustomFunctions.associate("UNIFORM", mcUniform);
        CustomFunctions.associate("TRIANGULAR", mcTriangular);
        CustomFunctions.associate("PERT", mcPERT);
        CustomFunctions.associate("LOGNORMAL", mcLognormal);
        CustomFunctions.associate("OUTPUT", mcOutput);
        CustomFunctions.associate("SIMID", mcSimId);
        console.log("[MC] ✅ All 7 functions registered successfully");
    } catch (e) {
        console.error("[MC] ❌ CustomFunctions.associate failed:", e);
    }
}
