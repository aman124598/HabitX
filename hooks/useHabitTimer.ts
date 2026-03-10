import { useCallback, useEffect, useRef, useState } from 'react';
import {
    startTimer,
    stopTimer,
    resetTimer,
    getTimerState,
    formatElapsed,
} from '../lib/timerStorage';

export interface HabitTimerState {
    isRunning: boolean;
    /** Total elapsed ms displayed (includes live ticking) */
    elapsed: number;
    /** Formatted display string e.g. "05:32" or "1:05:32" */
    display: string;
    start: () => Promise<void>;
    stop: () => Promise<void>;
    reset: () => Promise<void>;
}

export function useHabitTimer(habitId: string): HabitTimerState {
    const [isRunning, setIsRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0);        // total displayed ms
    const startedAtRef = useRef<number | null>(null);  // epoch ms when started
    const baseElapsedRef = useRef(0);                  // logged ms (excluding current running session)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Tick loop ──────────────────────────────────────────────
    const startTick = useCallback(() => {
        if (intervalRef.current) return;
        intervalRef.current = setInterval(() => {
            if (startedAtRef.current) {
                const live = Date.now() - startedAtRef.current;
                setElapsed(baseElapsedRef.current + live);
            }
        }, 1000);
    }, []);

    const stopTick = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // ── Init: restore state from storage ──────────────────────
    useEffect(() => {
        let cancelled = false;

        (async () => {
            const state = await getTimerState(habitId);
            if (cancelled) return;

            baseElapsedRef.current = state.todayElapsed;

            if (state.isRunning && state.startedAt) {
                startedAtRef.current = state.startedAt;
                const live = Date.now() - state.startedAt;
                setElapsed(state.todayElapsed + live);
                setIsRunning(true);
                startTick();
            } else {
                setElapsed(state.todayElapsed);
                setIsRunning(false);
            }
        })();

        return () => {
            cancelled = true;
            stopTick();
        };
    }, [habitId, startTick, stopTick]);

    // ── Actions ────────────────────────────────────────────────
    const start = useCallback(async () => {
        await startTimer(habitId);
        const now = Date.now();
        startedAtRef.current = now;
        setIsRunning(true);
        startTick();
    }, [habitId, startTick]);

    const stop = useCallback(async () => {
        stopTick();
        const duration = await stopTimer(habitId);
        startedAtRef.current = null;
        baseElapsedRef.current += duration;
        setElapsed(baseElapsedRef.current);
        setIsRunning(false);
    }, [habitId, stopTick]);

    const reset = useCallback(async () => {
        stopTick();
        await resetTimer(habitId);
        startedAtRef.current = null;
        baseElapsedRef.current = 0;
        setElapsed(0);
        setIsRunning(false);
    }, [habitId, stopTick]);

    return {
        isRunning,
        elapsed,
        display: formatElapsed(elapsed),
        start,
        stop,
        reset,
    };
}
