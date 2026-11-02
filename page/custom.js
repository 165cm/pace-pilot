import hmUI from "@zos/ui";
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
  createPageTitle,
  drawBackground,
  SAFE_BOTTOM,
} from "../ui/common";

Page({
  state: {
    preferences: null,
    workMinutes: 25,
    breakMinutes: 5,
    workText: null,
    breakText: null,
  },

  onInit() {
    this.state.preferences = getPreferences();
    const custom = normalizeCustomPreset(this.state.preferences?.customPreset);
    this.state.workMinutes = custom.workMinutes;
    this.state.breakMinutes = custom.breakMinutes;
  },

  build() {
    drawBackground();
    createPageTitle("Custom Pace");

    this.buildAdjuster({
      y: px(IS_SQUARE ? 80 : 96),
      label: "Work",
      key: "workMinutes",
      step: 5,
      min: 5,
      max: 90,
    });

    this.buildAdjuster({
      y: px(IS_SQUARE ? 186 : 206),
      label: "Break",
      key: "breakMinutes",
      step: 1,
      min: 1,
      max: 30,
    });

    const secondaryY = HEIGHT - SAFE_BOTTOM - px(44);
    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: px(IS_SQUARE ? 36 : 86),
        y: secondaryY - px(58),
        w: WIDTH - px(IS_SQUARE ? 72 : 172),
        h: px(50),
        text: "Save & Use",
        normal: COLORS.work,
        pressed: COLORS.workPressed,
        size: 20,
        click: () => this.save(),
      }),
    );
    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: px(IS_SQUARE ? 64 : 112),
        y: secondaryY,
        w: WIDTH - px(IS_SQUARE ? 128 : 224),
        h: px(40),
        text: "Cancel",
        size: 18,
        click: () => back(),
      }),
    );
    this.refresh();
  },

  buildAdjuster({ y, label, key, step, min, max }) {
    hmUI.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        y,
        h: px(28),
        text: label,
        size: 18,
        color: COLORS.muted,
      }),
    );
    const controlY = y + px(34);
    const side = px(56);
    const left = px(IS_SQUARE ? 34 : 80);
    const centerWidth = WIDTH - left * 2 - side * 2 - px(20);

    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: left,
        y: controlY,
        w: side,
        h: px(52),
        text: "－",
        size: 28,
        click: () => this.adjust(key, -step, min, max),
      }),
    );
    this.state[`${key === "workMinutes" ? "work" : "break"}Text`] =
      hmUI.createWidget(
        hmUI.widget.TEXT,
        textStyle({
          x: left + side + px(10),
          y: controlY,
          w: centerWidth,
          h: px(52),
          text: "",
          size: 30,
        }),
      );
    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: left + side + centerWidth + px(20),
        y: controlY,
        w: side,
        h: px(52),
        text: "＋",
        size: 28,
        click: () => this.adjust(key, step, min, max),
      }),
    );
  },

  adjust(key, delta, min, max) {
    this.state[key] = clamp(this.state[key] + delta, min, max);
    this.refresh();
  },

  refresh() {
    this.state.workText?.setProperty(
      hmUI.prop.TEXT,
      `${this.state.workMinutes} min`,
    );
    this.state.breakText?.setProperty(
      hmUI.prop.TEXT,
      `${this.state.breakMinutes} min`,
    );
  },

  save() {
    const customPreset = normalizeCustomPreset({
      workMinutes: this.state.workMinutes,
      breakMinutes: this.state.breakMinutes,
    });
    const presetIndex = DEFAULT_PRESETS.length; // カスタムスロット（最後のインデックス）
    savePreferences({
      ...this.state.preferences,
      presetIndex,
      customPreset,
    });
    replace({ url: "page/home" });
  },
});
