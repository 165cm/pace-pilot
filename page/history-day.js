import hmUI from "@zos/ui";
import { back } from "@zos/router";
import { px } from "@zos/utils";
import { groupHistoryByDate } from "../core/history";
import { getHistory } from "../services/storage";
import { createHistoryCard } from "../ui/history-card";
import {
  WIDTH,
  HEIGHT,
  textStyle,
  buttonStyle,
  drawBackground,
  SAFE_SIDE,
  SAFE_TOP,
} from "../ui/common";

Page({
  state: { group: null },

  onInit(dateKey = "") {
    this.state.group = groupHistoryByDate(getHistory()).find(
      (group) => group.key === dateKey,
    );
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
        text: this.state.group?.label ?? "History",
        size: 27,
        align: hmUI.align.LEFT,
      }),
    );
    y += px(56);

    for (const record of this.state.group?.records ?? []) {
      y = createHistoryCard(container, record, y);
    }

    y += px(16);
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
