type Direction = -1 | 1;

/** Consume one vertical gesture inside the film; all other page input stays native. */
export function attachSceneGestures(
  stage: HTMLElement,
  canMove: (direction: Direction) => boolean,
  isBusy: () => boolean,
  move: (direction: Direction) => void,
) {
  const atStage = () => Math.abs(stage.getBoundingClientRect().top) <= 4;
  const interactive = (target: EventTarget | null) =>
    target instanceof Element &&
    !!target.closest(
      'a, button, input, textarea, select, [contenteditable="true"]',
    );
  let lastWheel = -Infinity;
  let wheelDistance = 0;
  let wheelConsumed = false;
  const wheel = (event: WheelEvent) => {
    if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY))
      return;
    if (!atStage()) return;
    const now = performance.now();
    if (now - lastWheel > 240) {
      wheelDistance = 0;
      wheelConsumed = false;
    }
    lastWheel = now;
    const direction = event.deltaY > 0 ? 1 : -1;
    if (isBusy() || wheelConsumed) {
      event.preventDefault();
      wheelConsumed = true;
      return;
    }
    if (!canMove(direction)) return;
    event.preventDefault();
    const pixels =
      event.deltaY *
      (event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? stage.clientHeight
          : 1);
    wheelDistance =
      Math.sign(pixels) === Math.sign(wheelDistance)
        ? wheelDistance + pixels
        : pixels;
    if (Math.abs(wheelDistance) >= 40) {
      wheelConsumed = true;
      move(direction);
    }
  };
  let touch: { x: number; y: number; consumed: boolean } | null = null;
  const touchStart = (event: TouchEvent) => {
    touch =
      event.touches.length === 1 && atStage()
        ? {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
            consumed: isBusy(),
          }
        : null;
  };
  const touchMove = (event: TouchEvent) => {
    if (!touch || event.touches.length !== 1) {
      touch = null;
      return;
    }
    const dx = event.touches[0].clientX - touch.x;
    const dy = touch.y - event.touches[0].clientY;
    if (Math.abs(dx) >= Math.abs(dy) || Math.abs(dy) < 6) return;
    const direction = dy > 0 ? 1 : -1;
    if (touch.consumed || isBusy()) {
      event.preventDefault();
      touch.consumed = true;
      return;
    }
    if (!canMove(direction)) return;
    event.preventDefault();
    if (Math.abs(dy) >= 40) {
      touch.consumed = true;
      move(direction);
    }
  };
  const touchEnd = () => {
    touch = null;
  };
  const keyboard = (event: KeyboardEvent) => {
    if (
      !atStage() ||
      interactive(event.target) ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    const direction =
      event.key === "ArrowUp" ||
      event.key === "PageUp" ||
      (event.key === " " && event.shiftKey)
        ? -1
        : ["ArrowDown", "PageDown", " "].includes(event.key)
          ? 1
          : null;
    if (!direction) return;
    if (isBusy() || event.repeat) {
      event.preventDefault();
      return;
    }
    if (canMove(direction)) {
      event.preventDefault();
      move(direction);
    }
  };
  stage.addEventListener("wheel", wheel, { passive: false });
  stage.addEventListener("touchstart", touchStart, { passive: true });
  stage.addEventListener("touchmove", touchMove, { passive: false });
  stage.addEventListener("touchend", touchEnd);
  stage.addEventListener("touchcancel", touchEnd);
  document.addEventListener("keydown", keyboard);
  return () => {
    stage.removeEventListener("wheel", wheel);
    stage.removeEventListener("touchstart", touchStart);
    stage.removeEventListener("touchmove", touchMove);
    stage.removeEventListener("touchend", touchEnd);
    stage.removeEventListener("touchcancel", touchEnd);
    document.removeEventListener("keydown", keyboard);
  };
}
