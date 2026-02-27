/* ---------------------------------------------------------------
 * ExportPanel.tsx — Export results to Excel sheet or PNG
 * --------------------------------------------------------------- */

/* global Excel */

import React, { useState } from "react";
import { Button, MessageBar, MessageBarBody, Spinner } from "@fluentui/react-components";
import {
    ArrowDownload24Regular,
    Table24Regular,
} from "@fluentui/react-icons";
import { SimulationResults } from "../../engine/types";
import { formatNumber, formatPercent } from "../../shared/constants";

interface Props {
    results: SimulationResults | null;
}

export const ExportPanel: React.FC<Props> = ({ results }) => {
    const [exporting, setExporting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    if (!results || results.outputs.length === 0) {
        return (
            <div className="empty-state">
                <ArrowDownload24Regular style={{ fontSize: 48 }} />
                <p>Run a simulation first to export results.</p>
            </div>
        );
    }

    const exportToSheet = async () => {
        setExporting(true);
        setMessage(null);
        try {
            await Excel.run(async (ctx) => {
                // Create a new sheet for results
                const sheetName = `MC Results ${new Date().toLocaleTimeString().replace(/:/g, "")}`;
                const sheet = ctx.workbook.worksheets.add(sheetName);

                let row = 0;

                // ── Header ──────────────────────────────────────
                sheet.getCell(row, 0).values = [["Monte Carlo Simulation Results"]];
                sheet.getCell(row, 0).format.font.bold = true;
                sheet.getCell(row, 0).format.font.size = 14;
                row += 1;

                sheet.getCell(row, 0).values = [[`Iterations: ${results.config.iterations.toLocaleString()}`]];
                sheet.getCell(row, 1).values = [[`Elapsed: ${(results.elapsedMs / 1000).toFixed(1)}s`]];
                row += 2;

                // ── Per output ───────────────────────────────────
                for (const output of results.outputs) {
                    const { stats } = output;

                    // Output header
                    sheet.getCell(row, 0).values = [[output.name]];
                    sheet.getCell(row, 0).format.font.bold = true;
                    sheet.getCell(row, 0).format.font.size = 12;
                    row += 1;

                    // Statistics
                    const statRows: [string, string | number][] = [
                        ["Minimum", stats.minimum],
                        ["Maximum", stats.maximum],
                        ["Mean", stats.mean],
                        ["Median", stats.median],
                        ["Mode", stats.mode],
                        ["Std Deviation", stats.stdDev],
                        ["Skewness", stats.skewness],
                        ["Kurtosis", stats.kurtosis],
                        ["5th Percentile", stats.percentiles.p5],
                        ["25th Percentile", stats.percentiles.p25],
                        ["50th Percentile", stats.percentiles.p50],
                        ["75th Percentile", stats.percentiles.p75],
                        ["95th Percentile", stats.percentiles.p95],
                        ["90% CI Lower", stats.confidenceInterval[0]],
                        ["90% CI Upper", stats.confidenceInterval[1]],
                        [`P(X < ${results.config.probabilityThreshold})`, stats.probNegative],
                    ];

                    sheet.getCell(row, 0).values = [["Statistic"]];
                    sheet.getCell(row, 1).values = [["Value"]];
                    sheet.getCell(row, 0).format.font.bold = true;
                    sheet.getCell(row, 1).format.font.bold = true;
                    row += 1;

                    for (const [label, value] of statRows) {
                        sheet.getCell(row, 0).values = [[label]];
                        sheet.getCell(row, 1).values = [[typeof value === "number" ? value : 0]];
                        row += 1;
                    }

                    row += 1;

                    // Sensitivity
                    const sens = results.sensitivity.get(output.outputId);
                    if (sens && sens.length > 0) {
                        sheet.getCell(row, 0).values = [["Sensitivity Analysis"]];
                        sheet.getCell(row, 0).format.font.bold = true;
                        row += 1;

                        sheet.getCell(row, 0).values = [["Input"]];
                        sheet.getCell(row, 1).values = [["SRC"]];
                        sheet.getCell(row, 2).values = [["Rank ρ"]];
                        sheet.getCell(row, 0).format.font.bold = true;
                        sheet.getCell(row, 1).format.font.bold = true;
                        sheet.getCell(row, 2).format.font.bold = true;
                        row += 1;

                        for (const s of sens) {
                            sheet.getCell(row, 0).values = [[s.inputName]];
                            sheet.getCell(row, 1).values = [[s.coefficient]];
                            sheet.getCell(row, 2).values = [[s.rankCorrelation]];
                            row += 1;
                        }

                        row += 1;
                    }

                    // Raw data header
                    sheet.getCell(row, 0).values = [["Iteration Values"]];
                    sheet.getCell(row, 0).format.font.bold = true;
                    row += 1;

                    // Write first 5000 values (or all if fewer)
                    const maxVals = Math.min(output.values.length, 5000);
                    const valData: number[][] = [];
                    for (let i = 0; i < maxVals; i++) {
                        valData.push([output.values[i]]);
                    }
                    if (valData.length > 0) {
                        const range = sheet.getRangeByIndexes(row, 0, valData.length, 1);
                        range.values = valData;
                        row += valData.length;
                    }

                    row += 2;
                }

                // Auto-fit columns
                sheet.getUsedRange().format.autofitColumns();
                sheet.activate();
                await ctx.sync();
            });

            setMessage("Results exported to a new sheet!");
        } catch (e: unknown) {
            setMessage(`Export failed: ${(e as Error).message}`);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">Export Options</div>
                <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
                    Export simulation results, statistics, and sensitivity data to a new
                    Excel worksheet.
                </p>
                <Button
                    appearance="primary"
                    icon={<Table24Regular />}
                    onClick={exportToSheet}
                    disabled={exporting}
                    style={{ width: "100%" }}
                >
                    {exporting ? (
                        <Spinner size="tiny" />
                    ) : (
                        "Export Results to Sheet"
                    )}
                </Button>
            </div>

            {message && (
                <MessageBar
                    intent={message.startsWith("Export failed") ? "error" : "success"}
                    style={{ marginTop: 8 }}
                >
                    <MessageBarBody>{message}</MessageBarBody>
                </MessageBar>
            )}

            {/* ── Summary ────────────────────────────────────── */}
            <div className="card">
                <div className="card-header">Simulation Summary</div>
                <table className="stats-table">
                    <tbody>
                        <tr>
                            <td>Iterations</td>
                            <td>{results.config.iterations.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td>Elapsed Time</td>
                            <td>{(results.elapsedMs / 1000).toFixed(1)}s</td>
                        </tr>
                        <tr>
                            <td>Outputs</td>
                            <td>{results.outputs.length}</td>
                        </tr>
                        <tr>
                            <td>Seed</td>
                            <td>{results.config.seed === 0 ? "Random" : results.config.seed}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
