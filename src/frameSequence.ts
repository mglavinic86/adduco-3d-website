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
  const start = Math.round(options.start * 192);
  let previousTarget = start;
  let previousInputTime = 0;
  let stride = 1;
  let direction = 1;
  let drawn = -1;
  let ready = false;
  let opening = options.opening;
  let disposed = false;
  const reveal = () => {
    canvas.classList.remove("opening");
    opening = false;
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
      if (target !== previousTarget) {
        direction = Math.sign(target - previousTarget);
        const elapsed = Math.max(16, now - previousInputTime);
        stride = Math.min(
          8,
          Math.max(
            1,
            Math.round((Math.abs(target - previousTarget) * 16) / elapsed),
          ),
        );
        previousInputTime = now;
      }
      previousTarget = target;
      // Native scrolling already supplies motion and momentum. A second eased
      // clock lags behind it and can keep moving forward after a reverse gesture.
      const requested = opening ? start : Math.round(target);
      store.prepare(requested, direction, stride);
      if (store.failed(requested)) {
        options.onFail();
        return;
      }
      const prepared = store.get(requested, drawn < 0 ? requested : drawn);
      if (!prepared) return;
      const { index, image } = prepared;
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
    },
    dispose() {
      disposed = true;
      store.dispose();
      canvas.removeEventListener("animationend", reveal);
      canvas.remove();
    },
  };
}
