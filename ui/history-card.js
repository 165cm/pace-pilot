import hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { formatDuration, formatSignedDuration } from "../core/format";
import { historyStartTime } from "../core/history";
import {
  WIDTH,
  COLORS,
  textStyle,
  SAFE_SIDE,
} from "./common";

export const HISTORY_CARD_HEIGHT = px(116);

export function createHistoryCard(container, record, y) {
  const x = SAFE_SIDE;
  const w = WIDTH - SAFE_SIDE * 2;
  const innerX = x + px(12);
  const innerW = w - px(24);
  const columnW = Math.floor(innerW / 3);
  const title = record.taskTitle || "Untitled";
  const status = record.completedWithinInitialPlan ? "On time" : "Over plan";
  const autoAdd = record.addedUnits > 0 ? ` · +${record.addedUnits}U` : "";

  container.createWidget(hmUI.widget.FILL_RECT, {
    x,
    y,
    w,
    h: HISTORY_CARD_HEIGHT - px(8),
    radius: px(12),
    color: COLORS.panel,
  });
  container.createWidget(
    hmUI.widget.TEXT,
    textStyle({
      x: innerX,
      y: y + px(5),
      w: innerW - px(70),
      h: px(27),
      text: title,
      size: 18,
      align: hmUI.align.LEFT,
    }),
  );
  container.createWidget(
    hmUI.widget.TEXT,
    textStyle({
      x: x + w - px(78),
      y: y + px(5),
      w: px(66),
      h: px(27),
      text: historyStartTime(record.startedAt),
      size: 16,
      color: COLORS.muted,
      align: hmUI.align.RIGHT,
    }),
  );
  container.createWidget(hmUI.widget.FILL_RECT, {
    x: innerX,
    y: y + px(34),
    w: innerW,
    h: px(1),
    color: COLORS.faint,
  });

  const labels = ["PLAN", "ACTUAL", "DIFF"];
  const values = [
    formatDuration(record.initialPlannedSeconds),
    formatDuration(record.actualSeconds),
    formatSignedDuration(record.varianceFromInitialSeconds),
  ];
  labels.forEach((label, index) => {
    const columnX = innerX + columnW * index;
    container.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        x: columnX,
        y: y + px(39),
        w: columnW,
        h: px(17),
        text: label,
        size: 11,
        color: COLORS.muted,
      }),
    );
    container.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        x: columnX,
        y: y + px(56),
        w: columnW,
        h: px(25),
        text: values[index],
        size: 15,
        color:
          index === 2
            ? record.completedWithinInitialPlan
              ? COLORS.success
              : COLORS.danger
            : COLORS.white,
      }),
    );
  });

  container.createWidget(
    hmUI.widget.TEXT,
    textStyle({
      x: innerX,
      y: y + px(83),
      w: Math.floor(innerW * 0.52),
      h: px(20),
      text: `${Math.round(record.workSeconds / 60)}+${Math.round(record.chaseSeconds / 60)} × ${record.initialUnits}U`,
      size: 13,
      color: COLORS.muted,
      align: hmUI.align.LEFT,
    }),
  );
  container.createWidget(
    hmUI.widget.TEXT,
    textStyle({
      x: innerX + Math.floor(innerW * 0.48),
      y: y + px(83),
      w: Math.ceil(innerW * 0.52),
      h: px(20),
      text: `${status}${autoAdd}`,
      size: 13,
      color: record.completedWithinInitialPlan
        ? COLORS.success
        : COLORS.danger,
      align: hmUI.align.RIGHT,
    }),
  );

  return y + HISTORY_CARD_HEIGHT;
}
