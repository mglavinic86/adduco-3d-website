import { useEffect, useRef } from "react";
import { journeyProgress } from "./journey";

/** A paused film is the camera: native scrolling selects its next decoded frame. */
export default function CinematicFilm({ onFail }: { onFail: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current!;
    const source =
      innerWidth < 1024
        ? "/assets/construction-film-mobile.mp4"
        : "/assets/construction-film.mp4";
    const request = new AbortController();
    let frame = 0;
    let disposed = false;
    let recovering = false;
    let objectUrl: string | undefined;
    const recoverSeeking = async () => {
      recovering = true;
      video.classList.remove("ready");
      try {
        // Some hosts deliver the whole movie but expose no byte ranges. A
        // same-origin download creates a locally seekable movie in that case.
        const response = await fetch(source, { signal: request.signal });
        if (!response.ok) throw new Error("Movie unavailable");
        const bytes = await response.blob();
        if (disposed) return;
        objectUrl = URL.createObjectURL(
          new Blob([bytes], { type: "video/mp4" }),
        );
        video.src = objectUrl;
      } catch {
        if (!disposed) onFail();
      }
    };
    const update = () => {
      frame = 0;
      if (
        disposed ||
        document.hidden ||
        video.readyState < 2 ||
        !Number.isFinite(video.duration)
      )
        return;
      if (
        !objectUrl &&
        (video.seekable.length === 0 ||
          video.seekable.end(video.seekable.length - 1) === 0)
      ) {
        if (!recovering) void recoverSeeking();
        return;
      }
      // One seek at a time. Its completion reads the newest scroll position,
      // so a quick jump never queues obsolete frames behind the current scene.
      if (video.seeking) return;
      const time =
        (journeyProgress() / 3) * Math.max(0, video.duration - 1 / 30);
      if (Math.abs(video.currentTime - time) > 1 / 60) video.currentTime = time;
      else video.classList.add("ready");
    };
    const schedule = () => {
      if (!disposed && !frame) frame = requestAnimationFrame(update);
    };
    video.addEventListener("loadeddata", schedule);
    video.addEventListener("seeked", schedule);
    video.addEventListener("canplay", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    video.src = source;
    schedule();
    return () => {
      disposed = true;
      request.abort();
      cancelAnimationFrame(frame);
      video.removeEventListener("loadeddata", schedule);
      video.removeEventListener("seeked", schedule);
      video.removeEventListener("canplay", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      video.removeAttribute("src");
      video.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [onFail]);
  return (
    <video
      ref={ref}
      className="world-film"
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
      tabIndex={-1}
      onError={onFail}
    />
  );
}
