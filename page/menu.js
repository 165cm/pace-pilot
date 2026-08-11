import hmUI from "@zos/ui";
import { back, replace, push } from "@zos/router";
import { setWakeUpRelaunch } from "@zos/display";
import { px } from "@zos/utils";
import { getActiveSession } from "../services/storage";
import { abortSession } from "../services/session-actions";
import {
  WIDTH,
  HEIGHT,
  IS_SQUARE,
  COLORS,
  textStyle,
  buttonStyle,
  createPageTitle,
  drawBackground,
} from "../ui/common";

Page({
  state: {
    session: null,
  },

  onInit() {
    this.state.session = getActiveSession();
  },

  build() {
    drawBackground();
    createPageTitle("Menu");

    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: px(IS_SQUARE ? 32 : 82),
        y: px(IS_SQUARE ? 100 : 126),
        w: WIDTH - px(IS_SQUARE ? 64 : 164),
        h: px(62),
        text: "History",
        size: 24,
        click: () => push({ url: "page/history" }),
      }),
    );
    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: px(IS_SQUARE ? 32 : 82),
        y: px(IS_SQUARE ? 188 : 222),
        w: WIDTH - px(IS_SQUARE ? 64 : 164),
        h: px(62),
        text: "Hold to cancel",
        normal: COLORS.danger,
        pressed: COLORS.dangerPressed,
        size: 21,
        longpress: () => {
          abortSession(this.state.session);
          setWakeUpRelaunch({ relaunch: false });
          replace({ url: "page/home" });
        },
      }),
    );
    hmUI.createWidget(
      hmUI.widget.TEXT,
      textStyle({
        x: px(IS_SQUARE ? 28 : 80),
        y: px(IS_SQUARE ? 266 : 306),
        w: WIDTH - px(IS_SQUARE ? 56 : 160),
        h: px(56),
        text: "Canceled sessions are not saved",
        size: 18,
        color: COLORS.muted,
      }),
    );
    hmUI.createWidget(
      hmUI.widget.BUTTON,
      buttonStyle({
        x: px(IS_SQUARE ? 52 : 110),
        y: HEIGHT - px(IS_SQUARE ? 88 : 100),
        w: WIDTH - px(IS_SQUARE ? 104 : 220),
        h: px(54),
        text: "Back",
        size: 23,
        click: () => back(),
      }),
    );
  },
});
