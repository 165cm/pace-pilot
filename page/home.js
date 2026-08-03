import hmUI from "@zos/ui";
import { Time } from "@zos/sensor";
import { replace, push } from "@zos/router";
import { px } from "@zos/utils";
import { threePartControlLayout } from "../core/layout";
import {
  getPresetOptions,
  normalizePreferences,
} from "../core/timer-engine";
import { formatClockFromDate } from "../core/format";
import {
  getPreferences,
  savePreferences,
  getActiveSession,
} from "../services/storage";
import {
  ensureTimerPermissions,
  startNewSession,
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
} from "../ui/common";

const timeSensor = new Time();

Page({
  state: {
    preferences: null,
    taskText: null,
    presetText: null,
    unitText: null,
    summaryText: null,
    presetOptions: [],
    presetOptionIndex: 0,
  },

  onInit() {
    this.state.preferences = getPreferences();
  },

  build() {
    const active = getActiveSession();
    if (active) {
      replace({ url: "page/timer" });
      return;
    }

    drawBackground();
    hmUI.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        x: SAFE_SIDE,
        y: px(IS_SQUARE ? 18 : 34),
        w: px(70),
        h: px(24),
        text: "Task",
        size: 17,
        color: COLORS.muted,
        align: hmUI.align.LEFT,
      }),
    );
    this.state.taskText = hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: SAFE_SIDE,
        y: px(IS_SQUARE ? 44 : 60),
        w: WIDTH - SAFE_SIDE * 2,
        h: px(42),
        text: "",
        size: 19,
        click: () => push({ url: "page/tasks" }),
      }),
    );
    hmUI.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        y: px(IS_SQUARE ? 92 : 110),
        h: px(24),
        text: "Interval",
        size: 17,
        color: COLORS.muted,
      }),
    );

    const side = px(IS_SQUARE ? 54 : 60);
    const controls = threePartControlLayout({
      width: WIDTH,
      margin: SAFE_SIDE,
      sideWidth: px(IS_SQUARE ? 54 : 60),
      gap: px(10),
    });
    const centerWidth = controls.center.w;
    const leftX = controls.left.x;
    const presetY = px(IS_SQUARE ? 118 : 136);
    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: leftX,
        y: presetY,
        w: side,
        h: px(48),
        text: "‹",
        size: 34,
        click: () => this.changePreset(-1),
      }),
    );
    this.state.presetText = hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: controls.center.x,
        y: presetY,
        w: centerWidth,
        h: px(48),
        text: "",
        normal: COLORS.work,
        pressed: COLORS.workPressed,
        size: 23,
        click: () => this.openCustomIfSelected(),
      }),
    );
    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: controls.right.x,
        y: presetY,
        w: side,
        h: px(48),
        text: "›",
        size: 34,
        click: () => this.changePreset(1),
      }),
    );

    hmUI.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        y: px(IS_SQUARE ? 174 : 192),
        h: px(24),
        text: "Units",
        size: 17,
        color: COLORS.muted,
      }),
    );

    const unitY = px(IS_SQUARE ? 200 : 218);
    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: leftX,
        y: unitY,
        w: side,
        h: px(46),
        text: "－",
        size: 28,
        click: () => this.changeUnits(-1),
      }),
    );
    this.state.unitText = hmUI.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        x: controls.center.x,
        y: unitY,
        w: centerWidth,
        h: px(46),
        text: "",
        size: 26,
      }),
    );
    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: controls.right.x,
        y: unitY,
        w: side,
        h: px(46),
        text: "＋",
        size: 28,
        click: () => this.changeUnits(1),
      }),
    );

    this.state.summaryText = hmUI.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        x: SAFE_SIDE,
        y: px(IS_SQUARE ? 252 : 270),
        w: WIDTH - SAFE_SIDE * 2,
        h: px(48),
        text: "",
        size: 17,
        color: COLORS.muted,
      }),
    );

    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: SAFE_SIDE,
        y: HEIGHT - px(IS_SQUARE ? 146 : 156),
        w: WIDTH - SAFE_SIDE * 2,
        h: px(58),
        text: "Start",
        normal: COLORS.work,
        pressed: COLORS.workPressed,
        size: 28,
        click: () => this.start(),
      }),
    );

    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: SAFE_SIDE + px(IS_SQUARE ? 34 : 34),
        y: HEIGHT - px(IS_SQUARE ? 76 : 84),
        w: WIDTH - SAFE_SIDE * 2 - px(IS_SQUARE ? 68 : 68),
        h: px(44),
        text: "History",
        size: 18,
        click: () => push({ url: "page/history" }),
      }),
    );

    this.refresh();
  },

  refresh() {
    const preferences = normalizePreferences(this.state.preferences);
    this.state.preferences = preferences;
    const options = getPresetOptions(preferences);
    const selectedKey = preferences.savedPresetKey
      ? `saved:${preferences.savedPresetKey}`
      : preferences.presetIndex === 4
        ? "custom"
        : `builtin:${preferences.presetIndex}`;
    const optionIndex = Math.max(
      0,
      options.findIndex((option) => option.key === selectedKey),
    );
    const preset = options[optionIndex];
    this.state.presetOptions = options;
    this.state.presetOptionIndex = optionIndex;
    const label = preset.workMinutes === null
      ? `${preferences.workMinutes}＋${preferences.chaseMinutes}`
      : preset.label;
    const unitMinutes = preferences.workMinutes + preferences.chaseMinutes;
    const totalMinutes = unitMinutes * preferences.units;
    const end = new Date(timeSensor.getTime() + totalMinutes * 60 * 1000);

    this.state.taskText?.setProperty(
      hmUI.prop.TEXT,
      `${preferences.taskTitle}  ›`,
    );

    this.state.presetText?.setProperty(
      hmUI.prop.TEXT,
      preset.key === "custom" ? `${label}  Set` : label,
    );
    this.state.unitText?.setProperty(
      hmUI.prop.TEXT,
      `${preferences.units} ${preferences.units === 1 ? "unit" : "units"}`,
    );
    this.state.summaryText?.setProperty(
      hmUI.prop.TEXT,
      `Total ${totalMinutes} min · End ${formatClockFromDate(end)}\nWork ${preferences.workMinutes * preferences.units} min + Finish ${preferences.chaseMinutes * preferences.units} min`,
    );
    savePreferences(preferences);
  },

  changePreset(delta) {
    const options = this.state.presetOptions.length
      ? this.state.presetOptions
      : getPresetOptions(this.state.preferences);
    const next =
      (this.state.presetOptionIndex + delta + options.length) % options.length;
    const preset = options[next];
    this.state.preferences = {
      ...this.state.preferences,
      selectedTaskPresetId: null,
      presetIndex: preset.presetIndex ?? 4,
      savedPresetKey: preset.savedPresetKey ?? null,
      workMinutes: preset.workMinutes ?? this.state.preferences.workMinutes,
      chaseMinutes:
        preset.chaseMinutes ?? this.state.preferences.chaseMinutes,
    };
    this.refresh();
  },

  openCustomIfSelected() {
    if (this.state.presetOptions[this.state.presetOptionIndex]?.key === "custom") {
      push({ url: "page/custom" });
    }
  },

  changeUnits(delta) {
    this.state.preferences = {
      ...this.state.preferences,
      selectedTaskPresetId: null,
      units: Math.min(
        12,
        Math.max(1, this.state.preferences.units + delta),
      ),
    };
    this.refresh();
  },

  start() {
    const preferences = this.state.preferences;
    ensureTimerPermissions(() => {
      const session = startNewSession({
        nowMs: timeSensor.getTime(),
        workMinutes: preferences.workMinutes,
        chaseMinutes: preferences.chaseMinutes,
        units: preferences.units,
        taskTitle: preferences.taskTitle,
        taskPresetId: preferences.selectedTaskPresetId,
      });
      if (session) {
        replace({ url: "page/timer" });
      }
    });
  },
});
