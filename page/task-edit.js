import hmUI from "@zos/ui";
import { replace } from "@zos/router";
import { showToast } from "@zos/interaction";
import { px } from "@zos/utils";
import {
  normalizeTaskTitle,
  registerTaskPreset,
  removeTaskPreset,
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
    draft: null,
    titleText: null,
    valueTexts: {},
    isExisting: false,
  },

  onInit(id = "") {
    const preferences = getPreferences();
    const existing = preferences.taskPresets.find((item) => item.id === id);
    this.state.preferences = preferences;
    this.state.isExisting = Boolean(existing);
    this.state.draft = existing
      ? { ...existing }
      : {
          id: `task-${Date.now()}`,
          title: `Task ${preferences.taskPresets.length + 1}`,
          workMinutes: preferences.workMinutes,
          chaseMinutes: preferences.chaseMinutes,
          units: preferences.units,
        };
  },

  build() {
    drawBackground();
    hmUI.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        x: SAFE_SIDE,
        y: SAFE_TOP,
        w: WIDTH - SAFE_SIDE * 2,
        h: px(34),
        text: this.state.isExisting ? "Edit preset" : "New preset",
        size: 25,
        align: hmUI.align.LEFT,
      }),
    );
    hmUI.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        x: SAFE_SIDE,
        y: px(IS_SQUARE ? 56 : 70),
        w: px(70),
        h: px(24),
        text: "Title",
        size: 16,
        color: COLORS.muted,
        align: hmUI.align.LEFT,
      }),
    );
    this.state.titleText = hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: SAFE_SIDE,
        y: px(IS_SQUARE ? 80 : 94),
        w: WIDTH - SAFE_SIDE * 2,
        h: px(46),
        text: this.state.draft.title,
        normal: COLORS.secondaryAction,
        pressed: COLORS.workPressed,
        size: 20,
        click: () => this.editTitle(),
      }),
    );

    this.buildAdjuster({
      y: px(IS_SQUARE ? 142 : 158),
      label: "Work",
      key: "workMinutes",
      min: 5,
      max: 60,
    });
    this.buildAdjuster({
      y: px(IS_SQUARE ? 202 : 220),
      label: "Finish",
      key: "chaseMinutes",
      min: 1,
      max: 30,
    });
    this.buildAdjuster({
      y: px(IS_SQUARE ? 262 : 282),
      label: "Units",
      key: "units",
      min: 1,
      max: 12,
    });

    const saveY = HEIGHT - SAFE_BOTTOM - px(this.state.isExisting ? 104 : 52);
    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: SAFE_SIDE,
        y: saveY,
        w: WIDTH - SAFE_SIDE * 2,
        h: px(52),
        text: "Save preset",
        normal: COLORS.work,
        pressed: COLORS.workPressed,
        size: 21,
        click: () => this.save(),
      }),
    );
    if (this.state.isExisting) {
      hmUI.createWidget(
        hmUI.widget.BUTTON,
        buttonStyle({
          x: SAFE_SIDE + px(52),
          y: saveY + px(60),
          w: WIDTH - SAFE_SIDE * 2 - px(104),
          h: px(44),
          text: "Delete",
          normal: COLORS.panel,
          pressed: COLORS.dangerPressed,
          color: COLORS.danger,
          size: 17,
          click: () => this.remove(),
        }),
      );
    }
    this.refresh();
  },

  buildAdjuster({ y, label, key, min, max }) {
    const labelWidth = px(72);
    const side = px(48);
    const gap = px(7);
    const valueWidth = WIDTH - SAFE_SIDE * 2 - labelWidth - side * 2 - gap * 2;
    hmUI.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        x: SAFE_SIDE,
        y,
        w: labelWidth,
        h: px(48),
        text: label,
        size: 17,
        color: COLORS.muted,
        align: hmUI.align.LEFT,
      }),
    );
    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: SAFE_SIDE + labelWidth,
        y,
        w: side,
        h: px(48),
        text: "－",
        size: 24,
        click: () => this.adjust(key, -1, min, max),
      }),
    );
    this.state.valueTexts[key] = hmUI.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        x: SAFE_SIDE + labelWidth + side + gap,
        y,
        w: valueWidth,
        h: px(48),
        text: "",
        size: 22,
      }),
    );
    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: WIDTH - SAFE_SIDE - side,
        y,
        w: side,
        h: px(48),
        text: "＋",
        size: 24,
        click: () => this.adjust(key, 1, min, max),
      }),
    );
  },

  editTitle() {
    if (typeof hmUI.createKeyboard !== "function") {
      showToast({ content: "Title input needs API 4.0" });
      return;
    }
    hmUI.createKeyboard({
      inputType: hmUI.inputType.CHAR,
      text: this.state.draft.title,
      onComplete: (_, result) => {
        this.state.draft.title = normalizeTaskTitle(
          result?.data,
          this.state.draft.title,
        );
        hmUI.deleteKeyboard();
        this.refresh();
      },
      onCancel: () => hmUI.deleteKeyboard(),
    });
  },

  adjust(key, delta, min, max) {
    this.state.draft[key] = Math.min(
      max,
      Math.max(min, this.state.draft[key] + delta),
    );
    this.refresh();
  },

  refresh() {
    this.state.titleText?.setProperty(hmUI.prop.TEXT, this.state.draft.title);
    for (const key of ["workMinutes", "chaseMinutes", "units"]) {
      const widget = this.state.valueTexts[key];
      widget?.setProperty(
        hmUI.prop.TEXT,
        `${this.state.draft[key]}${key === "units" ? "U" : "m"}`,
      );
    }
  },

  save() {
    savePreferences(
      registerTaskPreset(this.state.preferences, this.state.draft),
    );
    replace({ url: "page/tasks" });
  },

  remove() {
    savePreferences(
      removeTaskPreset(this.state.preferences, this.state.draft.id),
    );
    replace({ url: "page/tasks" });
  },
});
