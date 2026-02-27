/* ---------------------------------------------------------------
 * MiniDistChart.tsx — Tiny inline SVG sparkline of a distribution
 *
 * Renders a small PDF (probability density function) curve for
 * each registered distribution input, using the actual parameters.
 * --------------------------------------------------------------- */

import React, { useMemo } from "react";
import { DistributionType } from "../../engine/types";
import { COLORS } from "../../shared/constants";

interface Props {
    type: DistributionType;
    params: Record<string, number | number[]>;
    width?: number;
    height?: number;
}

// ── PDF functions ───────────────────────────────────────────────

function normalPDF(x: number, mean: number, stdev: number): number {
    const z = (x - mean) / stdev;
    return Math.exp(-0.5 * z * z) / (stdev * Math.sqrt(2 * Math.PI));
}

function triangularPDF(x: number, min: number, mode: number, max: number): number {
    if (x < min || x > max) return 0;
    if (x <= mode) return (2 * (x - min)) / ((max - min) * (mode - min));
    return (2 * (max - x)) / ((max - min) * (max - mode));
}

function uniformPDF(_x: number, _min: number, _max: number): number {
    return 1 / (_max - _min);
}

// Beta function approximation for PERT
function lnGamma(z: number): number {
    const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
        -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let x = z, y = z;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) ser += c[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
}

function betaPDF(x: number, alpha: number, beta: number): number {
    if (x <= 0 || x >= 1) return 0;
    const lnB = lnGamma(alpha) + lnGamma(beta) - lnGamma(alpha + beta);
    return Math.exp((alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - lnB);
}

function pertPDF(x: number, min: number, mode: number, max: number): number {
    if (x <= min || x >= max) return 0;
    const range = max - min;
    const mu = (min + 4 * mode + max) / 6;
    const alpha = 1 + 4 * ((mu - min) / range);
    const beta = 1 + 4 * ((max - mu) / range);
    const t = (x - min) / range;
    return betaPDF(t, alpha, beta) / range;
}

function lognormalPDF(x: number, mu: number, sigma: number): number {
    if (x <= 0) return 0;
    const lnx = Math.log(x);
    const z = (lnx - mu) / sigma;
    return Math.exp(-0.5 * z * z) / (x * sigma * Math.sqrt(2 * Math.PI));
}

// ── Compute PDF points ──────────────────────────────────────────

function computePDFPoints(
    type: DistributionType,
    params: Record<string, number | number[]>,
    numPoints: number = 60
): [number, number][] {
    let xMin: number, xMax: number;
    let pdfFn: (x: number) => number;

    const p = (key: string): number => {
        const v = params[key];
        return typeof v === "number" ? v : (v as number[])[0] ?? 0;
    };

    switch (type) {
        case "normal": {
            const mean = p("mean"), stdev = p("stdev");
            xMin = mean - 3.5 * stdev;
            xMax = mean + 3.5 * stdev;
            pdfFn = (x) => normalPDF(x, mean, stdev);
            break;
        }
        case "triangular": {
            const min = p("min"), mode = p("mode"), max = p("max");
            xMin = min;
            xMax = max;
            pdfFn = (x) => triangularPDF(x, min, mode, max);
            break;
        }
        case "pert": {
            const min = p("min"), mode = p("mode"), max = p("max");
            xMin = min;
            xMax = max;
            pdfFn = (x) => pertPDF(x, min, mode, max);
            break;
        }
        case "uniform": {
            const min = p("min"), max = p("max");
            const pad = (max - min) * 0.15;
            xMin = min - pad;
            xMax = max + pad;
            pdfFn = (x) => (x >= min && x <= max) ? uniformPDF(x, min, max) : 0;
            break;
        }
        case "lognormal": {
            const mu = p("mu"), sigma = p("sigma");
            xMin = 0;
            xMax = Math.exp(mu + 3 * sigma);
            pdfFn = (x) => lognormalPDF(x, mu, sigma);
            break;
        }
        default:
            return [];
    }

    const points: [number, number][] = [];
    const step = (xMax - xMin) / (numPoints - 1);
    for (let i = 0; i < numPoints; i++) {
        const x = xMin + i * step;
        points.push([x, pdfFn(x)]);
    }
    return points;
}

// ── Component ───────────────────────────────────────────────────

export const MiniDistChart: React.FC<Props> = ({
    type,
    params,
    width = 100,
    height = 32,
}) => {
    const pathD = useMemo(() => {
        const points = computePDFPoints(type, params);
        if (points.length === 0) return "";

        const xs = points.map((p) => p[0]);
        const ys = points.map((p) => p[1]);
        const xMin = Math.min(...xs), xMax = Math.max(...xs);
        const yMax = Math.max(...ys);

        if (xMax === xMin || yMax === 0) return "";

        const pad = 2;
        const w = width - pad * 2;
        const h = height - pad * 2;

        const scaleX = (v: number) => pad + ((v - xMin) / (xMax - xMin)) * w;
        const scaleY = (v: number) => height - pad - (v / yMax) * h;

        // Build SVG path
        let d = `M ${scaleX(points[0][0])} ${scaleY(points[0][1])}`;
        for (let i = 1; i < points.length; i++) {
            d += ` L ${scaleX(points[i][0])} ${scaleY(points[i][1])}`;
        }

        return d;
    }, [type, params, width, height]);

    const fillD = useMemo(() => {
        if (!pathD) return "";
        const pad = 2;
        const scaleX0 = pad;
        const scaleXEnd = width - pad;
        const baseline = height - pad;
        return `${pathD} L ${scaleXEnd} ${baseline} L ${scaleX0} ${baseline} Z`;
    }, [pathD, width, height]);

    if (!pathD) return null;

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{ flexShrink: 0 }}
        >
            {/* Fill area */}
            <path d={fillD} fill={COLORS.primary} opacity={0.15} />
            {/* Curve line */}
            <path d={pathD} fill="none" stroke={COLORS.primary} strokeWidth={1.5} />
        </svg>
    );
};
