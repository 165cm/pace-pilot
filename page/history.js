import hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { back, push } from "@zos/router";
import { px } from "@zos/utils";
import { formatDuration } from "../core/format";
import { groupHistoryByDate } from "../core/history";
import { getHistory } from "../services/storage";
import { createHistoryCard } from "../ui/history-card";
import {
  WIDTH, HEIGHT, COLORS, textStyle, buttonStyle, drawBackground,
  SAFE_SIDE, SAFE_TOP,
} from "../ui/common";

Page({
  state: { groups: [], history: [] },

  onInit() {
    this.state.history = getHistory();
    this.state.groups = groupHistoryByDate(this.state.history);
  },

  build() {
    drawBackground();
    const container = hmUI.createWidget(hmUI.widget.VIEW_CONTAINER, {
      x: 0, y: 0, w: WIDTH, h: HEIGHT, scroll_enable: 1, bounce: 1,
    });
    let y = SAFE_TOP;
    container.createWidget(hmUI.widget.TEXT, textStyle({
      x: SAFE_SIDE, y, w: WIDTH - SAFE_SIDE * 2, h: px(42),
      text: getText("history"), size: 30, align: hmUI.align.LEFT,
    }));
    y += px(50);

    if (!this.state.groups.length) {
      container.createWidget(hmUI.widget.TEXT, textStyle({
        x: SAFE_SIDE, y, w: WIDTH - SAFE_SIDE * 2, h: px(90),
        text: `${getText("noSessionsYet")}\n${getText("completeTimerHint")}`,
        size: 19, color: COLORS.muted,
      }));
      y += px(108);
    } else {
      const total = this.state.history.reduce(
        (sum, record) => sum + (record.actualSeconds ?? record.totalSeconds ?? 0),
        0,
      );
      container.createWidget(hmUI.widget.TEXT, textStyle({
        x: SAFE_SIDE, y, w: WIDTH - SAFE_SIDE * 2, h: px(30),
        text: `${this.state.history.length} ${getText("sessions")} · ${formatDuration(total)} ${getText("total")}`,
        size: 17, color: COLORS.muted, align: hmUI.align.LEFT,
      }));
      y += px(38);
      const [latest, ...earlier] = this.state.groups;
      container.createWidget(hmUI.widget.TEXT, textStyle({
        x: SAFE_SIDE, y, w: WIDTH - SAFE_SIDE * 2, h: px(28),
        text: `${latest.label} · ${getText("latest")}`, size: 18,
        color: COLORS.muted, align: hmUI.align.LEFT,
      }));
      y += px(34);
      latest.records.forEach((record) => { y = createHistoryCard(container, record, y); });

      if (earlier.length) {
        y += px(8);
        container.createWidget(hmUI.widget.TEXT, textStyle({
          x: SAFE_SIDE, y, w: WIDTH - SAFE_SIDE * 2, h: px(28),
          text: getText("earlier"), size: 18, color: COLORS.muted, align: hmUI.align.LEFT,
        }));
        y += px(34);
        earlier.forEach((group) => {
          container.createWidget(hmUI.widget.BUTTON, buttonStyle({
            x: SAFE_SIDE, y, w: WIDTH - SAFE_SIDE * 2, h: px(50),
            text: `${group.label} · ${group.records.length}  ›`, size: 18,
            click: () => push({ url: "page/history-day", params: group.key }),
          }));
          y += px(58);
        });
      }
    }

    y += px(14);
    container.createWidget(hmUI.widget.BUTTON, buttonStyle({
      x: SAFE_SIDE + px(32), y, w: WIDTH - SAFE_SIDE * 2 - px(64), h: px(48),
      text: getText("back"), size: 21, click: () => back(),
    }));
  },
});
