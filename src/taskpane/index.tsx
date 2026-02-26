/* ---------------------------------------------------------------
 * index.tsx — Task pane entry point (shared runtime)
 *
 * In shared runtime mode, this single HTML page hosts:
 *   - The React task pane UI
 *   - Custom Functions (MC.Normal, MC.PERT, etc.)
 *   - Ribbon command handlers
 * --------------------------------------------------------------- */

/* global Office, CustomFunctions */

import React from "react";
import { createRoot } from "react-dom/client";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { App } from "./App";
import { restoreFromStorage } from "../shared/storage";
import { initCustomFunctions } from "../functions/functions";
import { initCommands } from "../commands/commands";
import "./styles.css";

// Track if we've already initialized
let initialized = false;

function mountApp(): void {
    if (initialized) return;
    initialized = true;

    console.log("[MC] Mounting app...");

    // Register custom functions and commands
    initCustomFunctions();
    initCommands();

    // Restore persisted state
    restoreFromStorage();

    // Mount React UI
    const container = document.getElementById("root");
    if (container) {
        const root = createRoot(container);
        root.render(
            <FluentProvider theme={webLightTheme}>
                <App />
            </FluentProvider>
        );
        console.log("[MC] ✅ React app mounted");
    }
}

// Strategy 1: Use Office.onReady (preferred)
Office.onReady(() => {
    console.log("[MC] Office.onReady fired");
    mountApp();
});

// Strategy 2: Fallback timer if Office.onReady never fires
// (e.g. due to tracking prevention blocking storage)
setTimeout(() => {
    if (!initialized) {
        console.warn("[MC] Office.onReady did not fire within 3s — mounting with fallback");
        mountApp();
    }
}, 3000);
