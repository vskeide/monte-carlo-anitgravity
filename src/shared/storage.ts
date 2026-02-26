/* ---------------------------------------------------------------
 * storage.ts — Cross-runtime shared state
 *
 * Office-JS custom functions and the task pane run in separate
 * JS runtimes.  We use a simple in-memory registry that's shared
 * when both runtimes coincide (shared runtime mode) or falls back
 * to localStorage for persistence.
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
    persistToStorage();
}

export function getInputs(): DistributionInput[] {
    return Array.from(_inputs.values());
}

export function getInput(id: string): DistributionInput | undefined {
    return _inputs.get(id);
}

export function clearInputs(): void {
    _inputs.clear();
    persistToStorage();
}

export function removeInput(id: string): void {
    _inputs.delete(id);
    persistToStorage();
}

// ── Output cells ────────────────────────────────────────────────

export function registerOutput(output: SimulationOutput): void {
    _outputs.set(output.id, output);
    persistToStorage();
}

export function getOutputs(): SimulationOutput[] {
    return Array.from(_outputs.values());
}

export function clearOutputs(): void {
    _outputs.clear();
    persistToStorage();
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

// ── LocalStorage persistence (fallback for split runtimes) ──────

function persistToStorage(): void {
    try {
        const data = {
            inputs: Array.from(_inputs.entries()),
            outputs: Array.from(_outputs.entries()),
        };
        localStorage.setItem("mc_registry", JSON.stringify(data));
    } catch {
        // localStorage may not be available in all contexts
    }
}

export function restoreFromStorage(): void {
    try {
        const raw = localStorage.getItem("mc_registry");
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data.inputs) {
            for (const [k, v] of data.inputs) {
                _inputs.set(k, v as DistributionInput);
            }
        }
        if (data.outputs) {
            for (const [k, v] of data.outputs) {
                _outputs.set(k, v as SimulationOutput);
            }
        }
    } catch {
        // Silently ignore
    }
}
