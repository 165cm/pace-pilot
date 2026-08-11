import * as alarm from "@zos/alarm";
import { getPackageInfo } from "@zos/app";

const SERVICE_URL = "app-service/boundary";

export function cancelAlarmEntries(entries = []) {
  entries.forEach((entry) => {
    try { alarm.cancel(entry.id); } catch (_error) { /* already gone */ }
  });
}

function addAlarm(atMs, kind, round) {
  const { appId } = getPackageInfo();
  const id = alarm.set({
    appid: appId,
    url: SERVICE_URL,
    time: Math.floor(atMs / 1000),
    param: JSON.stringify({ kind, round }),
    store: true,
    repeat_type: alarm.REPEAT_ONCE,
  });
  return id ? { id, atMs, kind, round } : null;
}

export function scheduleRemainingAlarms(session, nowMs) {
  const entries = [];
  const roundSeconds = session.workSeconds + session.breakSeconds;
  const shiftMs = (session.totalPausedMs || 0) - (session.skippedSeconds || 0) * 1000;
  for (let round = 1; round <= session.rounds; round += 1) {
    const base = session.startedAt + (round - 1) * roundSeconds * 1000 + shiftMs;
    const boundaries = [
      { atMs: base + session.workSeconds * 1000, kind: "break", round },
      {
        atMs: base + roundSeconds * 1000,
        kind: round === session.rounds ? "complete" : "work",
        round: Math.min(round + 1, session.rounds),
      },
    ];
    for (const boundary of boundaries) {
      if (boundary.atMs <= nowMs + 1000) continue;
      const entry = addAlarm(boundary.atMs, boundary.kind, boundary.round);
      if (!entry) {
        cancelAlarmEntries(entries);
        return { ok: false, entries: [] };
      }
      entries.push(entry);
    }
  }
  return { ok: true, entries };
}

export function scheduleInitialAlarms(session) {
  return scheduleRemainingAlarms(session, session.startedAt - 2000);
}
