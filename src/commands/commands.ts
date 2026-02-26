/* ---------------------------------------------------------------
 * commands.ts — Ribbon command handlers
 * --------------------------------------------------------------- */

/* global Office */

/**
 * Called when the "Run Simulation" ribbon button is clicked.
 * Opens the task pane (the actual simulation is triggered from there).
 */
function runSimulation(event: Office.AddinCommands.Event): void {
    event.completed();
}

/** Register command — called from Office.onReady in the shared runtime */
export function initCommands(): void {
    try {
        Office.actions.associate("runSimulation", runSimulation);
    } catch (e) {
        console.warn("Office.actions.associate failed:", e);
    }
}
