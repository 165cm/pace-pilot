import hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { formatDuration } from "../core/format";
import { historyStartTime } from "../core/history";
import { PRESETS } from "../core/timer-engine";
import { WIDTH, COLORS, textStyle, SAFE_SIDE } from "./common";

export const HISTORY_CARD_HEIGHT = px(106);

function recordPreset(record) {
  if (record.presetLabel) return `${record.presetLabel} min`;
  const preset = PRESETS[record.presetIndex];
  if (preset) return `${preset.label} min`;
  const work = Math.round((record.workSeconds || 0) / 60);
  const rest = Math.round((record.breakSeconds || record.chaseSeconds || 0) / 60);
  return `${work} / ${rest} min`;
}

export function createHistoryCard(container, record, y) {
  const x = SAFE_SIDE;
  const w = WIDTH - SAFE_SIDE * 2;
  const innerX = x + px(14);
  const innerW = w - px(28);
  const completed = record.reason !== "ended";
  const duration = record.actualSeconds ?? record.totalSeconds ?? 0;
  const rounds = record.rounds ?? record.initialUnits ?? 3;

  container.createWidget(hmUI.widget.FILL_RECT, {
    x, y, w, h: HISTORY_CARD_HEIGHT - px(8),
    radius: px(12), color: COLORS.panel,
  });
  container.createWidget(hmUI.widget.TEXT, textStyle({
    x: innerX, y: y + px(8), w: innerW - px(82), h: px(28),
    text: recordPreset(record), size: 20, align: hmUI.align.LEFT,
  }));
  container.createWidget(hmUI.widget.TEXT, textStyle({
    x: x + w - px(90), y: y + px(8), w: px(76), h: px(28),
    text: historyStartTime(record.startedAt), size: 17,
    color: COLORS.muted, align: hmUI.align.RIGHT,
  }));
  container.createWidget(hmUI.widget.FILL_RECT, {
    x: innerX, y: y + px(39), w: innerW, h: px(1), color: COLORS.faint,
  });
  container.createWidget(hmUI.widget.TEXT, textStyle({
    x: innerX, y: y + px(48), w: Math.floor(innerW * 0.58), h: px(34),
    text: `${formatDuration(duration)} · ${rounds} rounds`,
    size: 17, color: COLORS.muted, align: hmUI.align.LEFT,
  }));
  container.createWidget(hmUI.widget.TEXT, textStyle({
    x: innerX + Math.floor(innerW * 0.58), y: y + px(48),
    w: Math.ceil(innerW * 0.42), h: px(34),
    text: completed ? "Complete" : "Ended",
    size: 16, color: completed ? COLORS.success : COLORS.danger,
    align: hmUI.align.RIGHT,
  }));
  return y + HISTORY_CARD_HEIGHT;
}
