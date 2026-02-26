/* ---------------------------------------------------------------
 * distributions.ts — Probability distribution samplers
 *
 * Pure math functions — no Excel dependency.  Each sampler draws a
 * single random value from the specified distribution.  We also
 * provide the expected (static) value for each distribution, which
 * the custom function returns when the simulation is NOT running.
 * --------------------------------------------------------------- */

// ── Seedable PRNG (xoshiro128**) ─────────────────────────────────
// Allows reproducible simulation runs when a seed is set.

let _s = new Uint32Array(4);

export function seedRng(seed: number): void {
    // SplitMix32 to expand seed into 4 state words
    let s = seed >>> 0;
    for (let i = 0; i < 4; i++) {
        s += 0x9e3779b9;
        let t = s ^ (s >>> 16);
        t = Math.imul(t, 0x21f0aaad);
        t ^= t >>> 15;
        t = Math.imul(t, 0x735a2d97);
        t ^= t >>> 15;
        _s[i] = t >>> 0;
    }
}

/** Return a uniform random float in [0, 1) using xoshiro128** */
function xoshiro(): number {
    const r = Math.imul(_s[1] * 5, 7);
    const result = ((r << 9) | (r >>> 23)) * 9;
    const t = _s[1] << 9;
    _s[2] ^= _s[0];
    _s[3] ^= _s[1];
    _s[1] ^= _s[2];
    _s[0] ^= _s[3];
    _s[2] ^= t;
    _s[3] = (_s[3] << 11) | (_s[3] >>> 21);
    return (result >>> 0) / 4294967296;
}

let useSeededRng = false;

export function setUseSeededRng(flag: boolean): void {
    useSeededRng = flag;
}

/** Uniform [0, 1) — delegates to seeded or Math.random */
function rand(): number {
    return useSeededRng ? xoshiro() : Math.random();
}

// ── Box-Muller for Normal distribution ───────────────────────────

let _hasSpare = false;
let _spare = 0;

export function sampleStdNormal(): number {
    if (_hasSpare) {
        _hasSpare = false;
        return _spare;
    }
    let u: number, v: number, s: number;
    do {
        u = rand() * 2 - 1;
        v = rand() * 2 - 1;
        s = u * u + v * v;
    } while (s >= 1 || s === 0);
    const mul = Math.sqrt(-2 * Math.log(s) / s);
    _spare = v * mul;
    _hasSpare = true;
    return u * mul;
}

// ── Distribution Samplers ────────────────────────────────────────

/** Normal(mean, stdev) */
export function sampleNormal(mean: number, stdev: number): number {
    return mean + stdev * sampleStdNormal();
}

export function staticNormal(mean: number, _stdev: number): number {
    return mean;
}

/** Uniform(min, max) */
export function sampleUniform(min: number, max: number): number {
    return min + rand() * (max - min);
}

export function staticUniform(min: number, max: number): number {
    return (min + max) / 2;
}

/** Triangular(min, mode, max) */
export function sampleTriangular(min: number, mode: number, max: number): number {
    const u = rand();
    const fc = (mode - min) / (max - min);
    if (u < fc) {
        return min + Math.sqrt(u * (max - min) * (mode - min));
    }
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

export function staticTriangular(_min: number, mode: number, _max: number): number {
    return mode;
}

/** PERT(min, mode, max) — Beta-distributed with shape from PERT formula */
export function samplePERT(min: number, mode: number, max: number): number {
    const range = max - min;
    if (range <= 0) return mode;
    const mu = (min + 4 * mode + max) / 6;
    const alpha1 = (mu - min) * (2 * mode - min - max) / ((mode - mu) * (max - min));
    let a: number, b: number;
    if (alpha1 > 0) {
        a = alpha1;
        b = a * (max - mu) / (mu - min);
    } else {
        // Fallback: use lambda=4 parameterisation
        a = 1 + 4 * (mu - min) / range;
        b = 1 + 4 * (max - mu) / range;
    }
    // Ensure valid shape params
    a = Math.max(a, 0.5);
    b = Math.max(b, 0.5);
    const betaSample = sampleBeta(a, b);
    return min + betaSample * range;
}

export function staticPERT(min: number, mode: number, max: number): number {
    return (min + 4 * mode + max) / 6; // PERT weighted mean
}

/** Lognormal(mu, sigma) — parameters of the underlying normal */
export function sampleLognormal(mu: number, sigma: number): number {
    return Math.exp(mu + sigma * sampleStdNormal());
}

export function staticLognormal(mu: number, sigma: number): number {
    return Math.exp(mu + (sigma * sigma) / 2); // E[X]
}

/** Discrete distribution from arrays of values and probabilities */
export function sampleDiscrete(values: number[], probs: number[]): number {
    const u = rand();
    let cumulative = 0;
    for (let i = 0; i < values.length; i++) {
        cumulative += probs[i];
        if (u <= cumulative) return values[i];
    }
    return values[values.length - 1];
}

export function staticDiscrete(values: number[], probs: number[]): number {
    let result = 0;
    for (let i = 0; i < values.length; i++) {
        result += values[i] * probs[i];
    }
    return result; // Expected value
}

// ── Helper: Beta distribution via Gamma samples ─────────────────

function sampleGamma(shape: number, scale: number): number {
    // Marsaglia & Tsang's method for shape >= 1
    if (shape < 1) {
        return sampleGamma(shape + 1, scale) * Math.pow(rand(), 1 / shape);
    }
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    // eslint-disable-next-line no-constant-condition
    while (true) {
        let x: number, v: number;
        do {
            x = sampleStdNormal();
            v = 1 + c * x;
        } while (v <= 0);
        v = v * v * v;
        const u = rand();
        if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v * scale;
        if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * scale;
    }
}

function sampleBeta(a: number, b: number): number {
    const x = sampleGamma(a, 1);
    const y = sampleGamma(b, 1);
    return x / (x + y);
}

// ── Generic sampler dispatcher ──────────────────────────────────

export function sampleDistribution(
    type: string,
    params: Record<string, number | number[]>
): number {
    switch (type) {
        case "normal":
            return sampleNormal(params.mean as number, params.stdev as number);
        case "uniform":
            return sampleUniform(params.min as number, params.max as number);
        case "triangular":
            return sampleTriangular(
                params.min as number,
                params.mode as number,
                params.max as number
            );
        case "pert":
            return samplePERT(
                params.min as number,
                params.mode as number,
                params.max as number
            );
        case "lognormal":
            return sampleLognormal(params.mu as number, params.sigma as number);
        case "discrete":
            return sampleDiscrete(
                params.values as number[],
                params.probs as number[]
            );
        default:
            throw new Error(`Unknown distribution: ${type}`);
    }
}

export function staticValue(
    type: string,
    params: Record<string, number | number[]>
): number {
    switch (type) {
        case "normal":
            return staticNormal(params.mean as number, params.stdev as number);
        case "uniform":
            return staticUniform(params.min as number, params.max as number);
        case "triangular":
            return staticTriangular(
                params.min as number,
                params.mode as number,
                params.max as number
            );
        case "pert":
            return staticPERT(
                params.min as number,
                params.mode as number,
                params.max as number
            );
        case "lognormal":
            return staticLognormal(params.mu as number, params.sigma as number);
        case "discrete":
            return staticDiscrete(
                params.values as number[],
                params.probs as number[]
            );
        default:
            throw new Error(`Unknown distribution: ${type}`);
    }
}

/** Reset PRNG spare for a fresh run */
export function resetSamplerState(): void {
    _hasSpare = false;
    _spare = 0;
}
