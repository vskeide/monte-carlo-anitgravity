import React, { useState, useEffect } from "react";
import {
    Button,
    Input,
    Label,
    MessageBar,
    MessageBarBody,
    Tooltip,
} from "@fluentui/react-components";
import {
    Play24Filled,
    Stop24Filled,
    Info24Regular,
} from "@fluentui/react-icons";
import {
    SimulationConfig,
    SimulationProgress,
    DistributionInput,
    SimulationOutput,
} from "../../engine/types";
import { getInputs, getOutputs } from "../../shared/storage";
import { MIN_ITERATIONS, MAX_ITERATIONS, formatNumber } from "../../shared/constants";
import { MiniDistChart } from "./MiniDistChart";

// Format distribution params as a short annotation
function paramLabel(type: string, params: Record<string, number | number[]>): string {
    const p = (k: string) => {
        const v = params[k];
        const n = typeof v === "number" ? v : (v as number[])?.[0] ?? 0;
        return Number.isInteger(n) ? String(n) : n.toFixed(n < 1 ? 3 : 2);
    };
    switch (type) {
        case "normal": return `μ=${p("mean")}, σ=${p("stdev")}`;
        case "triangular": return `${p("min")} – ${p("mode")} – ${p("max")}`;
        case "pert": return `${p("min")} – ${p("mode")} – ${p("max")}`;
        case "uniform": return `${p("min")} – ${p("max")}`;
        case "lognormal": return `μ=${p("mu")}, σ=${p("sigma")}`;
        default: return "";
    }
}

interface Props {
    config: SimulationConfig;
    onConfigChange: (c: SimulationConfig) => void;
    progress: SimulationProgress | null;
    onRun: () => void;
    onCancel: () => void;
    isRunning: boolean;
}

export const SimulationSetup: React.FC<Props> = ({
    config,
    onConfigChange,
    progress,
    onRun,
    onCancel,
    isRunning,
}) => {
    const [inputs, setInputs] = useState<DistributionInput[]>(getInputs());
    const [outputs, setOutputs] = useState<SimulationOutput[]>(getOutputs());

    // Poll for new inputs/outputs every 2 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setInputs(getInputs());
            setOutputs(getOutputs());
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const pct = progress
        ? Math.round((progress.currentIteration / progress.totalIterations) * 100)
        : 0;

    return (
        <div>
            {/* ── Iterations ─────────────────────────────────── */}
            <div className="card">
                <div className="card-header">Simulation Settings</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                        <Label htmlFor="iter-input" style={{ fontSize: 11, display: "block", marginBottom: 3 }}>
                            Iterations
                        </Label>
                        <input
                            id="iter-input"
                            type="number"
                            min={100}
                            max={50000}
                            step={100}
                            value={config.iterations}
                            onChange={(e) => {
                                const v = Math.max(100, Math.min(50000, parseInt(e.target.value) || 1000));
                                onConfigChange({ ...config, iterations: v });
                            }}
                            disabled={isRunning}
                            style={{ width: "100%", padding: "5px 8px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12 }}
                        />
                    </div>
                    <div>
                        <Label htmlFor="seed-input" style={{ fontSize: 11, display: "block", marginBottom: 3 }}>
                            Seed (0=random)
                        </Label>
                        <input
                            id="seed-input"
                            type="number"
                            min={0}
                            step={1}
                            value={config.seed}
                            onChange={(e) => onConfigChange({ ...config, seed: parseInt(e.target.value) || 0 })}
                            disabled={isRunning}
                            style={{ width: "100%", padding: "5px 8px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12 }}
                        />
                    </div>
                    <div>
                        <Label htmlFor="threshold-input" style={{ fontSize: 11, display: "block", marginBottom: 3 }}>
                            P(X &lt; ?)
                        </Label>
                        <input
                            id="threshold-input"
                            type="number"
                            step="any"
                            value={config.probabilityThreshold}
                            onChange={(e) => onConfigChange({ ...config, probabilityThreshold: parseFloat(e.target.value) || 0 })}
                            disabled={isRunning}
                            style={{ width: "100%", padding: "5px 8px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12 }}
                        />
                    </div>
                </div>

                <div className="flex-row">
                    <Button
                        appearance="primary"
                        icon={<Play24Filled />}
                        onClick={onRun}
                        disabled={isRunning}
                        style={{ flex: 1 }}
                    >
                        Run Simulation
                    </Button>
                    {isRunning && (
                        <Button
                            appearance="outline"
                            icon={<Stop24Filled />}
                            onClick={onCancel}
                        >
                            Stop
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Progress ───────────────────────────────────── */}
            {progress && progress.status === "running" && (
                <div className="card">
                    <div className="card-header">Progress</div>
                    <div className="progress-bar-track">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <div
                        className="flex-between mt-8"
                        style={{ fontSize: 11, color: "#6b7280" }}
                    >
                        <span>
                            {progress.currentIteration.toLocaleString()} /{" "}
                            {progress.totalIterations.toLocaleString()}
                        </span>
                        <span>
                            {progress.iterationsPerSecond.toFixed(0)} iter/s
                        </span>
                    </div>
                </div>
            )}

            {progress && progress.status === "completed" && (
                <MessageBar intent="success" style={{ marginBottom: 12 }}>
                    <MessageBarBody>
                        Simulation completed — {progress.totalIterations.toLocaleString()} iterations
                        in {(progress.elapsedMs / 1000).toFixed(1)}s
                    </MessageBarBody>
                </MessageBar>
            )}

            {progress && progress.status === "error" && (
                <MessageBar intent="error" style={{ marginBottom: 12 }}>
                    <MessageBarBody>Simulation failed. Check inputs and outputs.</MessageBarBody>
                </MessageBar>
            )}

            {/* ── Registered Inputs ──────────────────────────── */}
            <div className="card">
                <div className="card-header">
                    <Info24Regular />
                    Distribution Inputs ({inputs.length})
                </div>
                {inputs.length === 0 ? (
                    <p className="muted" style={{ fontSize: 11 }}>
                        No inputs detected. Use <code className="mono">=MC.Normal()</code>,{" "}
                        <code className="mono">=MC.PERT()</code>, etc. in cells.
                    </p>
                ) : (
                    <ul className="dist-list">
                        {inputs.map((inp) => (
                            <li key={inp.id} className="dist-item-expanded">
                                <div className="dist-item-info">
                                    <span className="dist-item-name">{inp.name}</span>
                                    <span className="dist-item-params">{paramLabel(inp.type, inp.params)}</span>
                                </div>
                                <MiniDistChart type={inp.type} params={inp.params} width={90} height={30} />
                                <span className="dist-badge">{inp.type}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* ── Registered Outputs ─────────────────────────── */}
            <div className="card">
                <div className="card-header">
                    <Info24Regular />
                    Simulation Outputs ({outputs.length})
                </div>
                {outputs.length === 0 ? (
                    <p className="muted" style={{ fontSize: 11 }}>
                        No outputs detected. Use <code className="mono">=MC.Output(cell, "name")</code>{" "}
                        to mark output cells.
                    </p>
                ) : (
                    <ul className="dist-list">
                        {outputs.map((out) => (
                            <li key={out.id} className="dist-item">
                                <span>{out.name}</span>
                                <span className="muted mono">{out.cellAddress}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
