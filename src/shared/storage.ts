/* ---------------------------------------------------------------
 * storage.ts — Cross-runtime shared state
 *
 * In shared runtime mode both custom functions and the task pane
 * share one JS context.  We use plain in-memory Maps — no
 * localStorage.  Functions re-register themselves each time Excel
 * evaluates them, so the Maps always reflect the *current*
 * workbook's MC functions.
 * --------------------------------------------------------------- */

import { DistributionInput, SimulationOutput } from "../engine/types";

/** In-memory registry — works in shared runtime mode */
const _inputs = new Map<string, DistributionInput>();
const _outputs = new Map<string, SimulationOutput>();
let _simulating = false;
let _currentIteration = 0;

// ── Input distributions ─────────────────────────────────────────

export function registerInput(input: DistributionInput): void {
    _inputs.set(input.id, input);
}

export function getInputs(): DistributionInput[] {
    return Array.from(_inputs.values());
}

export function getInput(id: string): DistributionInput | undefined {
    return _inputs.get(id);
}

export function clearInputs(): void {
    _inputs.clear();
}

export function removeInput(id: string): void {
    _inputs.delete(id);
}

// ── Output cells ────────────────────────────────────────────────

export function registerOutput(output: SimulationOutput): void {
    _outputs.set(output.id, output);
}

export function getOutputs(): SimulationOutput[] {
    return Array.from(_outputs.values());
}

export function clearOutputs(): void {
    _outputs.clear();
}

// ── Clear everything (used on add-in startup) ───────────────────

export function clearAll(): void {
    _inputs.clear();
    _outputs.clear();
    _simulating = false;
    _currentIteration = 0;
    // Also wipe any leftover localStorage from older builds
    try { localStorage.removeItem("mc_registry"); } catch { /* noop */ }
}

// ── Simulation state ────────────────────────────────────────────

export function isSimulating(): boolean {
    return _simulating;
}

export function setSimulating(flag: boolean): void {
    _simulating = flag;
}

export function getCurrentIteration(): number {
    return _currentIteration;
}

export function setCurrentIteration(iter: number): void {
    _currentIteration = iter;
}

