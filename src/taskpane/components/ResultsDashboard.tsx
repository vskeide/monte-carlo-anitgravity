/* ---------------------------------------------------------------
 * ResultsDashboard.tsx — Main results view with output selector
 * --------------------------------------------------------------- */

import React, { useState } from "react";
import { Select, Label } from "@fluentui/react-components";
import { ChartMultiple24Regular } from "@fluentui/react-icons";
import { SimulationResults } from "../../engine/types";
import { HistogramChart } from "./HistogramChart";
import { CDFChart } from "./CDFChart";
import { StatisticsTable } from "./StatisticsTable";

interface Props {
    results: SimulationResults | null;
    threshold?: number;
}

export const ResultsDashboard: React.FC<Props> = ({ results, threshold = 0 }) => {
    const [selectedOutputIdx, setSelectedOutputIdx] = useState(0);

    if (!results || results.outputs.length === 0) {
        return (
            <div className="empty-state">
                <ChartMultiple24Regular style={{ fontSize: 48 }} />
                <p>
                    No simulation results yet.<br />
                    Go to <strong>Setup</strong> to configure and run a simulation.
                </p>
            </div>
        );
    }

    const output = results.outputs[selectedOutputIdx] ?? results.outputs[0];

    return (
        <div>
            {/* ── Output selector ───────────────────────────── */}
            {results.outputs.length > 1 && (
                <div className="card" style={{ paddingBottom: 10 }}>
                    <div className="flex-row">
                        <Label htmlFor="output-sel" style={{ fontSize: 12 }}>
                            Output:
                        </Label>
                        <Select
                            id="output-sel"
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

            {/* ── Summary banner ─────────────────────────────── */}
            <div className="card" style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", color: "#fff" }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    {output.name}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 11 }}>
                    <div>
                        <div style={{ opacity: 0.7, marginBottom: 2 }}>Mean</div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>
                            {output.stats.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div>
                        <div style={{ opacity: 0.7, marginBottom: 2 }}>Std Dev</div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>
                            {output.stats.stdDev.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div>
                        <div style={{ opacity: 0.7, marginBottom: 2 }}>P(X &lt; {threshold.toLocaleString(undefined, { maximumFractionDigits: 4 })})</div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>
                            {(output.stats.probNegative * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Histogram ──────────────────────────────────── */}
            <div className="card">
                <HistogramChart output={output} />
            </div>

            {/* ── CDF ────────────────────────────────────────── */}
            <div className="card">
                <CDFChart output={output} />
            </div>

            {/* ── Statistics table ────────────────────────────── */}
            <StatisticsTable stats={output.stats} name={output.name} />
        </div>
    );
};
