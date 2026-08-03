import * as alarm from "@zos/alarm";
import { getPackageInfo } from "@zos/app";

const SERVICE_URL = "app-service/boundary";

function boundaryAt(session, unit, kind) {
  const unitSeconds = session.workSeconds + session.chaseSeconds;
  const base =
    session.startedAt +
    (session.totalPausedMs || 0) +
    (unit - 1) * unitSeconds * 1000;
  if (kind === "chase") {
    return base + session.workSeconds * 1000;
  }
  return base + unitSeconds * 1000;
}

function createBoundaryAlarm({ atMs, kind, unit }) {
  const { appId } = getPackageInfo();
  const id = alarm.set({
    appid: appId,
    url: SERVICE_URL,
    time: Math.floor(atMs / 1000),
    param: JSON.stringify({ kind, unit }),
    store: true,
    repeat_type: alarm.REPEAT_ONCE,
  });
  return id
    ? {
        id,
        atMs,
        kind,
        unit,
      }
    : null;
}

export function cancelAlarmEntries(entries = []) {
  for (const entry of entries) {
    try {
      alarm.cancel(entry.id);
    } catch (_error) {
      // Continue cancelling the remaining alarms.
    }
  }
}

export function scheduleInitialAlarms(session) {
  return scheduleRemainingAlarms(session, session.startedAt - 2000);
}

export function scheduleRemainingAlarms(session, nowMs) {
  const entries = [];
  for (let unit = 1; unit <= session.currentPlannedUnits; unit += 1) {
    const chaseAt = boundaryAt(session, unit, "chase");
    if (chaseAt > nowMs + 1000) {
      const chase = createBoundaryAlarm({
        atMs: chaseAt,
        kind: "chase",
        unit,
      });
      if (!chase) {
        cancelAlarmEntries(entries);
        return {
          ok: false,
          entries: [],
          supportedUnits: Math.floor(entries.length / 2),
        };
      }
      entries.push(chase);
    }

    const endKind =
      unit === session.currentPlannedUnits ? "end" : "work";
    const endAt = boundaryAt(session, unit, endKind);
    if (endAt > nowMs + 1000) {
      const end = createBoundaryAlarm({
        atMs: endAt,
        kind: endKind,
        unit: unit + 1,
      });
      if (!end) {
        cancelAlarmEntries(entries);
        return {
          ok: false,
          entries: [],
          supportedUnits: Math.floor(entries.length / 2),
        };
      }
      entries.push(end);
    }
  }

  return { ok: true, entries, supportedUnits: session.currentPlannedUnits };
}

export function scheduleAddedUnit(previousSession, nextSession, nowMs) {
  const oldEnd = previousSession.alarmEntries.find(
    (entry) => entry.kind === "end",
  );
  const retained = previousSession.alarmEntries.filter(
    (entry) => entry.kind !== "end",
  );
  if (oldEnd) {
    cancelAlarmEntries([oldEnd]);
  }

  const unit = nextSession.currentPlannedUnits;
  const oldEndAt =
    previousSession.startedAt +
    (previousSession.totalPausedMs || 0) +
    previousSession.currentPlannedSeconds * 1000;
  const candidates = [
    { atMs: oldEndAt, kind: "work", unit },
    {
      atMs: boundaryAt(nextSession, unit, "chase"),
      kind: "chase",
      unit,
    },
    {
      atMs: boundaryAt(nextSession, unit, "end"),
      kind: "end",
      unit: unit + 1,
    },
  ].filter((candidate) => candidate.atMs > nowMs + 1000);

  const created = [];
  for (const candidate of candidates) {
    const entry = createBoundaryAlarm(candidate);
    if (!entry) {
      cancelAlarmEntries(created);
      const restored =
        oldEndAt > nowMs + 1000
          ? createBoundaryAlarm({
              atMs: oldEndAt,
              kind: "end",
              unit,
            })
          : null;
      return {
        ok: false,
        entries: restored ? [...retained, restored] : retained,
      };
    }
    created.push(entry);
  }

  return { ok: true, entries: [...retained, ...created] };
}
