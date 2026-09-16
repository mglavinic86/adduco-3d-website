import { useEffect, useRef } from "react";
import { journeyProgress } from "./journey";

type Film = {
  video: HTMLVideoElement;
  request: AbortController;
  source: string;
  objectUrl?: string;
  recovering: boolean;
  failed: boolean;
  key: string;
  index: number;
  requestedTime: number;
  presentedTime?: number;
  frameRequest?: number;
  dispose: () => void;
};

/** Native scroll chooses the destination; decoded frames drive the HTML captions. */
export default function CinematicFilm({
  onFail,
  onFrame,
}: {
  onFail: () => void;
  onFrame: (progress: number | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = ref.current!;
    const poster = stage.parentElement?.querySelector<HTMLImageElement>(
      ".world-stills img.active",
    );
    let posterReady = !poster || poster.complete;
    const portrait = matchMedia("(max-aspect-ratio: 9/10)");
    const films = new Map<string, Film>();
    let frame = 0;
    let disposed = false;
    let suspended = document.hidden;
    let blobSources = false;
    let shown: string | undefined;
    let target = "";
    let previous = journeyProgress();
    let eased = previous;
    // Keep the opening pose while its first movie is being prepared. Scroll
    // during loading remains a destination, not a frame to reveal abruptly.
    let openingPending =
      previous === 0 && (!location.hash || location.hash === "#vizija");
    let lastTick = 0;
    let direction = 1;
    let revealOpening: (() => void) | undefined;
    if (openingPending) onFrame(0);

    function schedule() {
      if (!disposed && !suspended && !frame)
        frame = requestAnimationFrame(update);
    }

    function openingReady() {
      posterReady = true;
      schedule();
    }

    function present(film: Film, time: number) {
      if (disposed || film.request.signal.aborted) return;
      film.presentedTime = time;
      if (suspended) return;
      if (
        film.key !== target ||
        !Number.isFinite(film.requestedTime) ||
        Math.abs(time - film.requestedTime) > 1 / 24
      )
        return;
      if (film.recovering && !film.objectUrl) return;
      if (shown !== target) {
        if (shown) films.get(shown)?.video.classList.remove("ready");
        film.video.classList.add("ready");
        shown = target;
        if (openingPending) {
          // Browsers can color-manage video differently from still images.
          // Blend the identical pose once, then let scroll move the camera.
          film.video.classList.add("opening");
          const reveal = () => {
            if (disposed || film.request.signal.aborted) return;
            film.video.removeEventListener("animationend", reveal);
            film.video.classList.remove("opening");
            openingPending = false;
            revealOpening = undefined;
            lastTick = 0;
            schedule();
          };
          revealOpening = reveal;
          film.video.addEventListener("animationend", reveal, { once: true });
        }
        const orientation = film.video.dataset.orientation;
        retain(
          [...films.keys()].filter((key) => key.startsWith(`${orientation}:`)),
        );
      }
      film.video.dataset.presentedTime = String(time);
      onFrame(
        film.index +
          Math.min(1, time / Math.max(1 / 24, film.video.duration - 1 / 24)),
      );
    }

    function watchFrame(film: Film) {
      if (
        suspended ||
        film.request.signal.aborted ||
        film.frameRequest !== undefined ||
        typeof film.video.requestVideoFrameCallback !== "function"
      )
        return;
      film.frameRequest = film.video.requestVideoFrameCallback(
        (_, metadata) => {
          film.frameRequest = undefined;
          present(film, metadata.mediaTime);
          if (disposed || film.request.signal.aborted) return;
          watchFrame(film);
          schedule();
        },
      );
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
      const version =
        orientation === "portrait" ? (index === 0 ? "-v2" : "-v3") : "";
      const source = `/assets/construction-${orientation}${version}-${index}.mp4`;
      const request = new AbortController();
      const frameCallbacks =
        typeof video.requestVideoFrameCallback === "function";
      const prepared = () => {
        if (
          video.readyState >= 2 &&
          !film.objectUrl &&
          !film.recovering &&
          (!video.seekable.length ||
            video.seekable.end(video.seekable.length - 1) === 0)
        ) {
          void recoverSeeking(film);
        }
        if (!frameCallbacks) film.presentedTime = video.currentTime;
        schedule();
      };
      const seeked = () => {
        // Browsers without frame callbacks still expose a completed, decoded seek.
        if (!frameCallbacks) present(film, video.currentTime);
        schedule();
      };
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
        key,
        index,
        requestedTime: NaN,
        dispose() {
          request.abort();
          if (film.frameRequest !== undefined)
            video.cancelVideoFrameCallback(film.frameRequest);
          video.removeEventListener("loadeddata", prepared);
          video.removeEventListener("canplay", prepared);
          video.removeEventListener("seeked", seeked);
          video.removeEventListener("error", failed);
          video.removeAttribute("src");
          video.load();
          video.remove();
          if (film.objectUrl) URL.revokeObjectURL(film.objectUrl);
        },
      };
      films.set(key, film);
      video.addEventListener("loadeddata", prepared);
      video.addEventListener("canplay", prepared);
      video.addEventListener("seeked", seeked);
      video.addEventListener("error", failed);
      stage.append(video);
      watchFrame(film);
      if (blobSources) void recoverSeeking(film);
      else video.src = source;
      return film;
    }

    async function recoverSeeking(film: Film) {
      blobSources = true;
      film.recovering = true;
      // Once this host requires complete files, use that path for later moves.
      // Cancel the unused native request instead of downloading both paths.
      if (shown !== film.key) {
        film.video.removeAttribute("src");
        film.video.load();
      }
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
        film.presentedTime = undefined;
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

    function update(now: number) {
      frame = 0;
      if (disposed || suspended || document.hidden || !posterReady) return;
      let destination = journeyProgress();
      // Settle on the shared anchor despite subpixel scroll rounding.
      if (Math.abs(destination - Math.round(destination)) < 0.002)
        destination = Math.round(destination);
      if (Math.abs(destination - previous) > 0.002)
        direction = Math.sign(destination - previous);
      previous = destination;
      // Start a fresh gesture gently; time spent idle is not animation time.
      const elapsed = lastTick && now - lastTick < 80 ? now - lastTick : 16;
      lastTick = now;
      if (!openingPending) {
        eased += (destination - eased) * (1 - Math.exp(-elapsed / 100));
        if (Math.abs(destination - eased) < 0.001) {
          eased = destination;
          lastTick = 0;
        } else schedule();
      }
      const progress = eased;
      const index = Math.min(2, Math.floor(progress));
      const position = progress - index;
      const orientation = portrait.matches ? "portrait" : "landscape";
      target = `${orientation}:${index}`;
      const next =
        direction > 0 && position > 0.3
          ? index + 1
          : direction < 0 && position < 0.7
            ? index - 1
            : -1;
      const neighbor =
        next >= 0 && next <= 2 ? `${orientation}:${next}` : undefined;
      // Keep prepared moves in this orientation for immediate reverse scrolling.
      // There are only three; release the other composition after rotation.
      retain([
        target,
        ...(shown ? [shown] : []),
        ...[...films.keys()].filter((key) => key.startsWith(`${orientation}:`)),
      ]);
      const film = ensure(target, index, orientation);
      if (neighbor) ensure(neighbor, next, orientation);
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
      const frameStart =
        Math.round(position * Math.max(0, video.duration - 1 / 24) * 24) / 24;
      // Seek inside the frame. At the exact PTS, browser microsecond rounding
      // can select the previous frame, producing a repeat followed by a skip.
      const time = Math.min(video.duration - 0.001, frameStart + 1 / 48);
      if (Math.abs(video.currentTime - time) > 1 / 48) {
        film.requestedTime = time;
        video.currentTime = time;
        return;
      }
      film.requestedTime = time;
      if (film.presentedTime !== undefined) present(film, film.presentedTime);
    }

    function suspend() {
      suspended = true;
      cancelAnimationFrame(frame);
      frame = 0;
      lastTick = 0;
      // Keep the visible pose, release speculative/previous decoders and Blobs.
      retain(shown ? [shown] : []);
      // Let an already queued callback record an in-flight seek's completion.
      // watchFrame will not register another callback until the page resumes.
    }

    function resume() {
      if (document.hidden || !suspended) return;
      suspended = false;
      lastTick = 0;
      // A tab can be hidden midway through the one-time still/video handoff.
      // Resume that same decoded pose without depending on an animation event
      // that may have been skipped while the browser suspended the page.
      revealOpening?.();
      for (const film of films.values()) watchFrame(film);
      schedule();
    }

    const visibility = () => (document.hidden ? suspend() : resume());
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", suspend);
    window.addEventListener("pageshow", resume);
    portrait.addEventListener("change", schedule);
    // Let the small responsive artwork finish before starting a movie download.
    // Capture openingPending above so scrolling during this wait still blends
    // from the original pose. A failed image must not prevent the film loading.
    poster?.addEventListener("load", openingReady);
    poster?.addEventListener("error", openingReady);
    schedule();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", suspend);
      window.removeEventListener("pageshow", resume);
      portrait.removeEventListener("change", schedule);
      poster?.removeEventListener("load", openingReady);
      poster?.removeEventListener("error", openingReady);
      retain([]);
      onFrame(null);
    };
  }, [onFail, onFrame]);
  return <div ref={ref} className="world-film-stage" />;
}
