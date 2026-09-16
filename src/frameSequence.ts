import { createFrameStore } from "./frameStore";

/** Draw only the frame selected by the latest scroll tick, never by a download. */
export function createFrameSequence(
  stage: HTMLElement,
  options: {
    start: number;
    opening: boolean;
    schedule: () => void;
    onReady: () => void;
    onFrame: (progress: number) => void;
    onFail: () => void;
  },
) {
  const canvas = document.createElement("canvas");
  canvas.className = "world-film world-sequence";
  canvas.dataset.orientation = "portrait";
  canvas.width = 720;
  canvas.height = 1280;
  const context = canvas.getContext("2d", { alpha: false })!;
  stage.append(canvas);
  const store = createFrameStore(options.schedule);
  let cursor = options.start * 192;
  let drawn = -1;
  let ready = false;
  let opening = options.opening;
  let lastTick = 0;
  let disposed = false;
  const reveal = () => {
    canvas.classList.remove("opening");
    opening = false;
    lastTick = 0;
    options.schedule();
  };
  canvas.addEventListener("animationend", reveal);
  return {
    get progress() {
      return Math.max(0, drawn) / 192;
    },
    update(now: number, destination: number) {
      if (disposed) return;
      const target = Math.max(0, Math.min(576, destination * 192));
      const elapsed = lastTick && now - lastTick < 80 ? now - lastTick : 16;
      lastTick = now;
      const difference = target - cursor;
      const step = Math.min(4, elapsed * 0.144);
      let next =
        !ready || opening
          ? cursor
          : cursor +
            Math.max(
              -step,
              Math.min(step, difference * (1 - Math.exp(-elapsed / 100))),
            );
      if (ready && !opening && Math.abs(next - target) < 0.1) next = target;
      const index = Math.round(next);
      store.prepare(index, difference < 0 ? -1 : 1);
      const image = store.get(index);
      if (!image) {
        lastTick = 0;
        if (store.failed(index)) options.onFail();
        return;
      }
      cursor = next;
      if (drawn !== index) {
        context.drawImage(image, 0, 0);
        drawn = index;
        const segment = Math.min(2, Math.floor(index / 192));
        canvas.dataset.frame = String(index);
        canvas.dataset.segment = String(segment);
        canvas.dataset.presentedTime = String((index - segment * 192) / 24);
        options.onFrame(index / 192);
      }
      if (!ready) {
        ready = true;
        canvas.classList.add("ready");
        if (opening) canvas.classList.add("opening");
        options.onReady();
      }
      if (!opening && Math.abs(target - cursor) > 0.1) options.schedule();
      else lastTick = 0;
    },
    dispose() {
      disposed = true;
      store.dispose();
      canvas.removeEventListener("animationend", reveal);
      canvas.remove();
    },
  };
}
