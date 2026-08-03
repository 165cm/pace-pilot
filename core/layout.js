export function threePartControlLayout({
  width,
  margin,
  sideWidth,
  gap,
}) {
  const centerWidth = width - margin * 2 - sideWidth * 2 - gap * 2;
  return {
    left: { x: margin, w: sideWidth },
    center: { x: margin + sideWidth + gap, w: centerWidth },
    right: {
      x: margin + sideWidth + gap + centerWidth + gap,
      w: sideWidth,
    },
  };
}

export function twoButtonLayout({ width, margin, gap }) {
  const buttonWidth = Math.floor((width - margin * 2 - gap) / 2);
  return {
    left: { x: margin, w: buttonWidth },
    right: { x: margin + buttonWidth + gap, w: buttonWidth },
  };
}

export function isInsideSafeArea(rect, screen, safe) {
  return (
    rect.x >= safe.left &&
    rect.y >= safe.top &&
    rect.x + rect.w <= screen.width - safe.right &&
    rect.y + rect.h <= screen.height - safe.bottom
  );
}
