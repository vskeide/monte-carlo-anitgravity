/* ---------------------------------------------------------------
 * StatisticsTable.tsx — Summary statistics table
 * --------------------------------------------------------------- */

import React from "react";
import { OutputStatistics } from "../../engine/types";
import { formatNumber, formatPercent } from "../../shared/constants";

interface Props {
    stats: OutputStatistics;
    name: string;
    threshold?: number;
}

export const StatisticsTable: React.FC<Props> = ({ stats, name, threshold = 0 }) => {
    const rows: [string, string][] = [
        ["Iterations", stats.count.toLocaleString()],
        ["Minimum", formatNumber(stats.minimum)],
        ["Maximum", formatNumber(stats.maximum)],
        ["Mean", formatNumber(stats.mean)],
        ["Median", formatNumber(stats.median)],
        ["Mode", formatNumber(stats.mode)],
        ["Std Deviation", formatNumber(stats.stdDev)],
        ["Skewness", stats.skewness.toFixed(4)],
        ["Kurtosis", stats.kurtosis.toFixed(4)],
        ["───────────", ""],
        ["1st Percentile", formatNumber(stats.percentiles.p1)],
        ["5th Percentile", formatNumber(stats.percentiles.p5)],
        ["10th Percentile", formatNumber(stats.percentiles.p10)],
        ["25th Percentile", formatNumber(stats.percentiles.p25)],
        ["50th Percentile", formatNumber(stats.percentiles.p50)],
        ["75th Percentile", formatNumber(stats.percentiles.p75)],
        ["90th Percentile", formatNumber(stats.percentiles.p90)],
        ["95th Percentile", formatNumber(stats.percentiles.p95)],
        ["99th Percentile", formatNumber(stats.percentiles.p99)],
        ["───────────", ""],
        ["90% CI Lower", formatNumber(stats.confidenceInterval[0])],
        ["90% CI Upper", formatNumber(stats.confidenceInterval[1])],
        [`P(X < ${threshold})`, formatPercent(stats.probNegative)],
    ];

    return (
        <div className="card">
            <div className="card-header">
                Statistics — {name}
            </div>
            <table className="stats-table">
                <tbody>
                    {rows.map(([label, value], i) =>
                        label.startsWith("─") ? (
                            <tr key={i}>
                                <td
                                    colSpan={2}
                                    style={{
                                        borderBottom: "1px solid #e5e7eb",
                                        padding: 2,
                                    }}
                                />
                            </tr>
                        ) : (
                            <tr key={i}>
                                <td>{label}</td>
                                <td>{value}</td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
        </div>
    );
};
