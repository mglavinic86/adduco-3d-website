import { prepareMediaDelivery } from "./mediaDelivery";
import { useEffect, useRef, useState } from "react";
import { scenes } from "../scenes";
import { Arrow } from "../ui";
import { selectScrollCodec, type ScrollCodec } from "./selectMedia";

export const media = (portrait: boolean, file: string, segment = 0) =>
  `/assets/scroll/${segment ? `segment-${segment + 1}/` : ""}${portrait ? "portrait" : "landscape"}-${file}`;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const starts = [0.25, 2.55, 4.85];
const anchors = [0, 1.9, 4.2, 6.5];
const progressAt = (units: number) =>
  starts.reduce((sum, start) => sum + clamp((units - start) / 1.65), 0);
const still = (scene: number, portrait: boolean) =>
  media(portrait, scene ? "end.webp" : "start.webp", Math.max(0, scene - 1));

function usePreference(query: string) {
  // A stable server snapshot avoids hydrating the wrong orientation or fetching
  // a movie before Data Saver/reduced motion have been read on the client.
  const [value, setValue] = useState<boolean>();
  useEffect(() => {
    const mq = matchMedia(query);
    const update = () => setValue(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return value;
}

export function Captions({
  progress,
  enhanced,
  settled,
}: {
  progress: number;
  enhanced: boolean;
  settled: boolean;
}) {
  return scenes.map((scene, i) => {
    const opacity = settled
      ? Number(Math.round(progress) === i)
      : progress >= i
        ? clamp(1 - (progress - i) / 0.35)
        : clamp((progress - i + 0.45) / 0.25);
    const Heading = i === 0 ? "h1" : "h2";
    return (
      <div
        className="chapter-content scroll-caption"
        key={scene.id}
        style={{ opacity }}
        aria-hidden={enhanced && opacity < 0.15}
        inert={enhanced && opacity < 0.15}
      >
        <p className="eyebrow">{scene.label}</p>
        <Heading>
          {scene.title[0]}
          <br />
          {scene.title[1]}
        </Heading>
        <p className="chapter-copy">
          {scene.copy.map((line, n) => (
            <span key={line}>
              {n > 0 && <br />}
              {line}
            </span>
          ))}
        </p>
        <a className="text-link" href={scene.href}>
          {scene.action}
          <Arrow diagonal />
        </a>
      </div>
    );
  });
}

function DirectScroll({
  portrait,
  stillOnly,
  enhanced,
}: {
  portrait: boolean;
  stillOnly: boolean;
  enhanced: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const films = useRef<(HTMLVideoElement | null)[]>([]);
  const [progress, setProgress] = useState(0);
  const [settledProgress, setSettledProgress] = useState(0);
  // Travel may clear the artwork; a stopped camera must leave readable text.
  // This finite timer never moves the camera or runs an idle animation loop.
  useEffect(() => {
    const timer = window.setTimeout(() => setSettledProgress(progress), 120);
    return () => clearTimeout(timer);
  }, [progress]);
  const settled = settledProgress === progress;
  const [painted, setPainted] = useState<{
    segment: number;
    portrait: boolean;
  }>();
  const [previous, setPrevious] = useState<number>();
  const [fallback, setFallback] = useState<number>();
  const [prepared, setPrepared] = useState([true, false, false]);
  const [buffering, setBuffering] = useState(false);
  const [codec, setCodec] = useState<ScrollCodec>();
  const [deliveryUnavailable, setDeliveryUnavailable] = useState(false);
  const position = useRef<{
    units: number;
    height: number;
    active: boolean;
  } | null>(null);
  const initialized = useRef(false);
  const [activated, setActivated] = useState(false);
  useEffect(() => {
    if (stillOnly || activated) return;
    // A direct business link must not spend bandwidth on an offscreen world.
    // Observe the sticky viewport, not its much taller scroll track.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.intersectionRatio >= 0.25)) {
          setActivated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(track.current!.querySelector(".scroll-stage")!);
    return () => observer.disconnect();
  }, [stillOnly, activated]);
  useEffect(() => {
    if (stillOnly || !activated) return;
    let active = true;
    Promise.all([selectScrollCodec(portrait), prepareMediaDelivery()]).then(
      ([value, ready]) => {
        if (!active) return;
        if (ready) setCodec(value);
        else setDeliveryUnavailable(true);
      },
    );
    return () => {
      active = false;
    };
  }, [portrait, stillOnly, activated]);

  useEffect(() => {
    const wrapper = track.current!;
    let disposed = false;
    let target = 0;
    let activeSegment = 0;
    let visibleSegment = -1;
    let timer = 0;
    let stall = 0;
    let blend = 0;
    const states = films.current.map((film) => ({
      film,
      seeking: false,
      decoded: Boolean(film && film.readyState >= 2),
      frame: 0,
      bootstrap: 0,
      raf: 0,
      requested: -1,
      painted: false,
      presentedTime: 0,
      primed: false,
      priming: false,
      failed: false,
    }));
    const prepare = (i: number) =>
      setPrepared((old) =>
        old[i] ? old : old.map((value, n) => value || n === i),
      );
    const duration = (i: number) => {
      const d = states[i]?.film?.duration;
      return d && Number.isFinite(d) ? d - 1 / 24 : 8;
    };
    const clearTimers = () => {
      clearTimeout(timer);
      clearTimeout(stall);
      timer = 0;
      stall = 0;
      setBuffering(false);
    };
    const showFallback = () => {
      clearTimers();
      setFallback(Math.round(target));
      setProgress(Math.round(target));
    };
    const armTimeouts = () => {
      if (stall) return;
      timer = window.setTimeout(() => setBuffering(true), 300);
      stall = window.setTimeout(() => {
        states[activeSegment].failed = true;
        showFallback();
      }, 6500);
    };
    const complete = (i: number, time: number) => {
      const state = states[i];
      state.frame = 0;
      if (disposed) return;
      state.painted = true;
      state.presentedTime = time;
      if (i !== activeSegment || state.failed) return;
      if (visibleSegment !== i) {
        setPrevious(visibleSegment < 0 ? undefined : visibleSegment);
        visibleSegment = i;
        clearTimeout(blend);
        blend = window.setTimeout(() => setPrevious(undefined), 160);
      }
      setPainted({ segment: i, portrait });
      setFallback(undefined);
      setProgress(i + clamp(time / duration(i)));
      clearTimers();
      if (state.film?.seeking || Math.abs(time - state.requested) > 1 / 48)
        watchFrame(i);
    };
    const watchFrame = (i: number) => {
      const state = states[i];
      if (
        state.film &&
        !state.frame &&
        "requestVideoFrameCallback" in state.film
      )
        state.frame = state.film.requestVideoFrameCallback((_now, metadata) =>
          complete(i, metadata.mediaTime),
        );
    };
    const seek = () => {
      const i = activeSegment;
      const state = states[i];
      const film = state?.film;
      if (stillOnly || deliveryUnavailable || state?.failed) {
        showFallback();
        return;
      }
      if (!activated) return;
      if (
        !film ||
        state.seeking ||
        disposed ||
        state.priming ||
        document.hidden
      )
        return;
      const local = clamp(target - i);
      const desired = Math.round(local * duration(i) * 24) / 24;
      if (!state.painted && target === 0) return;
      prepare(i);
      if (film.readyState < 1 || !state.decoded) {
        armTimeouts();
        return;
      }
      if (Math.abs(state.requested - desired) < 1 / 48) {
        // Reuse an already presented endpoint when crossing back to a retained movie.
        if (state.painted && visibleSegment !== i)
          complete(i, state.presentedTime);
        return;
      }
      state.seeking = true;
      state.requested = desired;
      armTimeouts();
      watchFrame(i);
      film.currentTime = Math.min(desired + 0.001, duration(i));
    };
    const scroll = () => {
      const h =
        wrapper.querySelector<HTMLElement>(".chapter")!.clientHeight ||
        innerHeight ||
        1;
      const units = -wrapper.getBoundingClientRect().top / h;
      position.current = {
        units,
        height: h,
        active: units >= 0 && units < 7.2,
      };
      // Keep the retained scene while reading business content. In particular,
      // hydration at #kontakt must not seek/download the final movie.
      if (!position.current.active) return;
      target = progressAt(units);
      activeSegment = Math.max(0, Math.min(2, Math.ceil(target) - 1));
      if (stillOnly) showFallback();
      else seek();
    };
    const resize = () => {
      const h =
        wrapper.querySelector<HTMLElement>(".chapter")!.clientHeight ||
        innerHeight ||
        1;
      const saved = position.current;
      if (saved?.active && saved.height !== h)
        window.scrollTo(
          0,
          scrollY + wrapper.getBoundingClientRect().top + saved.units * h,
        );
      scroll();
    };
    const error = (i: number) => {
      if (disposed) return;
      if (codec && codec !== "h264") {
        setCodec("h264");
        return;
      }
      states[i].failed = true;
      if (i === activeSegment) showFallback();
    };
    const handlers = states.map((state, i) => {
      const seeked = () => {
        if (disposed || !state.film || state.film.seeking) return;
        state.seeking = false;
        cancelAnimationFrame(state.raf);
        state.raf = requestAnimationFrame(() => {
          if (disposed) return;
          if (typeof state.film!.requestVideoFrameCallback !== "function") {
            state.raf = requestAnimationFrame(() => {
              complete(i, state.film!.currentTime);
              seek();
            });
          } else seek();
        });
      };
      const failed = () => error(i);
      const loaded = () => {
        if (typeof state.film?.requestVideoFrameCallback !== "function")
          state.decoded = true;
        if (state.failed) {
          state.failed = false;
          state.requested = -1;
        }
        scroll();
      };
      // WebKit may coalesce a seek made in loadeddata with the initial frame.
      // Let that first frame reach the compositor, then seek on the next tick.
      if (
        !state.decoded &&
        state.film &&
        typeof state.film.requestVideoFrameCallback === "function"
      ) {
        state.bootstrap = state.film.requestVideoFrameCallback(() => {
          if (disposed) return;
          state.bootstrap = 0;
          state.decoded = true;
          state.raf = requestAnimationFrame(() => {
            if (!disposed) scroll();
          });
        });
      }
      state.film?.addEventListener("loadedmetadata", scroll);
      state.film?.addEventListener("loadeddata", loaded);
      state.film?.addEventListener("canplay", seek);
      state.film?.addEventListener("seeked", seeked);
      state.film?.addEventListener("error", failed);
      return { seeked, failed, loaded };
    });
    const prime = (event: TouchEvent) => {
      if (event.touches.length !== 1 || stillOnly) return;
      const state = states[activeSegment];
      const film = state.film;
      if (!film?.getAttribute("src") || state.primed || state.failed) return;
      state.primed = true;
      state.priming = true;
      film
        .play()
        .then(() => {
          film.pause();
          state.priming = false;
          if (!disposed) seek();
        })
        .catch(() => {
          // A playback policy rejection is not evidence of an unsupported codec.
          state.priming = false;
          state.failed = true;
          if (!disposed && states[activeSegment] === state) showFallback();
        });
    };
    const hash = () => {
      const scene = scenes.findIndex((s) => `#${s.id}` === location.hash);
      if (scene < 0) return;
      setFallback(scene);
      setProgress(scene);
      const h =
        wrapper.querySelector<HTMLElement>(".chapter")!.clientHeight ||
        innerHeight ||
        1;
      window.scrollTo(
        0,
        scrollY + wrapper.getBoundingClientRect().top + anchors[scene] * h,
      );
      scroll();
    };
    const observer =
      stillOnly || !activated
        ? undefined
        : new IntersectionObserver(
            (entries) => {
              for (const entry of entries)
                if (entry.isIntersecting)
                  prepare(
                    Number((entry.target as HTMLElement).dataset.prepare),
                  );
            },
            // IntersectionObserver percentages use root WIDTH even vertically.
            // Use stage-height pixels so a wide desktop does not eagerly load
            // the second film before the visitor has moved.
            {
              rootMargin: `${Math.round(wrapper.querySelector<HTMLElement>(".chapter")!.clientHeight * 1.2)}px 0px`,
            },
          );
    wrapper
      .querySelectorAll("[data-prepare]")
      .forEach((el) => observer?.observe(el));
    wrapper.addEventListener("touchstart", prime, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", resize);
    window.addEventListener("hashchange", hash);
    document.addEventListener("visibilitychange", scroll);
    if (!initialized.current) {
      hash();
      initialized.current = true;
    }
    resize();
    return () => {
      disposed = true;
      clearTimeout(timer);
      clearTimeout(stall);
      clearTimeout(blend);
      observer?.disconnect();
      states.forEach((state, i) => {
        if (state.frame) state.film?.cancelVideoFrameCallback?.(state.frame);
        if (state.bootstrap)
          state.film?.cancelVideoFrameCallback?.(state.bootstrap);
        cancelAnimationFrame(state.raf);
        if (state.film && !state.film.paused) state.film.pause();
        state.film?.removeEventListener("loadedmetadata", scroll);
        state.film?.removeEventListener("loadeddata", handlers[i].loaded);
        state.film?.removeEventListener("canplay", seek);
        state.film?.removeEventListener("seeked", handlers[i].seeked);
        state.film?.removeEventListener("error", handlers[i].failed);
      });
      wrapper.removeEventListener("touchstart", prime);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", resize);
      window.removeEventListener("hashchange", hash);
      document.removeEventListener("visibilitychange", scroll);
    };
  }, [stillOnly, codec, portrait, deliveryUnavailable, activated]);
  const scene = fallback ?? 0;
  const visible =
    fallback === undefined && painted?.portrait === portrait
      ? painted.segment
      : -1;
  return (
    <div ref={track} className="scroll-track">
      {(settled ? Math.round(progress) !== 0 : progress >= 0.2975) && (
        <h1 className="sr-only">Od vizije do stvarnosti.</h1>
      )}
      {scenes.map((scene, i) => (
        <span
          key={scene.id}
          id={scene.id}
          className="scroll-anchor"
          style={{ top: `${anchors[i] * 100}svh` }}
        />
      ))}
      {starts.slice(1).map((start, i) => (
        <span
          key={start}
          data-prepare={i + 1}
          className="scroll-anchor"
          style={{ top: `${start * 100}svh` }}
        />
      ))}
      <section
        className="chapter scroll-stage"
        aria-label="Filmski put kroz Adduco"
      >
        <picture className="chapter-still">
          <source
            media="(max-aspect-ratio: 9/10)"
            srcSet={still(scene, true)}
          />
          <img
            className="scroll-still"
            src={still(scene, false)}
            alt=""
            loading={scene ? "lazy" : "eager"}
            fetchPriority={scene ? "low" : "high"}
          />
        </picture>
        {[0, 1, 2].map((i) => (
          <video
            key={i}
            ref={(el) => {
              films.current[i] = el;
            }}
            className="chapter-film scroll-film"
            data-scroll-film="scroll"
            data-segment={i}
            src={
              !stillOnly && prepared[i] && codec
                ? media(portrait, `${codec}.mp4`, i)
                : undefined
            }
            preload={!stillOnly && prepared[i] ? "auto" : "none"}
            aria-hidden="true"
            muted
            playsInline
            disablePictureInPicture
            style={{
              opacity:
                visible === i || (previous === i && visible >= 0) ? 1 : 0,
              zIndex: visible === i ? -2 : -3,
              animation:
                visible === i && previous !== undefined
                  ? "scene-settle 150ms linear both"
                  : undefined,
            }}
          />
        ))}
        <div className="chapter-wash" />
        <Captions progress={progress} enhanced={enhanced} settled={settled} />
        <p className="chapter-hint">Pomaknite se i zakoračite u priču ↓</p>
        <SceneNav progress={progress} />
        {buffering && (
          <div
            className="transition-progress"
            role="status"
            aria-label="Priprema prijelaza"
          />
        )}
      </section>
    </div>
  );
}
export function SceneNav({ progress }: { progress: number }) {
  return (
    <nav className="scene-nav" aria-label="Prizori">
      {scenes.map((scene, i) => (
        <a
          key={scene.id}
          href={`#${scene.id}`}
          aria-label={`0${i + 1} — ${scene.name}`}
          aria-current={Math.round(progress) === i ? "step" : undefined}
        >{`0${i + 1}`}</a>
      ))}
      <a className="scene-exit" href="#o-nama">
        O nama <Arrow diagonal />
      </a>
    </nav>
  );
}
export default function ScrollJourney() {
  const portrait = usePreference("(max-aspect-ratio: 9/10)");
  const reduced = usePreference("(prefers-reduced-motion: reduce)");
  const dataSaver =
    typeof navigator !== "undefined" &&
    Boolean(
      (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData,
    );
  return (
    <DirectScroll
      enhanced={portrait !== undefined}
      portrait={portrait === true}
      stillOnly={
        portrait === undefined || reduced === undefined || reduced || dataSaver
      }
    />
  );
}
