import hmUI from "@zos/ui";
import { Time, Vibrator, VIBRATOR_SCENE_SHORT_MIDDLE } from "@zos/sensor";
import { replace } from "@zos/router";
import { setWakeUpRelaunch } from "@zos/display";
import { px } from "@zos/utils";
import { getSnapshot } from "../core/timer-engine";
import { formatClockFromDate, formatDuration } from "../core/format";
import { getActiveSession } from "../services/storage";
import {
  finishSession, pauseActiveSession, resumeActiveSession, skipActivePhase,
} from "../services/session-actions";
import {
  WIDTH, HEIGHT, COLORS, textStyle, buttonStyle, drawBackground, SAFE_SIDE,
} from "../ui/common";

const timeSensor = new Time();
const vibrator = new Vibrator();

Page({
  state: {
    session: null, timer: null, phaseText: null, roundText: null,
    countdownText: null, detailText: null, progressFill: null,
    pauseButton: null, skipButton: null, lastPhase: null,
  },

  onInit() { this.state.session = getActiveSession(); },

  build() {
    if (!this.state.session) return replace({ url: "page/home" });
    setWakeUpRelaunch({ relaunch: true });
    drawBackground();
    this.state.phaseText = hmUI.createWidget(hmUI.widget.TEXT, textStyle({
      y: px(24), h: px(38), text: "", size: 27,
    }));
    this.state.roundText = hmUI.createWidget(hmUI.widget.TEXT, textStyle({
      y: px(64), h: px(28), text: "", size: 19, color: COLORS.muted,
    }));
    this.state.countdownText = hmUI.createWidget(hmUI.widget.TEXT, textStyle({
      x: px(12), y: px(105), w: WIDTH - px(24), h: px(94), text: "", size: 72,
    }));
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: SAFE_SIDE, y: px(218), w: WIDTH - SAFE_SIDE * 2, h: px(10),
      color: COLORS.faint, radius: px(5),
    });
    this.state.progressFill = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: SAFE_SIDE, y: px(218), w: px(1), h: px(10),
      color: COLORS.work, radius: px(5),
    });
    this.state.detailText = hmUI.createWidget(hmUI.widget.TEXT, textStyle({
      x: SAFE_SIDE, y: px(243), w: WIDTH - SAFE_SIDE * 2, h: px(62),
      text: "", size: 18, color: COLORS.muted,
    }));

    const buttonY = HEIGHT - px(124);
    const gap = px(8);
    const width = Math.floor((WIDTH - SAFE_SIDE * 2 - gap * 2) / 3);
    const buttons = [
      ["End", COLORS.danger, () => this.end()],
      ["Skip", COLORS.panel, () => this.skip()],
      ["Pause", COLORS.work, () => this.togglePause()],
    ];
    buttons.forEach(([text, color, click], index) => {
      const widget = hmUI.createWidget(hmUI.widget.BUTTON, buttonStyle({
        x: SAFE_SIDE + index * (width + gap), y: buttonY, w: width, h: px(58),
        text, size: 18, normal: color, click,
      }));
      if (index === 1) this.state.skipButton = widget;
      if (index === 2) this.state.pauseButton = widget;
    });
    this.update();
    this.state.timer = setInterval(() => this.update(), 1000);
  },

  update() {
    const nowMs = timeSensor.getTime();
    const stored = getActiveSession();
    if (stored?.id === this.state.session.id) this.state.session = stored;
    const snapshot = getSnapshot(this.state.session, nowMs);
    if (snapshot.isCompleted) return this.complete(nowMs);
    const accent = snapshot.phase === "work" ? COLORS.work : COLORS.chase;
    const label = snapshot.isPaused ? "PAUSED" : snapshot.phaseLabel;
    this.state.phaseText.setProperty(hmUI.prop.MORE, {
      x: 0, y: px(24), w: WIDTH, h: px(38), text: label,
      text_size: px(27), color: snapshot.isPaused ? COLORS.muted : accent,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    });
    this.state.roundText.setProperty(
      hmUI.prop.TEXT, `Round ${snapshot.currentRound} / ${snapshot.totalRounds}`,
    );
    this.state.countdownText.setProperty(
      hmUI.prop.TEXT, formatDuration(snapshot.phaseRemainingSeconds),
    );
    this.state.detailText.setProperty(
      hmUI.prop.TEXT,
      `End ${formatClockFromDate(new Date(snapshot.plannedEndAt))}    ` +
      `Elapsed ${formatDuration(snapshot.elapsedSeconds)}`,
    );
    this.state.progressFill.setProperty(hmUI.prop.MORE, {
      x: SAFE_SIDE, y: px(218),
      w: Math.max(px(1), Math.round((WIDTH - SAFE_SIDE * 2) * snapshot.overallProgress)),
      h: px(10), color: snapshot.isPaused ? COLORS.muted : accent, radius: px(5),
    });
    this.state.pauseButton.setProperty(hmUI.prop.TEXT, snapshot.isPaused ? "Resume" : "Pause");
    this.state.skipButton.setProperty(hmUI.prop.TEXT, snapshot.isPaused ? "—" : "Skip");
    if (this.state.lastPhase && this.state.lastPhase !== snapshot.phase && !snapshot.isPaused) {
      vibrator.start({ mode: VIBRATOR_SCENE_SHORT_MIDDLE });
    }
    this.state.lastPhase = snapshot.phase;
  },

  togglePause() {
    const nowMs = timeSensor.getTime();
    const next = this.state.session.status === "paused"
      ? resumeActiveSession(this.state.session, nowMs)
      : pauseActiveSession(this.state.session, nowMs);
    if (next) { this.state.session = next; this.update(); }
  },

  skip() {
    if (this.state.session.status === "paused") return;
    const next = skipActivePhase(this.state.session, timeSensor.getTime());
    if (next) {
      this.state.session = next;
      vibrator.start({ mode: VIBRATOR_SCENE_SHORT_MIDDLE });
      this.update();
    }
  },

  end() {
    finishSession(this.state.session, timeSensor.getTime(), "ended");
    setWakeUpRelaunch({ relaunch: false });
    replace({ url: "page/home" });
  },

  complete(nowMs) {
    if (this.state.timer) { clearInterval(this.state.timer); this.state.timer = null; }
    finishSession(this.state.session, nowMs, "completed");
    vibrator.start({ mode: VIBRATOR_SCENE_SHORT_MIDDLE });
    setWakeUpRelaunch({ relaunch: false });
    replace({ url: "page/complete" });
  },

  onDestroy() { if (this.state.timer) clearInterval(this.state.timer); },
});
