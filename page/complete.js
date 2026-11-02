import hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { replace } from "@zos/router";
import { px } from "@zos/utils";
import { PRESETS } from "../core/timer-engine";
import { formatDuration } from "../core/format";
import { getLastRecord } from "../services/storage";
import {
  WIDTH, HEIGHT, COLORS, textStyle, buttonStyle, drawBackground, SAFE_SIDE,
} from "../ui/common";

Page({
  state: { record: null },
  onInit() { this.state.record = getLastRecord(); },
  build() {
    const record = this.state.record;
    if (!record || record.reason !== "completed") return replace({ url: "page/home" });
    const label = record.presetLabel || PRESETS[record.presetIndex]?.label ||
      `${Math.round(record.workSeconds / 60)} / ${Math.round(record.breakSeconds / 60)}`;
    const minUnit = getText("min");
    drawBackground();
    hmUI.createWidget(hmUI.widget.TEXT, textStyle({
      y: px(48), h: px(54), text: getText("sessionComplete"), size: 28, color: COLORS.success,
    }));
    hmUI.createWidget(hmUI.widget.TEXT, textStyle({
      y: px(128), h: px(48), text: getText("niceWork"), size: 29,
    }));
    hmUI.createWidget(hmUI.widget.TEXT, textStyle({
      x: SAFE_SIDE, y: px(202), w: WIDTH - SAFE_SIDE * 2, h: px(90),
      text: `${label} ${minUnit}  ·  ${record.rounds} ${getText("rounds")}\n${getText("total")} ${formatDuration(record.totalSeconds)}`,
      size: 21, color: COLORS.muted,
    }));
    hmUI.createWidget(hmUI.widget.BUTTON, buttonStyle({
      x: SAFE_SIDE, y: HEIGHT - px(102), w: WIDTH - SAFE_SIDE * 2, h: px(62),
      text: getText("done"), size: 27, normal: COLORS.success,
      click: () => replace({ url: "page/home" }),
    }));
  },
});
