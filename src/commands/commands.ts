/* ---------------------------------------------------------------
 * commands.ts — Ribbon command handlers
 * --------------------------------------------------------------- */

/* global Office */

Office.onReady(() => {
    // Commands runtime is ready
});

/**
 * Called when the "Run Simulation" ribbon button is clicked.
 * Opens the task pane (the actual simulation is triggered from there).
 */
function runSimulation(event: Office.AddinCommands.Event): void {
    // The ribbon "Run Simulation" button opens the task pane
    // where the user can configure and launch the simulation.
    // Actual simulation logic lives in the task pane context.
    event.completed();
}

// Register the command
Office.actions.associate("runSimulation", runSimulation);
