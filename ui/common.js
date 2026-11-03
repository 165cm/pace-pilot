import hmUI from "@zos/ui";
import { setStatusBarVisible } from "@zos/ui";
import { getDeviceInfo, SCREEN_SHAPE_SQUARE } from "@zos/device";
import { px } from "@zos/utils";

export const { width: WIDTH, height: HEIGHT, screenShape } = getDeviceInfo();
export const IS_SQUARE = screenShape === SCREEN_SHAPE_SQUARE;
export const SAFE_SIDE = px(IS_SQUARE ? 24 : 76);
export const SAFE_TOP = px(IS_SQUARE ? 16 : 42);
export const SAFE_BOTTOM = px(IS_SQUARE ? 28 : 38);

export const COLORS = Object.freeze({
  background: 0x05070a,
  panel: 0x151a21,
  panelPressed: 0x252d38,
  white: 0xffffff,
  muted: 0x98a2b3,
  faint: 0x303846,
  work: 0x2f80ed,
  workPressed: 0x1f65c1,
  chase: 0xffa726,
  chasePressed: 0xdc8610,
  danger: 0xff4d5e,
  dangerPressed: 0xcc3342,
  success: 0x31c48d,
  primaryAction: 0x27313d,
  secondaryAction: 0x163b68,
});

export function textStyle({
  x = 0,
  y = 0,
  w = WIDTH,
  h = px(40),
  text = "",
  size = 24,
  color = COLORS.white,
  align = hmUI.align.CENTER_H,
}) {
  return {
    x,
    y,
    w,
    h,
    text,
    color,
    text_size: px(size),
    align_h: align,
    align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.ELLIPSIS,
  };
}

export function buttonStyle({
  x,
  y,
  w,
  h,
  text,
  color = COLORS.white,
  normal = COLORS.panel,
  pressed = COLORS.panelPressed,
  size = 24,
  click,
  longpress,
}) {
  return {
    x,
    y,
    w,
    h,
    text,
    color,
    text_size: px(size),
    radius: Math.round(h / 2),
    normal_color: normal,
    press_color: pressed,
    click_func: click,
    longpress_func: longpress,
  };
}

export function createPageTitle(title, clockText = "") {
  const clockWidth = px(IS_SQUARE ? 90 : 86);
  const titleGap = px(8);
  hmUI.createWidget(
    hmUI.widget.TEXT,
    textStyle({
      x: SAFE_SIDE,
      y: SAFE_TOP,
      w: WIDTH - SAFE_SIDE * 2 - clockWidth - titleGap,
      h: px(36),
      text: title,
      size: 22,
      align: hmUI.align.LEFT,
    }),
  );
  return hmUI.createWidget(
    hmUI.widget.TEXT,
    textStyle({
      x: WIDTH - SAFE_SIDE - clockWidth,
      y: SAFE_TOP,
      w: clockWidth,
      h: px(36),
      text: clockText,
      size: 21,
      color: COLORS.muted,
      align: hmUI.align.RIGHT,
    }),
  );
}

export function drawBackground() {
  // Square devices reserve a 64 px system title bar by default. The app draws
  // its own compact header so the full screen remains usable on Bip 6.
  if (IS_SQUARE) {
    setStatusBarVisible(false);
  }
  hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: 0,
    y: 0,
    w: WIDTH,
    h: HEIGHT,
    color: COLORS.background,
  });
}
