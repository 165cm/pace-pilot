import test from "node:test";
import assert from "node:assert/strict";
import {
  PRESETS, ROUNDS, normalizePreferences, createSession, getSnapshot,
  pauseSession, resumeSession, skipPhase, completeSession,
} from "../core/timer-engine.js";
import { formatDuration } from "../core/format.js";
import { isInsideSafeArea, twoButtonLayout } from "../core/layout.js";
import { groupHistoryByDate } from "../core/history.js";

const START = Date.UTC(2026, 6, 31, 10, 0, 0);
const session = () => createSession({ nowMs: START, presetIndex: 1 });

test("v1 exposes exactly three fixed presets and defaults to 15 / 5", () => {
  assert.deepEqual(PRESETS.map((item) => item.label), ["10 / 5", "15 / 5", "20 / 10"]);
  assert.equal(normalizePreferences().presetIndex, 1);
  assert.equal(ROUNDS, 3);
});

test("a session starts in WORK round 1 with a 60 minute total", () => {
  const value = session();
  const snapshot = getSnapshot(value, START);
  assert.equal(value.plannedSeconds, 60 * 60);
  assert.equal(snapshot.phase, "work");
  assert.equal(snapshot.currentRound, 1);
  assert.equal(snapshot.phaseRemainingSeconds, 15 * 60);
});

test("work automatically changes to break", () => {
  const snapshot = getSnapshot(session(), START + 15 * 60 * 1000);
  assert.equal(snapshot.phase, "break");
  assert.equal(snapshot.phaseRemainingSeconds, 5 * 60);
});

test("break automatically changes to the next work round", () => {
  const snapshot = getSnapshot(session(), START + 20 * 60 * 1000);
  assert.equal(snapshot.phase, "work");
  assert.equal(snapshot.currentRound, 2);
});

test("the final break automatically completes the session", () => {
  const snapshot = getSnapshot(session(), START + 60 * 60 * 1000);
  assert.equal(snapshot.phase, "completed");
  assert.equal(snapshot.isCompleted, true);
  assert.equal(snapshot.overallProgress, 1);
});

test("pause freezes countdown and resume excludes paused time", () => {
  const paused = pauseSession(session(), START + 5 * 60 * 1000);
  assert.equal(getSnapshot(paused, START + 8 * 60 * 1000).phaseRemainingSeconds, 10 * 60);
  const resumed = resumeSession(paused, START + 8 * 60 * 1000);
  assert.equal(getSnapshot(resumed, START + 10 * 60 * 1000).phaseRemainingSeconds, 8 * 60);
});

test("skip advances directly to the next phase", () => {
  const skipped = skipPhase(session(), START + 4 * 60 * 1000);
  const snapshot = getSnapshot(skipped, START + 4 * 60 * 1000);
  assert.equal(snapshot.phase, "break");
  assert.equal(snapshot.phaseRemainingSeconds, 5 * 60);
});

test("completion records the selected preset and planned total", () => {
  const record = completeSession(session(), START + 60 * 60 * 1000);
  assert.equal(record.presetIndex, 1);
  assert.equal(record.startedAt, START);
  assert.equal(record.actualSeconds, 60 * 60);
  assert.equal(record.totalSeconds, 60 * 60);
  assert.equal(record.rounds, 3);
});

test("history groups completed sessions by date", () => {
  const first = completeSession(session(), START + 60 * 60 * 1000);
  const nextDay = createSession({ nowMs: START + 24 * 60 * 60 * 1000, presetIndex: 0 });
  const second = completeSession(nextDay, nextDay.startedAt + 45 * 60 * 1000);
  const groups = groupHistoryByDate([first, second]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].records[0].presetIndex, 0);
});

test("MM:SS remains zero-padded", () => {
  assert.equal(formatDuration(5 * 60), "05:00");
  assert.equal(formatDuration(12 * 60 + 6), "12:06");
});

test("Bip 6 controls fit the 390 x 450 safe area", () => {
  const controls = twoButtonLayout({ width: 390, margin: 24, gap: 10 });
  assert.equal(isInsideSafeArea(
    { x: controls.left.x, y: 326, w: controls.left.w, h: 58 },
    { width: 390, height: 450 },
    { left: 24, right: 24, top: 16, bottom: 28 },
  ), true);
});
