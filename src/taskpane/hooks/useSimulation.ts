/* ---------------------------------------------------------------
 * useSimulation.ts — React hook for simulation state management
 * --------------------------------------------------------------- */

import { useState, useCallback, useRef } from "react";
import {
    SimulationConfig,
    SimulationResults,
    SimulationProgress,
    SimulationStatus,
} from "../../engine/types";
import { runSimulation, cancelSimulation } from "../../engine/simulator";
import { DEFAULT_ITERATIONS, DEFAULT_SEED, DEFAULT_CONFIDENCE } from "../../shared/constants";

interface UseSimulationReturn {
    config: SimulationConfig;
    setConfig: (config: SimulationConfig) => void;
    results: SimulationResults | null;
    progress: SimulationProgress | null;
    isRunning: boolean;
    run: () => Promise<void>;
    cancel: () => void;
    error: string | null;
}

export function useSimulation(): UseSimulationReturn {
    const [config, setConfig] = useState<SimulationConfig>({
        iterations: DEFAULT_ITERATIONS,
        seed: DEFAULT_SEED,
        confidenceLevel: DEFAULT_CONFIDENCE,
    });

    const [results, setResults] = useState<SimulationResults | null>(null);
    const [progress, setProgress] = useState<SimulationProgress | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const run = useCallback(async () => {
        setIsRunning(true);
        setError(null);
        setResults(null);
        setProgress({
            status: "running",
            currentIteration: 0,
            totalIterations: config.iterations,
            iterationsPerSecond: 0,
            elapsedMs: 0,
            estimatedRemainingMs: 0,
        });

        try {
            const res = await runSimulation(config, (p) => {
                setProgress({ ...p });
            });
            setResults(res);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Simulation failed";
            setError(msg);
            setProgress((prev) =>
                prev ? { ...prev, status: "error" } : null
            );
        } finally {
            setIsRunning(false);
        }
    }, [config]);

    const cancel = useCallback(() => {
        cancelSimulation();
        setIsRunning(false);
        setProgress((prev) =>
            prev ? { ...prev, status: "cancelled" } : null
        );
    }, []);

    return { config, setConfig, results, progress, isRunning, run, cancel, error };
}
