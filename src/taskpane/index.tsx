/* ---------------------------------------------------------------
 * index.tsx — Task pane entry point (shared runtime)
 *
 * In shared runtime mode, this single HTML page hosts:
 *   - The React task pane UI
 *   - Custom Functions (MC.Normal, MC.PERT, etc.)
 *   - Ribbon command handlers
 * --------------------------------------------------------------- */

/* global Office */

import React from "react";
import { createRoot } from "react-dom/client";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { App } from "./App";
import { restoreFromStorage } from "../shared/storage";
import { initCustomFunctions } from "../functions/functions";
import { initCommands } from "../commands/commands";
import "./styles.css";

Office.onReady(() => {
    // 1. Register custom functions and ribbon commands
    initCustomFunctions();
    initCommands();

    // 2. Restore any persisted state
    restoreFromStorage();

    // 3. Mount the React UI
    const container = document.getElementById("root");
    if (container) {
        const root = createRoot(container);
        root.render(
            <FluentProvider theme={webLightTheme}>
                <App />
            </FluentProvider>
        );
    }
});
