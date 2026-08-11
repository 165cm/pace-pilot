import hmUI from "@zos/ui";
import { back, push } from "@zos/router";
import { px } from "@zos/utils";
import { applyTaskPreset } from "../core/timer-engine";
import { getPreferences, savePreferences } from "../services/storage";
import {
  WIDTH,
  HEIGHT,
  COLORS,
  textStyle,
  buttonStyle,
  drawBackground,
  SAFE_SIDE,
  SAFE_TOP,
} from "../ui/common";

Page({
  state: { preferences: null },

  onInit() {
    this.state.preferences = getPreferences();
  },

  build() {
    drawBackground();
    const container = hmUI.createWidget(hmUI.widget.VIEW_CONTAINER, {
      x: 0,
      y: 0,
      w: WIDTH,
      h: HEIGHT,
      scroll_enable: 1,
      bounce: 1,
    });
    let y = SAFE_TOP;
    container.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        x: SAFE_SIDE,
        y,
        w: WIDTH - SAFE_SIDE * 2,
        h: px(38),
        text: "Task presets",
        size: 27,
        align: hmUI.align.LEFT,
      }),
    );
    y += px(48);

    if (!this.state.preferences.taskPresets.length) {
      container.createWidget(
        hmUI.widget.TEXT,
        textStyle({
          x: SAFE_SIDE,
          y,
          w: WIDTH - SAFE_SIDE * 2,
          h: px(58),
          text: "Save a task with its\ninterval and units",
          size: 18,
          color: COLORS.muted,
        }),
      );
      y += px(70);
    }

    for (const preset of this.state.preferences.taskPresets) {
      const selected =
        preset.id === this.state.preferences.selectedTaskPresetId;
      const editWidth = px(64);
      const gap = px(8);
      const rowWidth = WIDTH - SAFE_SIDE * 2;
      container.createWidget(
        hmUI.widget.BUTTON,
        buttonStyle({
          x: SAFE_SIDE,
          y,
          w: rowWidth - editWidth - gap,
          h: px(54),
          text: `${selected ? "✓ " : ""}${preset.title}  ${preset.workMinutes}+${preset.chaseMinutes} × ${preset.units}U`,
          normal: selected ? COLORS.secondaryAction : COLORS.panel,
          pressed: COLORS.panelPressed,
          size: 16,
          click: () => this.select(preset.id),
        }),
      );
      container.createWidget(
        hmUI.widget.BUTTON,
        buttonStyle({
          x: SAFE_SIDE + rowWidth - editWidth,
          y,
          w: editWidth,
          h: px(54),
          text: "Edit",
          size: 15,
          click: () =>
            push({ url: "page/task-edit", params: preset.id }),
        }),
      );
      y += px(62);
    }

    if (this.state.preferences.taskPresets.length < 6) {
      y += px(6);
      container.createWidget(
        hmUI.widget.BUTTON,
        buttonStyle({
          x: SAFE_SIDE,
          y,
          w: WIDTH - SAFE_SIDE * 2,
          h: px(52),
          text: "+ New preset",
          normal: COLORS.work,
          pressed: COLORS.workPressed,
          size: 20,
          click: () => push({ url: "page/task-edit" }),
        }),
      );
      y += px(62);
    }

    y += px(8);
    container.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: SAFE_SIDE + px(32),
        y,
        w: WIDTH - SAFE_SIDE * 2 - px(64),
        h: px(46),
        text: "Back",
        size: 19,
        click: () => back(),
      }),
    );
  },

  select(id) {
    savePreferences(applyTaskPreset(this.state.preferences, id));
    back();
  },
});
