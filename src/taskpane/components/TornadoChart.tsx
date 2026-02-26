/* ---------------------------------------------------------------
 * TornadoChart.tsx — Sensitivity tornado chart (D3)
 * --------------------------------------------------------------- */

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import { SensitivityResult } from "../../engine/types";
import { COLORS } from "../../shared/constants";

interface Props {
    data: SensitivityResult[];
    title?: string;
    width?: number;
    height?: number;
}

export const TornadoChart: React.FC<Props> = ({
    data,
    title = "Sensitivity — Tornado",
    width = 420,
    height,
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const barHeight = 28;
    const maxBars = 10;
    const displayData = data.slice(0, maxBars);
    const margin = { top: 30, right: 50, bottom: 20, left: 140 };
    const chartHeight = displayData.length * barHeight;
    const totalHeight = height ?? chartHeight + margin.top + margin.bottom;
    const w = width - margin.left - margin.right;
    const h = chartHeight;

    useEffect(() => {
        if (!svgRef.current || displayData.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const maxAbs = d3.max(displayData, (d) => Math.abs(d.coefficient)) ?? 1;

        const x = d3.scaleLinear().domain([-maxAbs * 1.15, maxAbs * 1.15]).range([0, w]);
        const y = d3
            .scaleBand()
            .domain(displayData.map((d) => d.inputName))
            .range([0, h])
            .padding(0.25);

        const g = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // ── Zero line ────────────────────────────────────────
        g.append("line")
            .attr("x1", x(0))
            .attr("x2", x(0))
            .attr("y1", 0)
            .attr("y2", h)
            .attr("stroke", COLORS.neutral)
            .attr("stroke-width", 1);

        // ── Bars ─────────────────────────────────────────────
        g.selectAll(".tornado-bar")
            .data(displayData)
            .enter()
            .append("rect")
            .attr("class", "tornado-bar")
            .attr("x", (d) => (d.coefficient >= 0 ? x(0) : x(d.coefficient)))
            .attr("y", (d) => y(d.inputName)!)
            .attr("width", (d) => Math.abs(x(d.coefficient) - x(0)))
            .attr("height", y.bandwidth())
            .attr("fill", (d) =>
                d.coefficient >= 0 ? COLORS.tornadoPositive : COLORS.tornadoNegative
            )
            .attr("rx", 3)
            .style("opacity", 0.85);

        // ── Value labels ─────────────────────────────────────
        g.selectAll(".tornado-label")
            .data(displayData)
            .enter()
            .append("text")
            .attr("class", "tornado-label")
            .attr("x", (d) =>
                d.coefficient >= 0
                    ? x(d.coefficient) + 5
                    : x(d.coefficient) - 5
            )
            .attr("y", (d) => y(d.inputName)! + y.bandwidth() / 2 + 4)
            .attr("text-anchor", (d) => (d.coefficient >= 0 ? "start" : "end"))
            .attr("fill", COLORS.axisText)
            .attr("font-size", 10)
            .attr("font-weight", 500)
            .text((d) => d.coefficient.toFixed(3));

        // ── Y axis (input names) ─────────────────────────────
        g.append("g")
            .call(d3.axisLeft(y).tickSize(0))
            .selectAll("text")
            .attr("fill", COLORS.axisText)
            .attr("font-size", 11);

        g.selectAll(".domain").remove();

        // ── Title ────────────────────────────────────────────
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 16)
            .attr("text-anchor", "middle")
            .attr("fill", COLORS.axisText)
            .attr("font-size", 12)
            .attr("font-weight", 600)
            .text(title);
    }, [displayData, width, totalHeight]);

    return (
        <div className="chart-container">
            <svg ref={svgRef} width={width} height={totalHeight} />
        </div>
    );
};
