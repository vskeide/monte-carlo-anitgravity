/* ---------------------------------------------------------------
 * index.tsx — Task pane entry point
 * --------------------------------------------------------------- */

/* global Office */

import React from "react";
import { createRoot } from "react-dom/client";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { App } from "./App";
import { restoreFromStorage } from "../shared/storage";
import "./styles.css";

// ── Shared Runtime: load custom functions & commands in this context ──
import "../functions/functions";   // registers CustomFunctions.associate
import "../commands/commands";     // registers Office.actions.associate

Office.onReady(() => {
    restoreFromStorage();
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
