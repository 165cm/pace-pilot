import hmUI from "@zos/ui";
import { back } from "@zos/router";
import { px } from "@zos/utils";
import { getPreferences, savePreferences } from "../services/storage";
import { registerCurrentPreset } from "../core/timer-engine";
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
    workText: null,
    chaseText: null,
  },

  onInit() {
    this.state.preferences = {
      ...getPreferences(),
      presetIndex: 4,
      savedPresetKey: null,
      selectedTaskPresetId: null,
    };
  },

  build() {
    drawBackground();
    createPageTitle("Custom");
    this.buildAdjuster({
      y: px(IS_SQUARE ? 86 : 106),
      label: "Work",
      key: "workMinutes",
      min: 5,
      max: 60,
    });
    this.buildAdjuster({
      y: px(IS_SQUARE ? 196 : 220),
      label: "Finish",
      key: "chaseMinutes",
      min: 1,
      max: 30,
    });

    const secondaryY = HEIGHT - SAFE_BOTTOM - px(44);
    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: px(IS_SQUARE ? 36 : 86),
        y: secondaryY - px(62),
        w: WIDTH - px(IS_SQUARE ? 72 : 172),
        h: px(52),
        text: "Save as preset",
        normal: COLORS.work,
        pressed: COLORS.workPressed,
        size: 21,
        click: () => this.save(true),
      }),
    );
    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: px(IS_SQUARE ? 64 : 112),
        y: secondaryY,
        w: WIDTH - px(IS_SQUARE ? 128 : 224),
        h: px(44),
        text: "Use once",
        size: 19,
        click: () => this.save(false),
      }),
    );
    this.refresh();
  },

  buildAdjuster({ y, label, key, min, max }) {
    hmUI.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        y,
        h: px(30),
        text: label,
        size: 20,
        color: COLORS.muted,
      }),
    );
    const controlY = y + px(38);
    const side = px(58);
    const left = px(IS_SQUARE ? 34 : 80);
    const centerWidth = WIDTH - left * 2 - side * 2 - px(20);

    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: left,
        y: controlY,
        w: side,
        h: px(56),
        text: "－",
        size: 30,
        click: () => this.adjust(key, -1, min, max),
      }),
    );
    this.state[`${key === "workMinutes" ? "work" : "chase"}Text`] =
      hmUI.createWidget(
        hmUI.widget.TEXT,
        textStyle({
          x: left + side + px(10),
          y: controlY,
          w: centerWidth,
          h: px(56),
          text: "",
          size: 32,
        }),
      );
    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: left + side + centerWidth + px(20),
        y: controlY,
        w: side,
        h: px(56),
        text: "＋",
        size: 30,
        click: () => this.adjust(key, 1, min, max),
      }),
    );
  },

  adjust(key, delta, min, max) {
    this.state.preferences[key] = Math.min(
      max,
      Math.max(min, this.state.preferences[key] + delta),
    );
    this.refresh();
  },

  refresh() {
    this.state.workText?.setProperty(
      hmUI.prop.TEXT,
      `${this.state.preferences.workMinutes} min`,
    );
    this.state.chaseText?.setProperty(
      hmUI.prop.TEXT,
      `${this.state.preferences.chaseMinutes} min`,
    );
  },

  save(register) {
    const preferences = register
      ? registerCurrentPreset(this.state.preferences)
      : this.state.preferences;
    savePreferences(preferences);
    back();
  },
});
