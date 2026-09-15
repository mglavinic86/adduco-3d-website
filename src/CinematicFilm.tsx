import { useEffect, useRef } from "react";
import { journeyProgress } from "./journey";

type Film = {
  video: HTMLVideoElement;
  request: AbortController;
  source: string;
  objectUrl?: string;
  recovering: boolean;
  failed: boolean;
  dispose: () => void;
};

/** Paused, independently loaded camera moves share the native document clock. */
export default function CinematicFilm({ onFail }: { onFail: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = ref.current!;
    const portrait = matchMedia("(max-aspect-ratio: 9/10)");
    const films = new Map<string, Film>();
    let frame = 0;
    let disposed = false;
    let shown: string | undefined;
    let target = "";
    let previous = journeyProgress();
    let direction = 1;

    function schedule() {
      if (!disposed && !frame) frame = requestAnimationFrame(update);
    }

    function ensure(key: string, index: number, orientation: string) {
      const cached = films.get(key);
      if (cached) return cached;
      const video = document.createElement("video");
      video.className = "world-film";
      video.dataset.segment = String(index);
      video.dataset.orientation = orientation;
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.disablePictureInPicture = true;
      video.tabIndex = -1;
      const source = `/assets/construction-${orientation}-${index}.mp4`;
      const request = new AbortController();
      const failed = () => {
        film.failed = true;
        if (!disposed && target === key) onFail();
      };
      const film: Film = {
        video,
        source,
        request,
        recovering: false,
        failed: false,
        dispose() {
          request.abort();
          video.removeEventListener("loadeddata", schedule);
          video.removeEventListener("canplay", schedule);
          video.removeEventListener("seeked", schedule);
          video.removeEventListener("error", failed);
          video.removeAttribute("src");
          video.load();
          video.remove();
          if (film.objectUrl) URL.revokeObjectURL(film.objectUrl);
        },
      };
      films.set(key, film);
      video.addEventListener("loadeddata", schedule);
      video.addEventListener("canplay", schedule);
      video.addEventListener("seeked", schedule);
      video.addEventListener("error", failed);
      stage.append(video);
      video.src = source;
      return film;
    }

    async function recoverSeeking(film: Film) {
      film.recovering = true;
      try {
        // A local Blob restores seeking when a host serves no media byte ranges.
        const response = await fetch(film.source, {
          signal: film.request.signal,
        });
        if (!response.ok) throw new Error("Film unavailable");
        const bytes = await response.blob();
        if (disposed || film.request.signal.aborted) return;
        film.objectUrl = URL.createObjectURL(
          new Blob([bytes], { type: "video/mp4" }),
        );
        film.video.src = film.objectUrl;
      } catch {
        if (!disposed && !film.request.signal.aborted) {
          film.failed = true;
          if (films.get(target) === film) onFail();
        }
      }
    }

    function retain(keys: string[]) {
      for (const [key, film] of films) {
        if (!keys.includes(key)) {
          film.dispose();
          films.delete(key);
        }
      }
    }

    function update() {
      frame = 0;
      if (disposed || document.hidden) return;
      let progress = journeyProgress();
      // Settle on the shared anchor despite subpixel scroll rounding.
      if (Math.abs(progress - Math.round(progress)) < 0.002)
        progress = Math.round(progress);
      if (Math.abs(progress - previous) > 0.002)
        direction = Math.sign(progress - previous);
      previous = progress;
      const index = Math.min(2, Math.floor(progress));
      const position = progress - index;
      const orientation = portrait.matches ? "portrait" : "landscape";
      target = `${orientation}:${index}`;
      const next =
        direction > 0 && position > 0.62
          ? index + 1
          : direction < 0 && position < 0.38
            ? index - 1
            : -1;
      const neighbor =
        next >= 0 && next <= 2 ? `${orientation}:${next}` : undefined;
      // Keep the last visible frame and an already requested adjacent move.
      retain([
        target,
        ...(shown ? [shown] : []),
        ...(neighbor ? [neighbor] : []),
      ]);
      const film = ensure(target, index, orientation);
      if (film.failed) {
        onFail();
        return;
      }
      const video = film.video;
      if (video.readyState < 2 || !Number.isFinite(video.duration)) return;
      if (
        !film.objectUrl &&
        (!video.seekable.length ||
          video.seekable.end(video.seekable.length - 1) === 0)
      ) {
        if (!film.recovering) void recoverSeeking(film);
        return;
      }
      if (video.seeking) return;
      const time = position * Math.max(0, video.duration - 1 / 24);
      if (Math.abs(video.currentTime - time) > 1 / 48) {
        video.currentTime = time;
        return;
      }
      if (shown !== target) {
        if (shown) films.get(shown)?.video.classList.remove("ready");
        video.classList.add("ready");
        shown = target;
      }
      retain([target, ...(neighbor ? [neighbor] : [])]);
      if (neighbor) ensure(neighbor, next, orientation);
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    portrait.addEventListener("change", schedule);
    schedule();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      portrait.removeEventListener("change", schedule);
      retain([]);
    };
  }, [onFail]);
  return <div ref={ref} className="world-film-stage" />;
}
