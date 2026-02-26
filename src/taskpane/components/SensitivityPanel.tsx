/* ---------------------------------------------------------------
 * SensitivityPanel.tsx — Sensitivity analysis tab
 * --------------------------------------------------------------- */

import React, { useState } from "react";
import { Select, Label } from "@fluentui/react-components";
import { DataTrending24Regular } from "@fluentui/react-icons";
import { SimulationResults } from "../../engine/types";
import { TornadoChart } from "./TornadoChart";

interface Props {
    results: SimulationResults | null;
}

export const SensitivityPanel: React.FC<Props> = ({ results }) => {
    const [selectedOutputIdx, setSelectedOutputIdx] = useState(0);

    if (!results || results.outputs.length === 0) {
        return (
            <div className="empty-state">
                <DataTrending24Regular style={{ fontSize: 48 }} />
                <p>
                    Run a simulation first to see sensitivity analysis.
                </p>
            </div>
        );
    }

    const output = results.outputs[selectedOutputIdx] ?? results.outputs[0];
    const sensData = results.sensitivity.get(output.outputId) ?? [];

    return (
        <div>
            {/* ── Output selector ───────────────────────────── */}
            {results.outputs.length > 1 && (
                <div className="card" style={{ paddingBottom: 10 }}>
                    <div className="flex-row">
                        <Label htmlFor="sens-output-sel" style={{ fontSize: 12 }}>
                            Output:
                        </Label>
                        <Select
                            id="sens-output-sel"
                            size="small"
                            value={String(selectedOutputIdx)}
                            onChange={(_, d) =>
                                setSelectedOutputIdx(parseInt(d.value))
                            }
                        >
                            {results.outputs.map((o, i) => (
                                <option key={o.outputId} value={String(i)}>
                                    {o.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>
            )}

            {/* ── Tornado ────────────────────────────────────── */}
            <div className="card">
                {sensData.length > 0 ? (
                    <TornadoChart
                        data={sensData}
                        title={`Sensitivity — ${output.name}`}
                    />
                ) : (
                    <p className="muted" style={{ fontSize: 12, textAlign: "center", padding: 20 }}>
                        No sensitivity data available.
                    </p>
                )}
            </div>

            {/* ── Coefficients table ─────────────────────────── */}
            {sensData.length > 0 && (
                <div className="card">
                    <div className="card-header">Regression Coefficients</div>
                    <table className="stats-table">
                        <thead>
                            <tr>
                                <th>Input</th>
                                <th style={{ textAlign: "right" }}>SRC</th>
                                <th style={{ textAlign: "right" }}>Rank ρ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sensData.map((s) => (
                                <tr key={s.inputId}>
                                    <td>{s.inputName}</td>
                                    <td style={{ textAlign: "right" }}>
                                        {s.coefficient.toFixed(4)}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        {s.rankCorrelation.toFixed(4)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
