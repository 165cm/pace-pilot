import test from "node:test";
import assert from "node:assert/strict";
import {
  PRESETS,
  normalizePreferences,
  createSession,
  getSnapshot,
  addUnit,
  pauseSession,
  resumeSession,
  registerCurrentPreset,
  registerTaskPreset,
  applyTaskPreset,
  removeTaskPreset,
  getPresetOptions,
  getUnitSegments,
  completeSession,
  calculateHistoryStats,
} from "../core/timer-engine.js";
import {
  formatDuration,
  formatSignedDuration,
} from "../core/format.js";
import {
  isInsideSafeArea,
  threePartControlLayout,
  twoButtonLayout,
} from "../core/layout.js";
import { groupHistoryByDate } from "../core/history.js";

const START = Date.UTC(2026, 6, 31, 10, 0, 0);

function session15Plus5(units = 3) {
  return createSession({
    nowMs: START,
    workMinutes: 15,
    chaseMinutes: 5,
    units,
  });
}

test("初期設定は15＋5で1単位", () => {
  const preferences = normalizePreferences();
  assert.equal(PRESETS[preferences.presetIndex].label, "15＋5");
  assert.equal(preferences.workMinutes, 15);
  assert.equal(preferences.chaseMinutes, 5);
  assert.equal(preferences.units, 1);
});

test("入力範囲を安全な値に補正する", () => {
  const preferences = normalizePreferences({
    presetIndex: 4,
    workMinutes: 100,
    chaseMinutes: -4,
    units: 30,
  });
  assert.equal(preferences.workMinutes, 60);
  assert.equal(preferences.chaseMinutes, 1);
  assert.equal(preferences.units, 12);
});

test("開始直後は1単位目の作業フェーズ", () => {
  const snapshot = getSnapshot(session15Plus5(), START);
  assert.equal(snapshot.phase, "work");
  assert.equal(snapshot.currentUnit, 1);
  assert.equal(snapshot.phaseRemainingSeconds, 15 * 60);
  assert.equal(snapshot.elapsedSeconds, 0);
});

test("15分後に追い上げへ自動遷移する", () => {
  const snapshot = getSnapshot(
    session15Plus5(),
    START + 15 * 60 * 1000,
  );
  assert.equal(snapshot.phase, "chase");
  assert.equal(snapshot.currentUnit, 1);
  assert.equal(snapshot.phaseRemainingSeconds, 5 * 60);
  assert.equal(snapshot.elapsedSeconds, 15 * 60);
});

test("20分後は2単位目の作業で総経過20分", () => {
  const snapshot = getSnapshot(
    session15Plus5(),
    START + 20 * 60 * 1000,
  );
  assert.equal(snapshot.phase, "work");
  assert.equal(snapshot.currentUnit, 2);
  assert.equal(snapshot.phaseRemainingSeconds, 15 * 60);
  assert.equal(snapshot.elapsedSeconds, 20 * 60);
});

test("最終予定を過ぎると超過を計測する", () => {
  const snapshot = getSnapshot(
    session15Plus5(),
    START + (60 * 60 + 222) * 1000,
  );
  assert.equal(snapshot.phase, "overtime");
  assert.equal(snapshot.overtimeSeconds, 222);
  assert.equal(snapshot.elapsedSeconds, 60 * 60 + 222);
});

test("超過3分後に1単位追加すると追加単位の作業中になる", () => {
  const extended = addUnit(session15Plus5());
  const snapshot = getSnapshot(
    extended,
    START + 63 * 60 * 1000,
  );
  assert.equal(snapshot.phase, "work");
  assert.equal(snapshot.currentUnit, 4);
  assert.equal(snapshot.phaseRemainingSeconds, 12 * 60);
  assert.equal(snapshot.totalUnits, 4);
});

test("完了記録は当初予定と最終予定の差を保持する", () => {
  const session = addUnit(session15Plus5(2));
  const record = completeSession(
    session,
    START + 45 * 60 * 1000,
  );
  assert.equal(record.initialPlannedSeconds, 40 * 60);
  assert.equal(record.finalPlannedSeconds, 60 * 60);
  assert.equal(record.actualSeconds, 45 * 60);
  assert.equal(record.varianceFromInitialSeconds, 5 * 60);
  assert.equal(record.varianceFromFinalSeconds, -15 * 60);
  assert.equal(record.addedUnits, 1);
  assert.equal(record.completedWithinInitialPlan, false);
});

test("履歴統計は中央値・予定内率・追加率を計算する", () => {
  const records = [
    {
      actualSeconds: 600,
      completedWithinInitialPlan: true,
      addedUnits: 0,
    },
    {
      actualSeconds: 1200,
      completedWithinInitialPlan: false,
      addedUnits: 1,
    },
    {
      actualSeconds: 900,
      completedWithinInitialPlan: true,
      addedUnits: 0,
    },
  ];
  const stats = calculateHistoryStats(records);
  assert.equal(stats.medianActualSeconds, 900);
  assert.equal(stats.withinPlanRate, 67);
  assert.equal(stats.extensionRate, 33);
});

test("時間表示は1時間以上と符号付き差分に対応する", () => {
  assert.equal(formatDuration(63 * 60 + 42), "01:03:42");
  assert.equal(formatSignedDuration(-462), "－07:42");
  assert.equal(formatSignedDuration(222), "＋03:42");
});

test("一時停止中は経過と単位タイマーが進まず終了予定だけ後ろへ延びる", () => {
  const paused = pauseSession(session15Plus5(1), START + 5 * 60 * 1000);
  const snapshot = getSnapshot(paused, START + 8 * 60 * 1000);
  assert.equal(snapshot.isPaused, true);
  assert.equal(snapshot.elapsedSeconds, 5 * 60);
  assert.equal(snapshot.phaseRemainingSeconds, 10 * 60);
  assert.equal(snapshot.plannedEndAt, START + 23 * 60 * 1000);
});

test("再開後は停止時間を除外してタイマーを継続する", () => {
  const paused = pauseSession(session15Plus5(1), START + 5 * 60 * 1000);
  const resumed = resumeSession(paused, START + 8 * 60 * 1000);
  const snapshot = getSnapshot(resumed, START + 10 * 60 * 1000);
  assert.equal(snapshot.isPaused, false);
  assert.equal(snapshot.elapsedSeconds, 7 * 60);
  assert.equal(snapshot.phaseRemainingSeconds, 8 * 60);
});

test("完了履歴は停止時間を実績から除外して記録する", () => {
  const paused = pauseSession(session15Plus5(1), START + 5 * 60 * 1000);
  const resumed = resumeSession(paused, START + 8 * 60 * 1000);
  const record = completeSession(resumed, START + 13 * 60 * 1000);
  assert.equal(record.actualSeconds, 10 * 60);
  assert.equal(record.pausedSeconds, 3 * 60);
  assert.equal(record.wallClockSeconds, 13 * 60);
});

test("カスタム時間をプリセットとして最大6件保存できる", () => {
  let preferences = normalizePreferences({
    presetIndex: 4,
    workMinutes: 18,
    chaseMinutes: 4,
  });
  preferences = registerCurrentPreset(preferences);
  assert.equal(preferences.savedPresetKey, "18:4");
  assert.equal(preferences.savedPresets.length, 1);
  assert.ok(
    getPresetOptions(preferences).some((option) => option.label === "18＋4 ★"),
  );
});

test("作業タイトル・時間・単位数を作業プリセットとして保存して選択できる", () => {
  const saved = registerTaskPreset(normalizePreferences(), {
    id: "repair-ac",
    title: "AC Repair",
    workMinutes: 20,
    chaseMinutes: 10,
    units: 3,
  });
  assert.equal(saved.taskPresets.length, 1);
  assert.equal(saved.taskTitle, "AC Repair");
  assert.equal(saved.workMinutes, 20);
  assert.equal(saved.chaseMinutes, 10);
  assert.equal(saved.units, 3);

  const other = normalizePreferences({
    ...saved,
    selectedTaskPresetId: null,
    taskTitle: "Untitled",
    workMinutes: 15,
    chaseMinutes: 5,
    units: 1,
  });
  const selected = applyTaskPreset(other, "repair-ac");
  assert.equal(selected.selectedTaskPresetId, "repair-ac");
  assert.equal(selected.taskTitle, "AC Repair");
  assert.equal(selected.units, 3);
});

test("作業プリセットは最大6件で削除後も設定を安全に保持する", () => {
  let preferences = normalizePreferences();
  for (let index = 1; index <= 7; index += 1) {
    preferences = registerTaskPreset(preferences, {
      id: `task-${index}`,
      title: `Task ${index}`,
      workMinutes: 10 + index,
      chaseMinutes: 5,
      units: index,
    });
  }
  assert.equal(preferences.taskPresets.length, 6);
  assert.equal(preferences.taskPresets[0].title, "Task 7");
  const removed = removeTaskPreset(preferences, "task-7");
  assert.equal(removed.taskPresets.length, 5);
  assert.equal(removed.selectedTaskPresetId, null);
});

test("作業名は履歴まで引き継がれる", () => {
  const session = createSession({
    nowMs: START,
    workMinutes: 15,
    chaseMinutes: 5,
    units: 2,
    taskTitle: "Filter Clean",
    taskPresetId: "filter-clean",
  });
  const record = completeSession(session, START + 30 * 60 * 1000);
  assert.equal(record.taskTitle, "Filter Clean");
  assert.equal(record.taskPresetId, "filter-clean");
});

test("全体進捗は単位ごとの区画に分割される", () => {
  const session = session15Plus5(3);
  const snapshot = getSnapshot(session, START + 25 * 60 * 1000);
  const segments = getUnitSegments(session, snapshot);
  assert.deepEqual(
    segments.map((segment) => segment.progress),
    [1, 0.25, 0],
  );
  assert.equal(segments[1].isCurrent, true);
});

test("Bip 6の開始画面コントロールは左右24pxの安全域に収まる", () => {
  const controls = threePartControlLayout({
    width: 390,
    margin: 24,
    sideWidth: 54,
    gap: 10,
  });
  assert.deepEqual(controls, {
    left: { x: 24, w: 54 },
    center: { x: 88, w: 214 },
    right: { x: 312, w: 54 },
  });
});

test("Bip 6の進行画面ボタンは角丸安全域内に収まる", () => {
  const controls = twoButtonLayout({ width: 390, margin: 24, gap: 10 });
  const screen = { width: 390, height: 450 };
  const safe = { left: 24, right: 24, top: 16, bottom: 28 };
  assert.equal(
    isInsideSafeArea(
      { x: controls.left.x, y: 368, w: controls.left.w, h: 54 },
      screen,
      safe,
    ),
    true,
  );
  assert.equal(
    isInsideSafeArea(
      { x: controls.right.x, y: 368, w: controls.right.w, h: 54 },
      screen,
      safe,
    ),
    true,
  );
});

test("320px角型端末でも開始画面の3分割操作が安全域に収まる", () => {
  const controls = threePartControlLayout({
    width: 320,
    margin: 20,
    sideWidth: 45,
    gap: 8,
  });
  assert.equal(controls.left.x, 20);
  assert.equal(controls.right.x + controls.right.w, 300);
  assert.ok(controls.center.w >= 170);
});

test("履歴は日付と開始時刻の降順でグループ化される", () => {
  const aug1 = new Date(2026, 7, 1, 16, 0).getTime();
  const aug2Morning = new Date(2026, 7, 2, 9, 0).getTime();
  const aug2Evening = new Date(2026, 7, 2, 18, 0).getTime();
  const groups = groupHistoryByDate([
    { startedAt: aug1 },
    { startedAt: aug2Morning },
    { startedAt: aug2Evening },
  ]);
  assert.equal(groups.length, 2);
  assert.deepEqual(
    groups[0].records.map((record) => record.startedAt),
    [aug2Evening, aug2Morning],
  );
  assert.deepEqual(
    groups[1].records.map((record) => record.startedAt),
    [aug1],
  );
});
