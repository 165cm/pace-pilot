import { queryPermission, requestPermission } from "@zos/app";
import { showToast } from "@zos/interaction";
import {
  createSession,
  completeSession,
  addUnit,
  pauseSession,
  resumeSession,
} from "../core/timer-engine";
import {
  saveActiveSession,
  clearActiveSession,
  appendHistory,
} from "./storage";
import {
  scheduleInitialAlarms,
  scheduleAddedUnit,
  scheduleRemainingAlarms,
  cancelAlarmEntries,
} from "./alarm-manager";

const REQUIRED_PERMISSIONS = [
  "device:os.alarm",
  "device:os.notification",
];

export function ensureTimerPermissions(onGranted) {
  const statuses = queryPermission({ permissions: REQUIRED_PERMISSIONS });
  if (statuses.every((status) => status === 2)) {
    onGranted();
    return;
  }

  requestPermission({
    permissions: REQUIRED_PERMISSIONS,
    callback(results) {
      if (results.every((status) => status === 2)) {
        onGranted();
      } else {
        showToast({ content: "Allow alarms and notifications" });
      }
    },
  });
}

export function startNewSession({
  nowMs,
  workMinutes,
  chaseMinutes,
  units,
  taskTitle,
  taskPresetId,
}) {
  const session = createSession({
    nowMs,
    workMinutes,
    chaseMinutes,
    units,
    taskTitle,
    taskPresetId,
  });
  const scheduled = scheduleInitialAlarms(session);
  if (!scheduled.ok) {
    showToast({
      content:
        scheduled.supportedUnits > 0
          ? `This watch supports ${scheduled.supportedUnits} units`
          : "Could not set alarms",
    });
    return null;
  }

  const active = { ...session, alarmEntries: scheduled.entries };
  saveActiveSession(active);
  return active;
}

export function extendSession(session, nowMs) {
  const next = addUnit(session);
  const scheduled = scheduleAddedUnit(session, next, nowMs);
  if (!scheduled.ok) {
    showToast({ content: "Could not auto-extend" });
    saveActiveSession({ ...session, alarmEntries: scheduled.entries });
    return null;
  }

  const active = { ...next, alarmEntries: scheduled.entries };
  saveActiveSession(active);
  return active;
}

export function pauseActiveSession(session, nowMs) {
  const paused = pauseSession(session, nowMs);
  // Persist the paused state before cancelling to prevent a boundary callback
  // racing with the pause action from extending the session.
  saveActiveSession(paused);
  cancelAlarmEntries(session.alarmEntries);
  const active = {
    ...paused,
    alarmEntries: [],
  };
  saveActiveSession(active);
  return active;
}

export function resumeActiveSession(session, nowMs) {
  const resumed = resumeSession(session, nowMs);
  const scheduled = scheduleRemainingAlarms(resumed, nowMs);
  if (!scheduled.ok) {
    showToast({ content: "Could not resume alarms" });
    return null;
  }
  const active = { ...resumed, alarmEntries: scheduled.entries };
  saveActiveSession(active);
  return active;
}

export function finishSession(session, nowMs) {
  cancelAlarmEntries(session.alarmEntries);
  const record = completeSession(session, nowMs);
  appendHistory(record);
  clearActiveSession();
  return record;
}

export function abortSession(session) {
  cancelAlarmEntries(session?.alarmEntries);
  clearActiveSession();
}
