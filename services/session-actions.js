import { queryPermission, requestPermission } from "@zos/app";
import { showToast } from "@zos/interaction";
import {
  createSession, completeSession, pauseSession, resumeSession, skipPhase,
} from "../core/timer-engine";
import {
  saveActiveSession, clearActiveSession, appendHistory,
} from "./storage";
import {
  scheduleInitialAlarms, scheduleRemainingAlarms, cancelAlarmEntries,
} from "./alarm-manager";

const REQUIRED_PERMISSIONS = ["device:os.alarm", "device:os.notification"];

export function ensureTimerPermissions(onGranted) {
  const statuses = queryPermission({ permissions: REQUIRED_PERMISSIONS });
  if (statuses.every((status) => status === 2)) return onGranted();
  requestPermission({
    permissions: REQUIRED_PERMISSIONS,
    callback(results) {
      if (results.every((status) => status === 2)) onGranted();
      else showToast({ content: "Allow timer notifications" });
    },
  });
}

function reschedule(session, nowMs) {
  cancelAlarmEntries(session.alarmEntries);
  const scheduled = scheduleRemainingAlarms(session, nowMs);
  if (!scheduled.ok) {
    showToast({ content: "Could not set timer alerts" });
    return null;
  }
  const active = { ...session, alarmEntries: scheduled.entries };
  saveActiveSession(active);
  return active;
}

export function startNewSession({ nowMs, presetIndex }) {
  const session = createSession({ nowMs, presetIndex });
  const scheduled = scheduleInitialAlarms(session);
  if (!scheduled.ok) {
    showToast({ content: "Could not set timer alerts" });
    return null;
  }
  const active = { ...session, alarmEntries: scheduled.entries };
  saveActiveSession(active);
  return active;
}

export function pauseActiveSession(session, nowMs) {
  const paused = pauseSession(session, nowMs);
  cancelAlarmEntries(session.alarmEntries);
  const active = { ...paused, alarmEntries: [] };
  saveActiveSession(active);
  return active;
}

export function resumeActiveSession(session, nowMs) {
  return reschedule(resumeSession(session, nowMs), nowMs);
}

export function skipActivePhase(session, nowMs) {
  return reschedule(skipPhase(session, nowMs), nowMs);
}

export function finishSession(session, nowMs, reason = "completed") {
  cancelAlarmEntries(session.alarmEntries);
  const record = completeSession(session, nowMs, reason);
  appendHistory(record);
  clearActiveSession();
  return record;
}

export function abortSession(session) {
  cancelAlarmEntries(session?.alarmEntries);
  clearActiveSession();
}
