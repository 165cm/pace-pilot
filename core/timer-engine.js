export const ROUNDS = 3;

export const PRESETS = Object.freeze([
  Object.freeze({ workMinutes: 10, breakMinutes: 5, label: "10 / 5" }),
  Object.freeze({ workMinutes: 15, breakMinutes: 5, label: "15 / 5" }),
  Object.freeze({ workMinutes: 20, breakMinutes: 10, label: "20 / 10" }),
  Object.freeze({ workMinutes: 25, breakMinutes: 5, label: "25 / 5" }),
  Object.freeze({ workMinutes: 50, breakMinutes: 10, label: "50 / 10" }),
]);

export const DEFAULT_PREFERENCES = Object.freeze({ presetIndex: 1 });

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizePreferences(value = {}) {
  return {
    presetIndex: clamp(
      Number.isInteger(value.presetIndex) ? value.presetIndex : 1,
      0,
      PRESETS.length - 1,
    ),
  };
}

export function createSession({ nowMs, presetIndex = 1 }) {
  const index = normalizePreferences({ presetIndex }).presetIndex;
  const preset = PRESETS[index];
  const workSeconds = preset.workMinutes * 60;
  const breakSeconds = preset.breakMinutes * 60;
  const plannedSeconds = (workSeconds + breakSeconds) * ROUNDS;
  return {
    id: `${Math.floor(nowMs)}-${index}`,
    presetIndex: index,
    startedAt: Math.floor(nowMs),
    workSeconds,
    breakSeconds,
    rounds: ROUNDS,
    plannedSeconds,
    skippedSeconds: 0,
    totalPausedMs: 0,
    pausedAt: null,
    alarmEntries: [],
    status: "running",
  };
}

function pausedMsAt(session, nowMs) {
  return (session.totalPausedMs || 0) +
    (session.status === "paused" && session.pausedAt
      ? Math.max(0, Math.floor(nowMs) - session.pausedAt)
      : 0);
}

export function pauseSession(session, nowMs) {
  if (session.status !== "running") return session;
  return { ...session, status: "paused", pausedAt: Math.floor(nowMs) };
}

export function resumeSession(session, nowMs) {
  if (session.status !== "paused" || session.pausedAt === null) return session;
  return {
    ...session,
    status: "running",
    totalPausedMs:
      (session.totalPausedMs || 0) + Math.max(0, Math.floor(nowMs) - session.pausedAt),
    pausedAt: null,
  };
}

function phaseAt(session, elapsedSeconds) {
  const roundSeconds = session.workSeconds + session.breakSeconds;
  const roundOffset = elapsedSeconds % roundSeconds;
  const phase = roundOffset < session.workSeconds ? "work" : "break";
  const phaseElapsed = phase === "work"
    ? roundOffset
    : roundOffset - session.workSeconds;
  const phaseDuration = phase === "work"
    ? session.workSeconds
    : session.breakSeconds;
  return { phase, phaseElapsed, phaseDuration };
}

export function getSnapshot(session, nowMs) {
  const pausedMs = pausedMsAt(session, nowMs);
  const clockElapsed = Math.max(
    0,
    Math.floor((Math.floor(nowMs) - session.startedAt - pausedMs) / 1000),
  );
  const elapsedSeconds = clockElapsed + (session.skippedSeconds || 0);
  const completed = elapsedSeconds >= session.plannedSeconds;
  const cappedElapsed = Math.min(elapsedSeconds, session.plannedSeconds);
  const plannedEndAt = Math.floor(nowMs) +
    Math.max(0, session.plannedSeconds - elapsedSeconds) * 1000;

  if (completed) {
    return {
      phase: "completed",
      phaseLabel: "COMPLETE",
      phaseRemainingSeconds: 0,
      phaseDurationSeconds: 1,
      phaseProgress: 1,
      overallProgress: 1,
      elapsedSeconds: session.plannedSeconds,
      currentRound: session.rounds,
      totalRounds: session.rounds,
      plannedEndAt,
      isPaused: false,
      isCompleted: true,
    };
  }

  const currentRound = Math.floor(
    cappedElapsed / (session.workSeconds + session.breakSeconds),
  ) + 1;
  const { phase, phaseElapsed, phaseDuration } = phaseAt(session, cappedElapsed);
  return {
    phase,
    phaseLabel: phase === "work" ? "WORK" : "BREAK",
    phaseRemainingSeconds: phaseDuration - phaseElapsed,
    phaseDurationSeconds: phaseDuration,
    phaseProgress: phaseElapsed / phaseDuration,
    overallProgress: cappedElapsed / session.plannedSeconds,
    elapsedSeconds: cappedElapsed,
    currentRound,
    totalRounds: session.rounds,
    plannedEndAt,
    isPaused: session.status === "paused",
    isCompleted: false,
  };
}

export function skipPhase(session, nowMs) {
  const snapshot = getSnapshot(session, nowMs);
  if (snapshot.isPaused || snapshot.isCompleted) return session;
  return {
    ...session,
    skippedSeconds:
      (session.skippedSeconds || 0) + snapshot.phaseRemainingSeconds,
  };
}

export function completeSession(session, nowMs, reason = "completed") {
  const snapshot = getSnapshot(session, nowMs);
  return {
    id: session.id,
    presetIndex: session.presetIndex,
    startedAt: session.startedAt,
    completedAt: Math.floor(nowMs),
    workSeconds: session.workSeconds,
    breakSeconds: session.breakSeconds,
    actualSeconds: snapshot.elapsedSeconds,
    totalSeconds: reason === "completed"
      ? session.plannedSeconds
      : snapshot.elapsedSeconds,
    plannedSeconds: session.plannedSeconds,
    rounds: session.rounds,
    reason,
  };
}
