import hmUI from "@zos/ui";
import { Time, Vibrator, VIBRATOR_SCENE_SHORT_MIDDLE } from "@zos/sensor";
import { replace, push } from "@zos/router";
import { px } from "@zos/utils";
import { PRESETS, ROUNDS, normalizePreferences } from "../core/timer-engine";
import { getPreferences, savePreferences, getActiveSession } from "../services/storage";
import { ensureTimerPermissions, startNewSession } from "../services/session-actions";
import {
  WIDTH, HEIGHT, COLORS, textStyle, buttonStyle, drawBackground, SAFE_SIDE,
} from "../ui/common";

const timeSensor = new Time();
const vibrator = new Vibrator();

Page({
  state: { preferences: null, presetText: null, summaryText: null },

  onInit() { this.state.preferences = getPreferences(); },

  build() {
    if (getActiveSession()) return replace({ url: "page/timer" });
    drawBackground();
    hmUI.createWidget(hmUI.widget.TEXT, textStyle({
      y: px(22), h: px(38), text: "PACE PILOT", size: 25, color: COLORS.muted,
    }));
    hmUI.createWidget(hmUI.widget.TEXT, textStyle({
      y: px(66), h: px(34), text: "Choose your pace", size: 20,
    }));

    const y = px(116);
    hmUI.createWidget(hmUI.widget.BUTTON, buttonStyle({
      x: SAFE_SIDE, y, w: px(58), h: px(58), text: "‹", size: 34,
      click: () => this.changePreset(-1),
    }));
    this.state.presetText = hmUI.createWidget(hmUI.widget.TEXT, textStyle({
      x: SAFE_SIDE + px(68), y, w: WIDTH - SAFE_SIDE * 2 - px(136), h: px(58),
      text: "", size: 32,
    }));
    hmUI.createWidget(hmUI.widget.BUTTON, buttonStyle({
      x: WIDTH - SAFE_SIDE - px(58), y, w: px(58), h: px(58), text: "›", size: 34,
      click: () => this.changePreset(1),
    }));

    this.state.summaryText = hmUI.createWidget(hmUI.widget.TEXT, textStyle({
      x: SAFE_SIDE, y: px(196), w: WIDTH - SAFE_SIDE * 2, h: px(94), text: "",
      size: 21, color: COLORS.muted,
    }));
    hmUI.createWidget(hmUI.widget.BUTTON, buttonStyle({
      x: SAFE_SIDE + px(54), y: px(294),
      w: WIDTH - SAFE_SIDE * 2 - px(108), h: px(42),
      text: "History  ›", size: 18,
      click: () => push({ url: "page/history" }),
    }));
    hmUI.createWidget(hmUI.widget.BUTTON, buttonStyle({
      x: SAFE_SIDE, y: HEIGHT - px(98), w: WIDTH - SAFE_SIDE * 2, h: px(64),
      text: "Start", size: 29, normal: COLORS.work, pressed: COLORS.workPressed,
      click: () => this.start(),
    }));
    this.refresh();
  },

  changePreset(delta) {
    const current = normalizePreferences(this.state.preferences).presetIndex;
    const presetIndex = (current + delta + PRESETS.length) % PRESETS.length;
    this.state.preferences = { presetIndex };
    savePreferences(this.state.preferences);
    this.refresh();
  },

  refresh() {
    const { presetIndex } = normalizePreferences(this.state.preferences);
    const preset = PRESETS[presetIndex];
    const total = (preset.workMinutes + preset.breakMinutes) * ROUNDS;
    this.state.presetText?.setProperty(hmUI.prop.TEXT, preset.label);
    this.state.summaryText?.setProperty(
      hmUI.prop.TEXT,
      `Work  ${preset.workMinutes} min     Break  ${preset.breakMinutes} min\n` +
      `Rounds  ${ROUNDS}             Total  ${total} min`,
    );
  },

  start() {
    const { presetIndex } = normalizePreferences(this.state.preferences);
    ensureTimerPermissions(() => {
      if (startNewSession({ nowMs: timeSensor.getTime(), presetIndex })) {
        vibrator.start({ mode: VIBRATOR_SCENE_SHORT_MIDDLE });
        replace({ url: "page/timer" });
      }
    });
  },
});
