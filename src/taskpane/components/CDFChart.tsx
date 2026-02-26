/* ---------------------------------------------------------------
 * CDFChart.tsx — Cumulative Distribution Function chart (D3)
 * --------------------------------------------------------------- */

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import { OutputResults } from "../../engine/types";
import { computeCDF } from "../../engine/statistics";
import { COLORS, formatNumber, formatPercent } from "../../shared/constants";

interface Props {
    output: OutputResults;
    width?: number;
    height?: number;
}

export const CDFChart: React.FC<Props> = ({
    output,
    width = 420,
    height = 240,
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const margin = { top: 30, right: 20, bottom: 40, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    useEffect(() => {
        if (!svgRef.current || output.values.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const cdfData = computeCDF(output.values, 300);
        const { stats } = output;

        // Scales
        const x = d3
            .scaleLinear()
            .domain([cdfData[0].x, cdfData[cdfData.length - 1].x])
            .range([0, w]);

        const y = d3.scaleLinear().domain([0, 1]).range([h, 0]);

        const g = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // ── Area fill beneath CDF ────────────────────────────
        const area = d3
            .area<{ x: number; cdf: number }>()
            .x((d) => x(d.x))
            .y0(h)
            .y1((d) => y(d.cdf))
            .curve(d3.curveMonotoneX);

        const defs = svg.append("defs");
        const grad = defs
            .append("linearGradient")
            .attr("id", "cdf-grad")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");
        grad.append("stop").attr("offset", "0%").attr("stop-color", COLORS.cdf).attr("stop-opacity", 0.25);
        grad.append("stop").attr("offset", "100%").attr("stop-color", COLORS.cdf).attr("stop-opacity", 0.02);

        g.append("path")
            .datum(cdfData)
            .attr("d", area)
            .attr("fill", "url(#cdf-grad)");

        // ── CDF line ─────────────────────────────────────────
        const line = d3
            .line<{ x: number; cdf: number }>()
            .x((d) => x(d.x))
            .y((d) => y(d.cdf))
            .curve(d3.curveMonotoneX);

        g.append("path")
            .datum(cdfData)
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", COLORS.cdf)
            .attr("stroke-width", 2.5);

        // ── Percentile reference lines ───────────────────────
        const refs = [
            { p: 0.05, val: stats.percentiles.p5, label: "5%" },
            { p: 0.50, val: stats.percentiles.p50, label: "50%" },
            { p: 0.95, val: stats.percentiles.p95, label: "95%" },
        ];

        refs.forEach(({ p, val, label }) => {
            const px = x(val);
            const py = y(p);

            // Horizontal line from y-axis to point
            g.append("line")
                .attr("x1", 0)
                .attr("x2", px)
                .attr("y1", py)
                .attr("y2", py)
                .attr("stroke", COLORS.percentileLine)
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "3,3")
                .attr("opacity", 0.6);

            // Vertical line from point to x-axis
            g.append("line")
                .attr("x1", px)
                .attr("x2", px)
                .attr("y1", py)
                .attr("y2", h)
                .attr("stroke", COLORS.percentileLine)
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "3,3")
                .attr("opacity", 0.6);

            // Dot at intersection
            g.append("circle")
                .attr("cx", px)
                .attr("cy", py)
                .attr("r", 3.5)
                .attr("fill", COLORS.percentileLine)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.5);

            // Label
            g.append("text")
                .attr("x", px + 4)
                .attr("y", py - 6)
                .attr("fill", COLORS.axisText)
                .attr("font-size", 9)
                .text(`${label}: ${formatNumber(val)}`);
        });

        // ── Axes ─────────────────────────────────────────────
        g.append("g")
            .attr("transform", `translate(0,${h})`)
            .call(
                d3.axisBottom(x).ticks(6).tickFormat((d) => formatNumber(d as number))
            )
            .selectAll("text")
            .attr("fill", COLORS.axisText)
            .attr("font-size", 10);

        g.append("g")
            .call(
                d3.axisLeft(y).ticks(5).tickFormat((d) => formatPercent(d as number, 0))
            )
            .selectAll("text")
            .attr("fill", COLORS.axisText)
            .attr("font-size", 10);

        // Grid
        g.selectAll(".grid-h")
            .data(y.ticks(5))
            .enter()
            .append("line")
            .attr("x1", 0).attr("x2", w)
            .attr("y1", (d) => y(d)).attr("y2", (d) => y(d))
            .attr("stroke", COLORS.gridLine).attr("stroke-width", 0.5);

        // Title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 16)
            .attr("text-anchor", "middle")
            .attr("fill", COLORS.axisText)
            .attr("font-size", 12)
            .attr("font-weight", 600)
            .text(`${output.name} — Cumulative Distribution`);

        // Clean up domain lines
        g.selectAll(".domain").attr("stroke", COLORS.gridLine);
        g.selectAll(".tick line").attr("stroke", COLORS.gridLine);
    }, [output, width, height]);

    return (
        <div className="chart-container">
            <svg ref={svgRef} width={width} height={height} />
        </div>
    );
};
