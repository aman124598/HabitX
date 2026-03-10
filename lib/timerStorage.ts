import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───────────────────────────────────────────────────────
export interface TimerSession {
  start: number;   // epoch ms
  end: number;     // epoch ms
}

export interface TimerDayLog {
  elapsed: number;          // total ms for the day
  sessions: TimerSession[];
}

export interface RunningTimer {
  habitId: string;
  startedAt: number;  // epoch ms
}

// ─── Key helpers ─────────────────────────────────────────────────
const RUNNING_KEY = 'timer:running';  // stores map of running timers

function dayLogKey(habitId: string, date: string): string {
  return `timer:log:${habitId}:${date}`;
}

function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Running timer management ────────────────────────────────────

async function getRunningTimers(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(RUNNING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function setRunningTimers(map: Record<string, number>): Promise<void> {
  await AsyncStorage.setItem(RUNNING_KEY, JSON.stringify(map));
}

// ─── Day log management ──────────────────────────────────────────

async function getDayLogRaw(habitId: string, date: string): Promise<TimerDayLog> {
  try {
    const raw = await AsyncStorage.getItem(dayLogKey(habitId, date));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { elapsed: 0, sessions: [] };
}

async function saveDayLog(habitId: string, date: string, log: TimerDayLog): Promise<void> {
  await AsyncStorage.setItem(dayLogKey(habitId, date), JSON.stringify(log));
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Start the timer for a habit. No-op if already running.
 */
export async function startTimer(habitId: string): Promise<void> {
  const running = await getRunningTimers();
  if (running[habitId]) return; // already running
  running[habitId] = Date.now();
  await setRunningTimers(running);
}

/**
 * Stop the timer for a habit and persist the session to today's log.
 * Returns the session duration in ms, or 0 if timer wasn't running.
 */
export async function stopTimer(habitId: string): Promise<number> {
  const running = await getRunningTimers();
  const startedAt = running[habitId];
  if (!startedAt) return 0;

  const now = Date.now();
  const duration = now - startedAt;

  // Remove from running map
  delete running[habitId];
  await setRunningTimers(running);

  // Persist session to today's log
  const today = todayStr();
  const log = await getDayLogRaw(habitId, today);
  log.sessions.push({ start: startedAt, end: now });
  log.elapsed += duration;
  await saveDayLog(habitId, today, log);

  return duration;
}

/**
 * Reset today's timer for a habit (stop if running + clear today's log).
 */
export async function resetTimer(habitId: string): Promise<void> {
  // Stop if running
  const running = await getRunningTimers();
  if (running[habitId]) {
    delete running[habitId];
    await setRunningTimers(running);
  }
  // Clear today's log
  const today = todayStr();
  await saveDayLog(habitId, today, { elapsed: 0, sessions: [] });
}

/**
 * Get the current timer state for a habit.
 */
export async function getTimerState(habitId: string): Promise<{
  isRunning: boolean;
  startedAt: number | null;
  todayElapsed: number;   // total ms logged today (excluding current running session)
}> {
  const running = await getRunningTimers();
  const startedAt = running[habitId] || null;
  const today = todayStr();
  const log = await getDayLogRaw(habitId, today);

  return {
    isRunning: !!startedAt,
    startedAt,
    todayElapsed: log.elapsed,
  };
}

/**
 * Get total time logged for a habit on a specific date.
 */
export async function getDailyLog(habitId: string, date: string): Promise<TimerDayLog> {
  return getDayLogRaw(habitId, date);
}

/**
 * Get last 7 days of time data for a habit.
 */
export async function getWeeklyLogs(habitId: string): Promise<{ date: string; elapsed: number }[]> {
  const results: { date: string; elapsed: number }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const log = await getDayLogRaw(habitId, dateStr);
    results.push({ date: dateStr, elapsed: log.elapsed });
  }

  return results;
}

/**
 * Get today's total time across all provided habit IDs.
 */
export async function getTodayTotalForHabits(habitIds: string[]): Promise<{
  total: number;
  perHabit: { habitId: string; elapsed: number }[];
}> {
  const today = todayStr();
  let total = 0;
  const perHabit: { habitId: string; elapsed: number }[] = [];

  // Also account for currently-running timers
  const running = await getRunningTimers();
  const now = Date.now();

  for (const habitId of habitIds) {
    const log = await getDayLogRaw(habitId, today);
    let elapsed = log.elapsed;
    // Add currently running time if applicable
    if (running[habitId]) {
      elapsed += now - running[habitId];
    }
    perHabit.push({ habitId, elapsed });
    total += elapsed;
  }

  return { total, perHabit };
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
