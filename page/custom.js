import hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { replace, back } from "@zos/router";
import { px } from "@zos/utils";
import {
  DEFAULT_PRESETS,
  DEFAULT_CUSTOM_PRESET,
  normalizeCustomPreset,
  clamp,
} from "../core/timer-engine";
import { getPreferences, savePreferences } from "../services/storage";
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

Page({
  state: {
    preferences: null,
    workMinutes: 25,
    breakMinutes: 5,
    rounds: 3,
    workText: null,
    breakText: null,
    roundsText: null,
  },

  onInit() {
    this.state.preferences = getPreferences();
    const custom = normalizeCustomPreset(this.state.preferences?.customPreset);
    this.state.workMinutes = custom.workMinutes;
    this.state.breakMinutes = custom.breakMinutes;
    this.state.rounds = custom.rounds;
  },

  build() {
    drawBackground();

    const container = hmUI.createWidget(hmUI.widget.VIEW_CONTAINER, {
      x: 0, y: 0, w: WIDTH, h: HEIGHT, scroll_enable: 1, bounce: 1,
    });

    let y = SAFE_TOP;
    container.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        x: SAFE_SIDE,
        y,
        w: WIDTH - SAFE_SIDE * 2,
        h: px(36),
        text: getText("customPace"),
        size: 24,
        align: hmUI.align.CENTER_H,
      }),
    );
    y += px(42);

    y = this.buildAdjuster(container, {
      y,
      label: getText("work"),
      key: "workMinutes",
      step: 5,
      min: 5,
      max: 90,
    });

    y = this.buildAdjuster(container, {
      y,
      label: getText("break"),
      key: "breakMinutes",
      step: 1,
      min: 1,
      max: 30,
    });

    y = this.buildAdjuster(container, {
      y,
      label: getText("rounds"),
      key: "rounds",
      step: 1,
      min: 1,
      max: 12,
    });

    y += px(6);
    container.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: px(IS_SQUARE ? 36 : 86),
        y,
        w: WIDTH - px(IS_SQUARE ? 72 : 172),
        h: px(48),
        text: getText("saveAndUse"),
        normal: COLORS.work,
        pressed: COLORS.workPressed,
        size: 19,
        click: () => this.save(),
      }),
    );
    y += px(56);

    container.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: px(IS_SQUARE ? 64 : 112),
        y,
        w: WIDTH - px(IS_SQUARE ? 128 : 224),
        h: px(40),
        text: getText("cancel"),
        size: 17,
        click: () => back(),
      }),
    );
    y += px(SAFE_BOTTOM + 20);

    this.refresh();
  },

  buildAdjuster(container, { y, label, key, step, min, max }) {
    container.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        y,
        h: px(26),
        text: label,
        size: 17,
        color: COLORS.muted,
      }),
    );
    const controlY = y + px(28);
    const side = px(54);
    const left = px(IS_SQUARE ? 34 : 80);
    const centerWidth = WIDTH - left * 2 - side * 2 - px(16);

    container.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: left,
        y: controlY,
        w: side,
        h: px(48),
        text: "－",
        size: 26,
        click: () => this.adjust(key, -step, min, max),
      }),
    );
    this.state[`${key === "workMinutes" ? "work" : key === "breakMinutes" ? "break" : "rounds"}Text`] =
      container.createWidget(
        hmUI.widget.TEXT,
        textStyle({
          x: left + side + px(8),
          y: controlY,
          w: centerWidth,
          h: px(48),
          text: "",
          size: 27,
        }),
      );
    container.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: left + side + centerWidth + px(16),
        y: controlY,
        w: side,
        h: px(48),
        text: "＋",
        size: 26,
        click: () => this.adjust(key, step, min, max),
      }),
    );
    return controlY + px(56);
  },

  adjust(key, delta, min, max) {
    this.state[key] = clamp(this.state[key] + delta, min, max);
    this.refresh();
  },

  refresh() {
    const minUnit = getText("min");
    this.state.workText?.setProperty(
      hmUI.prop.TEXT,
      `${this.state.workMinutes} ${minUnit}`,
    );
    this.state.breakText?.setProperty(
      hmUI.prop.TEXT,
      `${this.state.breakMinutes} ${minUnit}`,
    );
    this.state.roundsText?.setProperty(
      hmUI.prop.TEXT,
      `${this.state.rounds} ${getText("rounds")}`,
    );
  },

  save() {
    const customPreset = normalizeCustomPreset({
      workMinutes: this.state.workMinutes,
      breakMinutes: this.state.breakMinutes,
      rounds: this.state.rounds,
    });
    const presetIndex = DEFAULT_PRESETS.length;
    savePreferences({
      ...this.state.preferences,
      presetIndex,
      customPreset,
    });
    replace({ url: "page/home" });
  },
});
