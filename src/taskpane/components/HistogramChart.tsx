/* ---------------------------------------------------------------
 * HistogramChart.tsx — D3 histogram with percentile markers
 * --------------------------------------------------------------- */

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import { OutputResults } from "../../engine/types";
import { computeHistogram } from "../../engine/statistics";
import { COLORS, formatNumber } from "../../shared/constants";

interface Props {
    output: OutputResults;
    width?: number;
    height?: number;
}

export const HistogramChart: React.FC<Props> = ({
    output,
    width = 420,
    height = 260,
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const margin = { top: 30, right: 20, bottom: 40, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    useEffect(() => {
        if (!svgRef.current || output.values.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const bins = computeHistogram(output.values);
        const { stats } = output;

        // Scales
        const xMin = bins[0].x0;
        const xMax = bins[bins.length - 1].x1;
        const x = d3.scaleLinear().domain([xMin, xMax]).range([0, w]);
        const yMax = d3.max(bins, (b) => b.frequency) ?? 0;
        const y = d3.scaleLinear().domain([0, yMax * 1.1]).range([h, 0]);

        const g = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // ── Gradient definition ──────────────────────────────
        const defs = svg.append("defs");
        const grad = defs
            .append("linearGradient")
            .attr("id", "hist-grad")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");
        grad.append("stop").attr("offset", "0%").attr("stop-color", COLORS.primary);
        grad.append("stop").attr("offset", "100%").attr("stop-color", "#818CF8");

        // ── 90% confidence shading ───────────────────────────
        const p5x = x(stats.percentiles.p5);
        const p95x = x(stats.percentiles.p95);
        g.append("rect")
            .attr("x", p5x)
            .attr("y", 0)
            .attr("width", Math.max(0, p95x - p5x))
            .attr("height", h)
            .attr("fill", COLORS.percentileFill)
            .attr("rx", 2);

        // ── Bars ─────────────────────────────────────────────
        g.selectAll(".bar")
            .data(bins)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", (d) => x(d.x0))
            .attr("y", (d) => y(d.frequency))
            .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0) - 1))
            .attr("height", (d) => h - y(d.frequency))
            .attr("fill", "url(#hist-grad)")
            .attr("rx", 1)
            .style("opacity", 0.9);

        // ── Percentile lines ─────────────────────────────────
        const percentileLines = [
            { value: stats.percentiles.p5, label: "5%" },
            { value: stats.percentiles.p50, label: "50%" },
            { value: stats.percentiles.p95, label: "95%" },
        ];

        percentileLines.forEach((pl) => {
            const px = x(pl.value);
            g.append("line")
                .attr("x1", px)
                .attr("x2", px)
                .attr("y1", 0)
                .attr("y2", h)
                .attr("stroke", COLORS.percentileLine)
                .attr("stroke-width", 1.5)
                .attr("stroke-dasharray", "4,3");

            g.append("text")
                .attr("x", px)
                .attr("y", -6)
                .attr("text-anchor", "middle")
                .attr("fill", COLORS.percentileLine)
                .attr("font-size", 10)
                .attr("font-weight", 600)
                .text(pl.label);

            g.append("text")
                .attr("x", px)
                .attr("y", -16)
                .attr("text-anchor", "middle")
                .attr("fill", COLORS.axisText)
                .attr("font-size", 9)
                .text(formatNumber(pl.value));
        });

        // ── Axes ─────────────────────────────────────────────
        g.append("g")
            .attr("transform", `translate(0,${h})`)
            .call(
                d3
                    .axisBottom(x)
                    .ticks(6)
                    .tickFormat((d) => formatNumber(d as number))
            )
            .selectAll("text")
            .attr("fill", COLORS.axisText)
            .attr("font-size", 10);

        g.append("g")
            .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")))
            .selectAll("text")
            .attr("fill", COLORS.axisText)
            .attr("font-size", 10);

        // Grid lines
        g.selectAll(".grid-line")
            .data(y.ticks(5))
            .enter()
            .append("line")
            .attr("x1", 0)
            .attr("x2", w)
            .attr("y1", (d) => y(d))
            .attr("y2", (d) => y(d))
            .attr("stroke", COLORS.gridLine)
            .attr("stroke-width", 0.5);

        // ── Title ────────────────────────────────────────────
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 16)
            .attr("text-anchor", "middle")
            .attr("fill", COLORS.axisText)
            .attr("font-size", 12)
            .attr("font-weight", 600)
            .text(output.name);

        // Remove domain lines for cleaner look
        g.selectAll(".domain").attr("stroke", COLORS.gridLine);
        g.selectAll(".tick line").attr("stroke", COLORS.gridLine);
    }, [output, width, height]);

    return (
        <div className="chart-container">
            <svg ref={svgRef} width={width} height={height} />
        </div>
    );
};
