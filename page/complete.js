import hmUI from "@zos/ui";
import { Time } from "@zos/sensor";
import { replace } from "@zos/router";
import { px } from "@zos/utils";
import {
  formatDuration,
  formatSignedDuration,
  formatMinutes,
} from "../core/format";
import {
  getLastRecord,
  getPreferences,
  savePreferences,
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
} from "../ui/common";

const timeSensor = new Time();

Page({
  state: {
    record: null,
  },

  onInit() {
    this.state.record = getLastRecord();
  },

  build() {
    if (!this.state.record) {
      replace({ url: "page/home" });
      return;
    }
    const record = this.state.record;
    drawBackground();
    hmUI.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        y: px(IS_SQUARE ? 24 : 42),
        h: px(56),
        text: "Done",
        size: 38,
        color: COLORS.success,
      }),
    );
    hmUI.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        x: px(IS_SQUARE ? 34 : 92),
        y: px(IS_SQUARE ? 98 : 116),
        w: WIDTH - px(IS_SQUARE ? 68 : 184),
        h: px(190),
        text:
          `Initial    ${formatMinutes(record.initialPlannedSeconds)}\n` +
          `Actual     ${formatDuration(record.actualSeconds)}\n` +
          `Diff       ${formatSignedDuration(record.varianceFromInitialSeconds)}\n` +
          `Auto add   ${record.addedUnits}\n` +
          `On time    ${record.completedWithinInitialPlan ? "Yes" : "No"}`,
        size: 23,
        align: hmUI.align.LEFT,
      }),
    );

    const y = HEIGHT - px(IS_SQUARE ? 84 : 96);
    const margin = px(IS_SQUARE ? 26 : 76);
    const gap = px(10);
    const width = Math.floor((WIDTH - margin * 2 - gap) / 2);
    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: margin,
        y,
        w: width,
        h: px(54),
        text: "Close",
        size: 22,
        click: () => replace({ url: "page/home" }),
      }),
    );
    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: margin + width + gap,
        y,
        w: width,
        h: px(54),
        text: "Again",
        normal: COLORS.work,
        pressed: COLORS.workPressed,
        size: 22,
        click: () => this.restart(),
      }),
    );
  },

  restart() {
    const record = this.state.record;
    const preferences = {
      ...getPreferences(),
      presetIndex: 4,
      savedPresetKey: null,
      selectedTaskPresetId: record.taskPresetId ?? null,
      taskTitle: record.taskTitle ?? "Untitled",
      workMinutes: record.workSeconds / 60,
      chaseMinutes: record.chaseSeconds / 60,
      units: record.initialUnits,
    };
    savePreferences(preferences);
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
