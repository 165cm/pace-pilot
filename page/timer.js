import hmUI from "@zos/ui";
import { Time, Vibrator, VIBRATOR_SCENE_SHORT_MIDDLE } from "@zos/sensor";
import { replace } from "@zos/router";
import { setWakeUpRelaunch } from "@zos/display";
import { px } from "@zos/utils";
import { getSnapshot, getUnitSegments } from "../core/timer-engine";
import { twoButtonLayout } from "../core/layout";
import { formatClockFromDate, formatDuration } from "../core/format";
import { getActiveSession } from "../services/storage";
import {
  extendSession,
  finishSession,
  pauseActiveSession,
  resumeActiveSession,
} from "../services/session-actions";
import {
  WIDTH,
  HEIGHT,
  IS_SQUARE,
  COLORS,
  textStyle,
  buttonStyle,
  drawBackground,
  SAFE_SIDE,
  SAFE_TOP,
  SAFE_BOTTOM,
} from "../ui/common";

const timeSensor = new Time();
const vibrator = new Vibrator();
const MAX_VISIBLE_UNITS = 12;
const ARC_START = -225;
const ARC_SWEEP = 270;

Page({
  state: {
    session: null,
    updateTimer: null,
    startTimeText: null,
    currentTimeText: null,
    endTimeText: null,
    overallSegments: [],
    phaseText: null,
    countdownText: null,
    elapsedText: null,
    progressArc: null,
    pauseButton: null,
    lastPhase: null,
  },

  onInit() {
    this.state.session = getActiveSession();
  },

  build() {
    if (!this.state.session) {
      replace({ url: "page/home" });
      return;
    }
    setWakeUpRelaunch({ relaunch: true });
    drawBackground();
    this.buildOverallTimeline();
    this.buildUnitTimer();
    this.buildControls();
    this.update();
    this.state.updateTimer = setInterval(() => this.update(), 1000);
  },

  buildOverallTimeline() {
    const side = SAFE_SIDE;
    const gap = px(6);
    const columnWidth = Math.floor((WIDTH - side * 2 - gap * 2) / 3);
    const labels = ["Start", "Now", "End"];
    const keys = ["startTimeText", "currentTimeText", "endTimeText"];
    labels.forEach((label, index) => {
      const x = side + index * (columnWidth + gap);
      hmUI.createWidget(
        hmUI.widget.TEXT,
        textStyle({
          x,
          y: SAFE_TOP,
          w: columnWidth,
          h: px(20),
          text: label,
          size: 14,
          color: COLORS.muted,
        }),
      );
      this.state[keys[index]] = hmUI.createWidget(
        hmUI.widget.TEXT,
        textStyle({
          x,
          y: SAFE_TOP + px(19),
          w: columnWidth,
          h: px(31),
          text: "",
          size: IS_SQUARE ? 22 : 23,
        }),
      );
    });

    const barX = SAFE_SIDE;
    const barY = SAFE_TOP + px(IS_SQUARE ? 57 : 54);
    const barWidth = WIDTH - barX * 2;
    this.state.overallSegments = Array.from(
      { length: MAX_VISIBLE_UNITS },
      () => ({
        track: hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: WIDTH + px(4),
          y: barY,
          w: px(1),
          h: px(9),
          color: COLORS.faint,
          radius: px(4),
        }),
        fill: hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: WIDTH + px(4),
          y: barY,
          w: px(1),
          h: px(9),
          color: COLORS.faint,
          radius: px(4),
        }),
      }),
    );
  },

  buildUnitTimer() {
    const arcSize = px(IS_SQUARE ? 246 : 280);
    const arcX = Math.round((WIDTH - arcSize) / 2);
    const arcY = px(IS_SQUARE ? 88 : 100);
    const lineWidth = px(7);
    hmUI.createWidget(hmUI.widget.ARC, {
      x: arcX,
      y: arcY,
      w: arcSize,
      h: arcSize,
      start_angle: ARC_START,
      end_angle: ARC_START + ARC_SWEEP,
      line_width: lineWidth,
      color: COLORS.faint,
    });
    this.state.progressArc = hmUI.createWidget(hmUI.widget.ARC, {
      x: arcX,
      y: arcY,
      w: arcSize,
      h: arcSize,
      start_angle: ARC_START,
      end_angle: ARC_START + 1,
      line_width: lineWidth,
      color: COLORS.work,
    });
    this.state.phaseText = hmUI.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        x: arcX + px(20),
        y: arcY + px(34),
        w: arcSize - px(40),
        h: px(34),
        text: "",
        size: 20,
        color: COLORS.muted,
      }),
    );
    this.state.countdownText = hmUI.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        x: arcX + px(12),
        y: arcY + px(76),
        w: arcSize - px(24),
        h: px(78),
        text: "",
        size: IS_SQUARE ? 68 : 72,
      }),
    );
    this.state.elapsedText = hmUI.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        x: arcX + px(20),
        y: arcY + px(155),
        w: arcSize - px(40),
        h: px(38),
        text: "",
        size: 22,
        color: COLORS.muted,
      }),
    );
  },

  buildControls() {
    const y = HEIGHT - SAFE_BOTTOM - px(54);
    const margin = SAFE_SIDE;
    const gap = px(10);
    const controls = twoButtonLayout({ width: WIDTH, margin, gap });
    const width = controls.left.w;
    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: controls.left.x,
        y,
        w: width,
        h: px(54),
        text: "■ Stop",
        normal: COLORS.danger,
        pressed: COLORS.dangerPressed,
        size: 20,
        click: () => this.complete(),
      }),
    );
    this.state.pauseButton = hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: controls.right.x,
        y,
        w: width,
        h: px(54),
        text: "Ⅱ Pause",
        normal: COLORS.primaryAction,
        pressed: COLORS.panelPressed,
        size: 19,
        click: () => this.togglePause(),
      }),
    );
  },

  update() {
    const nowMs = timeSensor.getTime();
    const stored = getActiveSession();
    if (stored?.id === this.state.session.id) {
      this.state.session = stored;
    }

    let snapshot = getSnapshot(this.state.session, nowMs);
    if (snapshot.phase === "overtime" && !snapshot.isPaused) {
      const extended = extendSession(this.state.session, nowMs);
      if (extended) {
        this.state.session = extended;
        snapshot = getSnapshot(extended, nowMs);
      }
    }

    const accent =
      snapshot.phase === "work"
        ? COLORS.work
        : snapshot.phase === "chase"
          ? COLORS.chase
          : COLORS.danger;
    const autoAdded = Math.max(
      0,
      snapshot.totalUnits - this.state.session.initialUnits,
    );
    const phaseLabel = snapshot.isPaused
      ? `Paused · U${snapshot.currentUnit}`
      : `${snapshot.phaseLabel} · U${snapshot.currentUnit}`;

    this.state.startTimeText.setProperty(
      hmUI.prop.TEXT,
      formatClockFromDate(new Date(this.state.session.startedAt)),
    );
    this.state.currentTimeText.setProperty(
      hmUI.prop.TEXT,
      formatClockFromDate(new Date(nowMs)),
    );
    this.state.endTimeText.setProperty(
      hmUI.prop.TEXT,
      formatClockFromDate(new Date(snapshot.plannedEndAt)),
    );
    this.state.phaseText.setProperty(
      hmUI.prop.TEXT,
      autoAdded > 0 ? `${phaseLabel} · +${autoAdded}` : phaseLabel,
    );
    this.state.countdownText.setProperty(
      hmUI.prop.MORE,
      {
        x: this.state.countdownText.getProperty(hmUI.prop.X),
        y: this.state.countdownText.getProperty(hmUI.prop.Y),
        w: this.state.countdownText.getProperty(hmUI.prop.W),
        h: this.state.countdownText.getProperty(hmUI.prop.H),
        text: formatDuration(snapshot.phaseRemainingSeconds),
        text_size: px(
          snapshot.phaseRemainingSeconds >= 3600
            ? IS_SQUARE
              ? 48
              : 52
            : IS_SQUARE
              ? 68
              : 72,
        ),
        color: snapshot.isPaused ? COLORS.muted : COLORS.white,
      },
    );
    this.state.elapsedText.setProperty(
      hmUI.prop.TEXT,
      `Total ${formatDuration(snapshot.elapsedSeconds)}`,
    );
    this.state.pauseButton.setProperty(
      hmUI.prop.TEXT,
      snapshot.isPaused ? "▶ Resume" : "Ⅱ Pause",
    );

    this.updateOverallSegments(snapshot, accent);
    const endAngle =
      ARC_START + Math.max(1, Math.round(snapshot.phaseProgress * ARC_SWEEP));
    this.state.progressArc.setProperty(hmUI.prop.MORE, {
      x: this.state.progressArc.getProperty(hmUI.prop.X),
      y: this.state.progressArc.getProperty(hmUI.prop.Y),
      w: this.state.progressArc.getProperty(hmUI.prop.W),
      h: this.state.progressArc.getProperty(hmUI.prop.H),
      start_angle: ARC_START,
      end_angle: endAngle,
      line_width: px(7),
      color: snapshot.isPaused ? COLORS.muted : accent,
    });

    if (
      this.state.lastPhase &&
      this.state.lastPhase !== snapshot.phase &&
      !snapshot.isPaused
    ) {
      vibrator.start({ mode: VIBRATOR_SCENE_SHORT_MIDDLE });
    }
    this.state.lastPhase = snapshot.phase;
  },

  updateOverallSegments(snapshot, accent) {
    const barX = SAFE_SIDE;
    const barY = SAFE_TOP + px(IS_SQUARE ? 57 : 54);
    const barWidth = WIDTH - barX * 2;
    const unitSegments = getUnitSegments(
      this.state.session,
      snapshot,
      MAX_VISIBLE_UNITS,
    );
    const visibleCount = unitSegments.length;
    const gap = px(3);
    const segmentWidth = Math.floor(
      (barWidth - gap * (visibleCount - 1)) / visibleCount,
    );
    const completedColor =
      snapshot.phase === "chase" ? COLORS.chasePressed : COLORS.workPressed;

    this.state.overallSegments.forEach((segment, index) => {
      if (index >= visibleCount) {
        const hidden = {
          x: WIDTH + px(4),
          y: barY,
          w: px(1),
          h: px(9),
          color: COLORS.faint,
          radius: px(4),
        };
        segment.track.setProperty(hmUI.prop.MORE, hidden);
        segment.fill.setProperty(hmUI.prop.MORE, hidden);
        return;
      }
      const unitProgress = unitSegments[index].progress;
      const x = barX + index * (segmentWidth + gap);
      segment.track.setProperty(hmUI.prop.MORE, {
        x,
        y: barY,
        w: segmentWidth,
        h: px(9),
        color: COLORS.faint,
        radius: px(4),
      });
      segment.fill.setProperty(hmUI.prop.MORE, {
        x,
        y: barY,
        w: Math.max(px(1), Math.round(segmentWidth * unitProgress)),
        h: px(9),
        color:
          unitProgress <= 0
            ? COLORS.faint
            : unitProgress >= 1
              ? completedColor
              : snapshot.isPaused
                ? COLORS.muted
                : accent,
        radius: px(4),
      });
    });
  },

  togglePause() {
    const nowMs = timeSensor.getTime();
    const next =
      this.state.session.status === "paused"
        ? resumeActiveSession(this.state.session, nowMs)
        : pauseActiveSession(this.state.session, nowMs);
    if (next) {
      this.state.session = next;
      vibrator.start({ mode: VIBRATOR_SCENE_SHORT_MIDDLE });
      this.update();
    }
  },

  complete() {
    finishSession(this.state.session, timeSensor.getTime());
    setWakeUpRelaunch({ relaunch: false });
    replace({ url: "page/complete" });
  },

  onDestroy() {
    if (this.state.updateTimer) clearInterval(this.state.updateTimer);
  },
});
