export const PRESETS = Object.freeze([
  Object.freeze({ workMinutes: 10, chaseMinutes: 5, label: "10＋5" }),
  Object.freeze({ workMinutes: 15, chaseMinutes: 5, label: "15＋5" }),
  Object.freeze({ workMinutes: 20, chaseMinutes: 10, label: "20＋10" }),
  Object.freeze({ workMinutes: 25, chaseMinutes: 5, label: "25＋5" }),
  Object.freeze({ workMinutes: null, chaseMinutes: null, label: "Custom" }),
]);

export const DEFAULT_PREFERENCES = Object.freeze({
  presetIndex: 1,
  savedPresetKey: null,
  savedPresets: [],
  selectedTaskPresetId: null,
  taskPresets: [],
  taskTitle: "Untitled",
  workMinutes: 15,
  chaseMinutes: 5,
  units: 1,
});

export function normalizeTaskTitle(value, fallback = "Untitled") {
  const title = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
  return title || fallback;
}

function normalizeTaskPresets(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value
    .map((preset, index) => {
      const id = String(preset?.id || `task-${index + 1}`).slice(0, 48);
      return {
        id,
        title: normalizeTaskTitle(preset?.title, `Task ${index + 1}`),
        workMinutes: clamp(Math.round(Number(preset?.workMinutes) || 15), 5, 60),
        chaseMinutes: clamp(Math.round(Number(preset?.chaseMinutes) || 5), 1, 30),
        units: clamp(Math.round(Number(preset?.units) || 1), 1, 12),
      };
    })
    .filter((preset) => {
      if (seen.has(preset.id)) return false;
      seen.add(preset.id);
      return true;
    })
    .slice(0, 6);
}

function presetKey(workMinutes, chaseMinutes) {
  return `${workMinutes}:${chaseMinutes}`;
}

function normalizeSavedPresets(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value
    .map((preset) => ({
      workMinutes: clamp(Math.round(Number(preset.workMinutes) || 15), 5, 60),
      chaseMinutes: clamp(Math.round(Number(preset.chaseMinutes) || 5), 1, 30),
    }))
    .filter((preset) => {
      const key = presetKey(preset.workMinutes, preset.chaseMinutes);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizePreferences(value = {}) {
  const savedPresets = normalizeSavedPresets(value.savedPresets);
  const taskPresets = normalizeTaskPresets(value.taskPresets);
  const selectedTaskPreset = taskPresets.find(
    (preset) => preset.id === value.selectedTaskPresetId,
  );
  const savedPreset = savedPresets.find(
    (preset) =>
      presetKey(preset.workMinutes, preset.chaseMinutes) ===
      value.savedPresetKey,
  );
  const presetIndex = clamp(
    Number.isInteger(value.presetIndex)
      ? value.presetIndex
      : DEFAULT_PREFERENCES.presetIndex,
    0,
    PRESETS.length - 1,
  );
  const preset = PRESETS[presetIndex];
  return {
    presetIndex,
    savedPresetKey: savedPreset
      ? presetKey(savedPreset.workMinutes, savedPreset.chaseMinutes)
      : null,
    savedPresets,
    selectedTaskPresetId: selectedTaskPreset?.id ?? null,
    taskPresets,
    taskTitle: selectedTaskPreset?.title ?? normalizeTaskTitle(value.taskTitle),
    workMinutes:
      selectedTaskPreset?.workMinutes ??
      savedPreset?.workMinutes ??
      preset.workMinutes ??
      clamp(
        Number(value.workMinutes) || DEFAULT_PREFERENCES.workMinutes,
        5,
        60,
      ),
    chaseMinutes:
      selectedTaskPreset?.chaseMinutes ??
      savedPreset?.chaseMinutes ??
      preset.chaseMinutes ??
      clamp(
        Number(value.chaseMinutes) || DEFAULT_PREFERENCES.chaseMinutes,
        1,
        30,
      ),
    units:
      selectedTaskPreset?.units ??
      clamp(Number(value.units) || DEFAULT_PREFERENCES.units, 1, 12),
  };
}

export function registerTaskPreset(preferences, taskPreset) {
  const normalized = normalizePreferences(preferences);
  const id = String(taskPreset?.id || `task-${Date.now()}`).slice(0, 48);
  const preset = {
    id,
    title: normalizeTaskTitle(taskPreset?.title, `Task ${normalized.taskPresets.length + 1}`),
    workMinutes: clamp(Math.round(Number(taskPreset?.workMinutes) || 15), 5, 60),
    chaseMinutes: clamp(Math.round(Number(taskPreset?.chaseMinutes) || 5), 1, 30),
    units: clamp(Math.round(Number(taskPreset?.units) || 1), 1, 12),
  };
  const taskPresets = [
    preset,
    ...normalized.taskPresets.filter((item) => item.id !== id),
  ].slice(0, 6);
  return normalizePreferences({
    ...normalized,
    taskPresets,
    selectedTaskPresetId: id,
    taskTitle: preset.title,
    workMinutes: preset.workMinutes,
    chaseMinutes: preset.chaseMinutes,
    units: preset.units,
    presetIndex: PRESETS.length - 1,
    savedPresetKey: null,
  });
}

export function applyTaskPreset(preferences, taskPresetId) {
  const normalized = normalizePreferences(preferences);
  const preset = normalized.taskPresets.find(
    (item) => item.id === taskPresetId,
  );
  if (!preset) return normalized;
  return normalizePreferences({
    ...normalized,
    selectedTaskPresetId: preset.id,
    taskTitle: preset.title,
    workMinutes: preset.workMinutes,
    chaseMinutes: preset.chaseMinutes,
    units: preset.units,
    presetIndex: PRESETS.length - 1,
    savedPresetKey: null,
  });
}

export function removeTaskPreset(preferences, taskPresetId) {
  const normalized = normalizePreferences(preferences);
  return normalizePreferences({
    ...normalized,
    selectedTaskPresetId:
      normalized.selectedTaskPresetId === taskPresetId
        ? null
        : normalized.selectedTaskPresetId,
    taskPresets: normalized.taskPresets.filter(
      (item) => item.id !== taskPresetId,
    ),
  });
}

export function getPresetOptions(preferences) {
  const normalized = normalizePreferences(preferences);
  return [
    ...PRESETS.slice(0, -1).map((preset, index) => ({
      ...preset,
      key: `builtin:${index}`,
      presetIndex: index,
    })),
    ...normalized.savedPresets.map((preset) => ({
      ...preset,
      key: `saved:${presetKey(preset.workMinutes, preset.chaseMinutes)}`,
      savedPresetKey: presetKey(preset.workMinutes, preset.chaseMinutes),
      label: `${preset.workMinutes}＋${preset.chaseMinutes} ★`,
    })),
    {
      ...PRESETS[PRESETS.length - 1],
      key: "custom",
      presetIndex: PRESETS.length - 1,
    },
  ];
}

export function registerCurrentPreset(preferences) {
  const normalized = normalizePreferences(preferences);
  const key = presetKey(normalized.workMinutes, normalized.chaseMinutes);
  const matchesBuiltIn = PRESETS.slice(0, -1).some(
    (preset) =>
      preset.workMinutes === normalized.workMinutes &&
      preset.chaseMinutes === normalized.chaseMinutes,
  );
  const savedPresets = matchesBuiltIn
    ? normalized.savedPresets
    : [
        {
          workMinutes: normalized.workMinutes,
          chaseMinutes: normalized.chaseMinutes,
        },
        ...normalized.savedPresets.filter(
          (preset) => presetKey(preset.workMinutes, preset.chaseMinutes) !== key,
        ),
      ].slice(0, 6);
  return normalizePreferences({
    ...normalized,
    presetIndex: matchesBuiltIn
      ? PRESETS.findIndex(
          (preset) =>
            preset.workMinutes === normalized.workMinutes &&
            preset.chaseMinutes === normalized.chaseMinutes,
        )
      : PRESETS.length - 1,
    savedPresetKey: matchesBuiltIn ? null : key,
    savedPresets,
  });
}

export function createSession({
  nowMs,
  workMinutes,
  chaseMinutes,
  units,
  taskTitle = "Untitled",
  taskPresetId = null,
}) {
  const workSeconds = clamp(Math.round(workMinutes), 5, 60) * 60;
  const chaseSeconds = clamp(Math.round(chaseMinutes), 1, 30) * 60;
  const initialUnits = clamp(Math.round(units), 1, 12);
  const unitSeconds = workSeconds + chaseSeconds;

  return {
    id: `${Math.floor(nowMs)}-${initialUnits}-${workSeconds}-${chaseSeconds}`,
    taskTitle: normalizeTaskTitle(taskTitle),
    taskPresetId: taskPresetId ? String(taskPresetId) : null,
    startedAt: Math.floor(nowMs),
    workSeconds,
    chaseSeconds,
    initialUnits,
    currentPlannedUnits: initialUnits,
    initialPlannedSeconds: unitSeconds * initialUnits,
    currentPlannedSeconds: unitSeconds * initialUnits,
    totalPausedMs: 0,
    pausedAt: null,
    alarmEntries: [],
    status: "running",
  };
}

export function pauseSession(session, nowMs) {
  if (session.status === "paused") return session;
  return {
    ...session,
    status: "paused",
    pausedAt: Math.floor(nowMs),
  };
}

export function resumeSession(session, nowMs) {
  if (session.status !== "paused" || !session.pausedAt) return session;
  return {
    ...session,
    status: "running",
    totalPausedMs:
      (session.totalPausedMs || 0) +
      Math.max(0, Math.floor(nowMs) - session.pausedAt),
    pausedAt: null,
  };
}

function pausedMsAt(session, nowMs) {
  return (
    (session.totalPausedMs || 0) +
    (session.status === "paused" && session.pausedAt
      ? Math.max(0, Math.floor(nowMs) - session.pausedAt)
      : 0)
  );
}

export function addUnit(session) {
  const nextUnits = session.currentPlannedUnits + 1;
  const unitSeconds = session.workSeconds + session.chaseSeconds;
  return {
    ...session,
    currentPlannedUnits: nextUnits,
    currentPlannedSeconds: nextUnits * unitSeconds,
    status: "running",
  };
}

export function getSnapshot(session, nowMs) {
  const pausedMs = pausedMsAt(session, nowMs);
  const elapsedSeconds = Math.max(
    0,
    Math.floor(
      (Math.floor(nowMs) - session.startedAt - pausedMs) / 1000,
    ),
  );
  const unitSeconds = session.workSeconds + session.chaseSeconds;
  const plannedSeconds = session.currentPlannedSeconds;
  const plannedEndAt =
    session.startedAt + plannedSeconds * 1000 + pausedMs;

  if (elapsedSeconds >= plannedSeconds) {
    return {
      phase: "overtime",
      phaseLabel: "Extending",
      phaseRemainingSeconds: 0,
      phaseDurationSeconds: 0,
      phaseProgress: 1,
      elapsedSeconds,
      overtimeSeconds: elapsedSeconds - plannedSeconds,
      currentUnit: session.currentPlannedUnits,
      totalUnits: session.currentPlannedUnits,
      plannedSeconds,
      plannedEndAt,
      isPaused: session.status === "paused",
      pausedSeconds: Math.floor(pausedMs / 1000),
    };
  }

  const currentUnit = Math.floor(elapsedSeconds / unitSeconds) + 1;
  const offsetInUnit = elapsedSeconds % unitSeconds;
  const isWork = offsetInUnit < session.workSeconds;
  const phaseElapsedSeconds = isWork
    ? offsetInUnit
    : offsetInUnit - session.workSeconds;
  const phaseDurationSeconds = isWork
    ? session.workSeconds
    : session.chaseSeconds;

  return {
    phase: isWork ? "work" : "chase",
    phaseLabel: isWork ? "Work" : "Finish",
    phaseRemainingSeconds: Math.max(
      0,
      phaseDurationSeconds - phaseElapsedSeconds,
    ),
    phaseDurationSeconds,
    phaseProgress: phaseElapsedSeconds / phaseDurationSeconds,
    elapsedSeconds,
    overtimeSeconds: 0,
    currentUnit,
    totalUnits: session.currentPlannedUnits,
    plannedSeconds,
    plannedEndAt,
    isPaused: session.status === "paused",
    pausedSeconds: Math.floor(pausedMs / 1000),
  };
}

export function getUnitSegments(session, snapshot, maxVisible = 12) {
  const visibleCount = Math.min(
    Math.max(1, Math.floor(maxVisible)),
    snapshot.totalUnits,
  );
  const maxFirstUnit = snapshot.totalUnits - visibleCount + 1;
  const firstUnit = Math.max(
    1,
    Math.min(
      snapshot.currentUnit - Math.floor(visibleCount / 2),
      maxFirstUnit,
    ),
  );
  const unitSeconds = session.workSeconds + session.chaseSeconds;
  return Array.from({ length: visibleCount }, (_, index) => {
    const unit = firstUnit + index;
    return {
      unit,
      isCurrent: unit === snapshot.currentUnit,
      progress: Math.max(
        0,
        Math.min(
          1,
          (snapshot.elapsedSeconds - (unit - 1) * unitSeconds) / unitSeconds,
        ),
      ),
    };
  });
}

export function completeSession(session, nowMs) {
  const completedAt = Math.floor(nowMs);
  const pausedMs = pausedMsAt(session, nowMs);
  const actualSeconds = Math.max(
    0,
    Math.floor((completedAt - session.startedAt - pausedMs) / 1000),
  );

  return {
    id: session.id,
    taskTitle: normalizeTaskTitle(session.taskTitle),
    taskPresetId: session.taskPresetId ?? null,
    startedAt: session.startedAt,
    completedAt,
    workSeconds: session.workSeconds,
    chaseSeconds: session.chaseSeconds,
    initialUnits: session.initialUnits,
    addedUnits: session.currentPlannedUnits - session.initialUnits,
    initialPlannedSeconds: session.initialPlannedSeconds,
    finalPlannedSeconds: session.currentPlannedSeconds,
    actualSeconds,
    pausedSeconds: Math.floor(pausedMs / 1000),
    wallClockSeconds: Math.max(
      0,
      Math.floor((completedAt - session.startedAt) / 1000),
    ),
    varianceFromInitialSeconds:
      actualSeconds - session.initialPlannedSeconds,
    varianceFromFinalSeconds:
      actualSeconds - session.currentPlannedSeconds,
    completedWithinInitialPlan:
      actualSeconds <= session.initialPlannedSeconds,
  };
}

export function calculateHistoryStats(records) {
  if (!records.length) {
    return {
      count: 0,
      withinPlanRate: 0,
      medianActualSeconds: 0,
      extensionRate: 0,
    };
  }

  const actuals = records
    .map((record) => record.actualSeconds)
    .sort((a, b) => a - b);
  const middle = Math.floor(actuals.length / 2);
  const medianActualSeconds =
    actuals.length % 2 === 0
      ? Math.round((actuals[middle - 1] + actuals[middle]) / 2)
      : actuals[middle];

  return {
    count: records.length,
    withinPlanRate: Math.round(
      (records.filter((record) => record.completedWithinInitialPlan).length /
        records.length) *
        100,
    ),
    medianActualSeconds,
    extensionRate: Math.round(
      (records.filter((record) => record.addedUnits > 0).length /
        records.length) *
        100,
    ),
  };
}
