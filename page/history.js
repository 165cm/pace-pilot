import hmUI from "@zos/ui";
import { back, push } from "@zos/router";
import { px } from "@zos/utils";
import { formatDuration } from "../core/format";
import { groupHistoryByDate } from "../core/history";
import { calculateHistoryStats } from "../core/timer-engine";
import { getHistory } from "../services/storage";
import { createHistoryCard } from "../ui/history-card";
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
  state: { groups: [], stats: null },

  onInit() {
    const history = getHistory();
    this.state.groups = groupHistoryByDate(history);
    this.state.stats = calculateHistoryStats(history);
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
        h: px(42),
        text: "History",
        size: 30,
        align: hmUI.align.LEFT,
      }),
    );
    y += px(52);

    if (!this.state.groups.length) {
      container.createWidget(
        hmUI.widget.TEXT,
        textStyle({
          x: SAFE_SIDE,
          y,
          w: WIDTH - SAFE_SIDE * 2,
          h: px(72),
          text: "No sessions yet",
          size: 20,
          color: COLORS.muted,
        }),
      );
      y += px(88);
    } else {
      const [latest, ...earlier] = this.state.groups;
      container.createWidget(
        hmUI.widget.TEXT,
        textStyle({
          x: SAFE_SIDE,
          y,
          w: WIDTH - SAFE_SIDE * 2,
          h: px(44),
          text:
            `On time ${this.state.stats.withinPlanRate}% · ` +
            `Median ${formatDuration(this.state.stats.medianActualSeconds)}\n` +
            `Auto add ${this.state.stats.extensionRate}%`,
          size: 17,
          color: COLORS.muted,
          align: hmUI.align.LEFT,
        }),
      );
      y += px(52);
      container.createWidget(
        hmUI.widget.TEXT,
        textStyle({
          x: SAFE_SIDE,
          y,
          w: WIDTH - SAFE_SIDE * 2,
          h: px(30),
          text: `${latest.label} · Latest`,
          size: 19,
          color: COLORS.muted,
          align: hmUI.align.LEFT,
        }),
      );
      y += px(36);
      latest.records.forEach((record) => {
        y = createHistoryCard(container, record, y);
      });

      if (earlier.length) {
        y += px(10);
        container.createWidget(
          hmUI.widget.TEXT,
          textStyle({
            x: SAFE_SIDE,
            y,
            w: WIDTH - SAFE_SIDE * 2,
            h: px(30),
            text: "Earlier",
            size: 19,
            color: COLORS.muted,
            align: hmUI.align.LEFT,
          }),
        );
        y += px(38);
        earlier.forEach((group) => {
          container.createWidget(
            hmUI.widget.BUTTON,
            buttonStyle({
              x: SAFE_SIDE,
              y,
              w: WIDTH - SAFE_SIDE * 2,
              h: px(50),
              text: `${group.label} · ${group.records.length}  ›`,
              size: 18,
              click: () =>
                push({ url: "page/history-day", params: group.key }),
            }),
          );
          y += px(58);
        });
      }
    }

    y += px(14);
    container.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: SAFE_SIDE + px(32),
        y,
        w: WIDTH - SAFE_SIDE * 2 - px(64),
        h: px(48),
        text: "Back",
        size: 21,
        click: () => back(),
      }),
    );
  },
});
