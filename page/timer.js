import hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { showToast } from "@zos/interaction";
import { Time, Vibrator, VIBRATOR_SCENE_SHORT_MIDDLE } from "@zos/sensor";
import { replace } from "@zos/router";
import { setWakeUpRelaunch } from "@zos/display";
import { px } from "@zos/utils";
import { getSnapshot } from "../core/timer-engine";
import { twoButtonLayout } from "../core/layout";
import { formatClockFromDate, formatDuration } from "../core/format";
import { getActiveSession } from "../services/storage";
import {
  finishSession, pauseActiveSession, resumeActiveSession, skipActivePhase,
} from "../services/session-actions";
import {
  WIDTH, HEIGHT, IS_SQUARE, COLORS, textStyle, buttonStyle, drawBackground,
  SAFE_SIDE, SAFE_TOP, SAFE_BOTTOM,
} from "../ui/common";

const timeSensor = new Time();
const vibrator = new Vibrator();
const ARC_START = -225;
const ARC_SWEEP = 270;

Page({
  state: {
    session: null,
    timer: null,
    startTimeText: null,
    currentTimeText: null,
    endTimeText: null,
    roundSegments: [],
    phaseText: null,
    countdownText: null,
    elapsedText: null,
    progressArc: null,
    pauseButton: null,
    skipButton: null,
    lastPhase: null,
  },

  onInit() { this.state.session = getActiveSession(); },

  build() {
    if (!this.state.session) return replace({ url: "page/home" });
    setWakeUpRelaunch({ relaunch: true });
    drawBackground();
    this.buildTimeline();
    this.buildRoundTimer();
    this.buildControls();
    this.update();
    this.state.timer = setInterval(() => this.update(), 1000);
  },

  buildTimeline() {
    const gap = px(6);
    const columnWidth = Math.floor((WIDTH - SAFE_SIDE * 2 - gap * 2) / 3);
    const labels = [
      getText("timelineStart"),
      getText("timelineNow"),
      getText("timelineEnd"),
    ];
    const keys = ["startTimeText", "currentTimeText", "endTimeText"];
    labels.forEach((label, index) => {
      const x = SAFE_SIDE + index * (columnWidth + gap);
      hmUI.createWidget(hmUI.widget.TEXT, textStyle({
        x, y: SAFE_TOP, w: columnWidth, h: px(20),
        text: label, size: 14, color: COLORS.muted,
      }));
      this.state[keys[index]] = hmUI.createWidget(
        hmUI.widget.TEXT,
        textStyle({
          x, y: SAFE_TOP + px(19), w: columnWidth, h: px(31),
          text: "", size: IS_SQUARE ? 22 : 23,
        }),
      );
    });

    const barY = SAFE_TOP + px(57);
    const gapWidth = px(4);
    const segmentWidth = Math.floor(
      (WIDTH - SAFE_SIDE * 2 - gapWidth * 2) / 3,
    );
    this.state.roundSegments = Array.from({ length: 3 }, (_, index) => {
      const x = SAFE_SIDE + index * (segmentWidth + gapWidth);
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x, y: barY, w: segmentWidth, h: px(8),
        color: COLORS.faint, radius: px(4),
      });
      return hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x, y: barY, w: px(1), h: px(8),
        color: COLORS.work, radius: px(4),
      });
    });
  },

  buildRoundTimer() {
    const arcSize = px(IS_SQUARE ? 246 : 250);
    const arcX = Math.round((WIDTH - arcSize) / 2);
    const arcY = px(IS_SQUARE ? 88 : 94);
    hmUI.createWidget(hmUI.widget.ARC, {
      x: arcX, y: arcY, w: arcSize, h: arcSize,
      start_angle: ARC_START, end_angle: ARC_START + ARC_SWEEP,
      line_width: px(7), color: COLORS.faint,
    });
    this.state.progressArc = hmUI.createWidget(hmUI.widget.ARC, {
      x: arcX, y: arcY, w: arcSize, h: arcSize,
      start_angle: ARC_START, end_angle: ARC_START + 1,
      line_width: px(7), color: COLORS.work,
    });
    this.state.phaseText = hmUI.createWidget(hmUI.widget.TEXT, textStyle({
      x: arcX + px(20), y: arcY + px(34), w: arcSize - px(40), h: px(34),
      text: "", size: 20, color: COLORS.muted,
    }));
    this.state.countdownText = hmUI.createWidget(hmUI.widget.TEXT, textStyle({
      x: arcX + px(12), y: arcY + px(74), w: arcSize - px(24), h: px(78),
      text: "", size: IS_SQUARE ? 68 : 72,
    }));
    this.state.elapsedText = hmUI.createWidget(hmUI.widget.TEXT, textStyle({
      x: arcX + px(20), y: arcY + px(152), w: arcSize - px(40), h: px(38),
      text: "", size: 21, color: COLORS.muted,
    }));

    const controlsY = HEIGHT - SAFE_BOTTOM - px(54);
    const skipW = px(136);
    const skipH = px(30);
    const skipY = controlsY - skipH - px(IS_SQUARE ? 8 : 12);
    this.state.skipButton = hmUI.createWidget(hmUI.widget.BUTTON, buttonStyle({
      x: Math.round((WIDTH - skipW) / 2), y: skipY,
      w: skipW, h: skipH, text: getText("skipPhase"), size: 14,
      normal: COLORS.background, pressed: COLORS.panel,
      color: COLORS.muted, click: () => this.skip(),
    }));
  },

  buildControls() {
    const y = HEIGHT - SAFE_BOTTOM - px(54);
    const controls = twoButtonLayout({ width: WIDTH, margin: SAFE_SIDE, gap: px(10) });
    hmUI.createWidget(hmUI.widget.BUTTON, buttonStyle({
      x: controls.left.x, y, w: controls.left.w, h: px(54),
      text: `■ ${getText("stop")}`, size: 19,
      normal: COLORS.danger, pressed: COLORS.dangerPressed,
      click: () => showToast({ content: getText("holdToStopNotice") }),
      longpress: () => this.end(),
    }));
    this.state.pauseButton = hmUI.createWidget(hmUI.widget.BUTTON, buttonStyle({
      x: controls.right.x, y, w: controls.right.w, h: px(54),
      text: `Ⅱ ${getText("pause")}`, size: 19,
      normal: COLORS.primaryAction, pressed: COLORS.panelPressed,
      click: () => this.togglePause(),
    }));
  },

  update() {
    const nowMs = timeSensor.getTime();
    const stored = getActiveSession();
    if (stored?.id === this.state.session.id) this.state.session = stored;
    const snapshot = getSnapshot(this.state.session, nowMs);
    if (snapshot.isCompleted) return this.complete(nowMs);

    const accent = snapshot.phase === "work" ? COLORS.work : COLORS.chase;
    const phaseName = snapshot.phase === "work" ? getText("work") : getText("break");
    const phaseLabel = snapshot.isPaused
      ? `${getText("paused")} · R${snapshot.currentRound}`
      : `${phaseName} · R${snapshot.currentRound}`;
    this.state.startTimeText.setProperty(
      hmUI.prop.TEXT, formatClockFromDate(new Date(this.state.session.startedAt)),
    );
    this.state.currentTimeText.setProperty(
      hmUI.prop.TEXT, formatClockFromDate(new Date(nowMs)),
    );
    this.state.endTimeText.setProperty(
      hmUI.prop.TEXT, formatClockFromDate(new Date(snapshot.plannedEndAt)),
    );
    this.state.phaseText.setProperty(hmUI.prop.TEXT, phaseLabel);
    this.state.countdownText.setProperty(hmUI.prop.TEXT, formatDuration(snapshot.phaseRemainingSeconds));
    this.state.elapsedText.setProperty(hmUI.prop.TEXT, `${getText("total")} ${formatDuration(snapshot.elapsedSeconds)}`);
    this.state.pauseButton.setProperty(
      hmUI.prop.TEXT, snapshot.isPaused ? `▶ ${getText("resume")}` : `Ⅱ ${getText("pause")}`,
    );
    this.state.skipButton.setProperty(
      hmUI.prop.TEXT, snapshot.isPaused ? getText("paused") : getText("skipPhase"),
    );

    const endAngle = ARC_START + Math.max(1, Math.round(snapshot.phaseProgress * ARC_SWEEP));
    this.state.progressArc.setProperty(hmUI.prop.MORE, {
      x: this.state.progressArc.getProperty(hmUI.prop.X),
      y: this.state.progressArc.getProperty(hmUI.prop.Y),
      w: this.state.progressArc.getProperty(hmUI.prop.W),
      h: this.state.progressArc.getProperty(hmUI.prop.H),
      start_angle: ARC_START, end_angle: endAngle, line_width: px(7),
      color: snapshot.isPaused ? COLORS.muted : accent,
    });
    this.updateRoundSegments(snapshot, accent);

    if (this.state.lastPhase && this.state.lastPhase !== snapshot.phase && !snapshot.isPaused) {
      vibrator.start({ mode: VIBRATOR_SCENE_SHORT_MIDDLE });
    }
    this.state.lastPhase = snapshot.phase;
  },

  updateRoundSegments(snapshot, accent) {
    const gap = px(4);
    const segmentWidth = Math.floor((WIDTH - SAFE_SIDE * 2 - gap * 2) / 3);
    const roundSeconds = this.state.session.workSeconds + this.state.session.breakSeconds;
    this.state.roundSegments.forEach((segment, index) => {
      const progress = Math.max(0, Math.min(
        1,
        (snapshot.elapsedSeconds - index * roundSeconds) / roundSeconds,
      ));
      segment.setProperty(hmUI.prop.MORE, {
        x: SAFE_SIDE + index * (segmentWidth + gap),
        y: SAFE_TOP + px(57),
        w: Math.max(px(1), Math.round(segmentWidth * progress)),
        h: px(8),
        color: snapshot.isPaused ? COLORS.muted : accent,
        radius: px(4),
      });
    });
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
