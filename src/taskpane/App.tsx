/* ---------------------------------------------------------------
 * App.tsx — Main task pane application with tab navigation
 * --------------------------------------------------------------- */

import React, { useState } from "react";
import {
    PlayCircle24Regular,
    ChartMultiple24Regular,
    DataTrending24Regular,
    ArrowDownload24Regular,
    Settings24Regular,
} from "@fluentui/react-icons";
import { SimulationSetup } from "./components/SimulationSetup";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { SensitivityPanel } from "./components/SensitivityPanel";
import { ExportPanel } from "./components/ExportPanel";
import { useSimulation } from "./hooks/useSimulation";

type Tab = "setup" | "results" | "sensitivity" | "export";

export const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>("setup");
    const sim = useSimulation();

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: "setup", label: "Setup", icon: <Settings24Regular /> },
        { id: "results", label: "Results", icon: <ChartMultiple24Regular /> },
        { id: "sensitivity", label: "Sensitivity", icon: <DataTrending24Regular /> },
        { id: "export", label: "Export", icon: <ArrowDownload24Regular /> },
    ];

    return (
        <div style={styles.shell}>
            {/* ── Header ─────────────────────────────────────── */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <PlayCircle24Regular style={{ color: "#4F46E5" }} />
                    <span style={styles.title}>Monte Carlo Sim</span>
                </div>
                <span style={styles.version}>v1.0</span>
            </div>

            {/* ── Tab Bar ────────────────────────────────────── */}
            <div className="tab-bar">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        className={`tab-btn ${activeTab === t.id ? "active" : ""}`}
                        onClick={() => setActiveTab(t.id)}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ────────────────────────────────── */}
            <div style={styles.content}>
                {activeTab === "setup" && (
                    <SimulationSetup
                        config={sim.config}
                        onConfigChange={sim.setConfig}
                        progress={sim.progress}
                        onRun={sim.run}
                        onCancel={sim.cancel}
                        isRunning={sim.isRunning}
                    />
                )}
                {activeTab === "results" && (
                    <ResultsDashboard results={sim.results} threshold={sim.config.probabilityThreshold} />
                )}
                {activeTab === "sensitivity" && (
                    <SensitivityPanel results={sim.results} />
                )}
                {activeTab === "export" && (
                    <ExportPanel results={sim.results} />
                )}
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    shell: {
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#f8f9fc",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px 8px",
        background: "#fff",
        borderBottom: "1px solid #e2e4ea",
    },
    headerLeft: {
        display: "flex",
        alignItems: "center",
        gap: 8,
    },
    title: {
        fontWeight: 700,
        fontSize: 15,
        color: "#1a1a2e",
        letterSpacing: "-0.3px",
    },
    version: {
        fontSize: 10,
        color: "#9ca3af",
        fontWeight: 500,
    },
    content: {
        flex: 1,
        overflow: "auto",
        padding: "12px",
    },
};
