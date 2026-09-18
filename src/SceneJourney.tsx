import { useEffect, useRef, useState } from "react";
import { attachSceneGestures } from "./sceneGestures";
import { Arrow } from "./ui";
import { scenes, sceneMedia, sceneStill } from "./scenes";

type View = {
  scene: number;
  still: number;
  caption: number | null;
  film: string | null;
  buffering: boolean;
  stills: number[];
  settling: number | null;
};
const hashes = scenes.map((scene) => `#${scene.id}`);

/** Stationary scene anchors connected by complete native forward/reverse films. */
export default function SceneJourney() {
  const section = useRef<HTMLElement>(null);
  const videoRefs = useRef(new Map<string, HTMLVideoElement>());
  const request = useRef<(scene: number) => void>(() => {});
  const finishHandoff = useRef<(scene: number) => void>(() => {});
  const [view, setView] = useState<View>({
    scene: 0,
    still: 0,
    caption: 0,
    film: null,
    buffering: false,
    stills: [0],
    settling: null,
  });

  useEffect(() => {
    const stage = section.current!;
    const films = sceneMedia.map((clip) => ({
      ...clip,
      video: videoRefs.current.get(clip.key)!,
    }));
    const portrait = matchMedia("(max-aspect-ratio: 9/10)");
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const stillOnly = () => motion.matches || !!connection?.saveData;
    let scene = Math.max(0, hashes.indexOf(location.hash));
    let visibleStill = 0;
    const requestedStills = new Set([0, scene]);
    let caption: number | null = scene;
    let pending: {
      destination: number;
      clip: (typeof films)[number];
      started: boolean;
    } | null = null;
    let visibleFilm: string | null = null;
    let settling: number | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let bufferTimer: ReturnType<typeof setTimeout> | undefined;
    let buffering = false;
    let disposed = false;
    let settlement = 0;
    const stillCache = new Map<string, Promise<boolean>>();
    const update = () =>
      setView({
        scene,
        still: visibleStill,
        caption,
        film: visibleFilm,
        buffering,
        stills: [...requestedStills],
        settling,
      });
    const cancelHandoff = () => {
      // The decoded still is already available if a handoff is in progress.
      if (settling !== null) visibleFilm = null;
      settling = null;
      finishHandoff.current = () => {};
    };
    const prepareStill = (destination: number) => {
      const src = sceneStill(destination, portrait.matches);
      let ready = stillCache.get(src);
      if (!ready) {
        const image = new Image();
        image.fetchPriority = destination === 0 ? "high" : "low";
        image.src = src;
        ready = image.decode().then(
          () => true,
          () => false,
        );
        stillCache.set(src, ready);
      }
      return ready;
    };
    const clearBuffer = () => {
      clearTimeout(bufferTimer);
      bufferTimer = undefined;
      buffering = false;
    };
    const waitForFilm = () => {
      if (bufferTimer || buffering) return;
      bufferTimer = setTimeout(() => {
        bufferTimer = undefined;
        if (!disposed && pending) {
          buffering = true;
          update();
        }
      }, 300);
    };
    const prepare = (clip: (typeof films)[number]) => {
      const film = clip.video;
      const src = `/assets/transition-${clip.segment}/${portrait.matches ? "portrait" : "landscape"}-${clip.direction}.mp4`;
      if (!stillOnly() && film.getAttribute("src") !== src) {
        film.muted = true;
        film.preload = "auto";
        film.src = src;
      }
      return film;
    };
    const prepareAdjacent = () => {
      for (const clip of films) {
        if (
          (clip.direction === "forward" && clip.segment === scene + 1) ||
          (clip.direction === "reverse" && clip.segment === scene)
        )
          prepare(clip);
      }
    };
    const observeScene = () => {
      // Re-evaluate the new scene's intersection before preparing adjacent media.
      observer?.unobserve(stage);
      observer?.observe(stage);
    };
    const settle = (
      destination: number,
      film: string | null = null,
      changeHash = true,
    ) => {
      cancelHandoff();
      const revision = ++settlement;
      clearTimeout(timer);
      clearBuffer();
      pending = null;
      for (const { video } of films)
        if (video.hasAttribute("src")) video.pause();
      requestedStills.add(destination);
      const reveal = (ready: boolean) => {
        if (disposed || revision !== settlement) return;
        scene = destination;
        if (ready) visibleStill = destination;
        caption = destination;
        // Keep the previous visual if even the fallback image is unavailable.
        visibleFilm = film ?? (ready ? null : visibleFilm);
        // All six original-source reverse encodes need the measured join
        // compensation recorded in QA.md. Forward movies stay untouched.
        if (ready && film?.endsWith("-reverse") && !stillOnly()) {
          settling = destination;
          finishHandoff.current = (finishedScene) => {
            if (
              disposed ||
              revision !== settlement ||
              finishedScene !== destination
            )
              return;
            settling = null;
            visibleFilm = null;
            finishHandoff.current = () => {};
            update();
          };
        }
        if (changeHash && location.hash !== hashes[scene])
          history.replaceState(null, "", hashes[scene]);
        update();
        observeScene();
      };
      // Successful native playback already supplies its own decoded destination.
      // A slow optional still must not delay the next deliberate gesture.
      if (film) reveal(false);
      // Never remove the outgoing visual before the fallback is decoded.
      void prepareStill(destination).then(reveal);
    };
    request.current = (destination) => {
      if (disposed || pending || destination === scene || !scenes[destination])
        return;
      cancelHandoff();
      ++settlement;
      const direction = destination > scene ? "forward" : "reverse";
      if (stillOnly() || Math.abs(destination - scene) > 1) {
        settle(destination);
        return;
      }
      const clip = films.find(
        (clip) =>
          clip.segment === Math.max(scene, destination) &&
          clip.direction === direction,
      )!;
      const transition = { destination, clip, started: false };
      pending = transition;
      requestedStills.add(destination);
      void prepareStill(destination);
      waitForFilm();
      update();
      const film = prepare(clip);
      if ((!film.ended && film.currentTime > 0) || film.error) film.load();
      // Native play() restarts an ended movie. Interrupted movies are reset by load().
      timer = setTimeout(() => {
        if (pending === transition) settle(destination);
      }, 6500);
      void film.play().catch(() => {
        if (!disposed && pending === transition) settle(destination);
      });
    };
    const handlers = films.map((clip) => {
      const film = clip.video;
      const playing = () => {
        if (!pending || pending.clip !== clip) {
          film.pause();
          return;
        }
        visibleFilm = clip.key;
        clearBuffer();
        if (!pending.started) caption = null;
        pending.started = true;
        update();
      };
      const waiting = () => {
        if (pending?.clip === clip) waitForFilm();
      };
      const ended = () => {
        if (pending?.clip !== clip) return;
        settle(pending.destination, clip.key);
      };
      const progress = () => {
        // Reveal once halfway through actual native playback; never move its clock.
        if (
          pending?.clip !== clip ||
          visibleFilm !== clip.key ||
          caption !== null ||
          film.paused ||
          film.currentTime < 1.5
        )
          return;
        caption = pending.destination;
        history.replaceState(null, "", hashes[caption]);
        update();
      };
      const error = () => {
        if (pending?.clip === clip) settle(pending.destination);
      };
      film.addEventListener("playing", playing);
      film.addEventListener("waiting", waiting);
      film.addEventListener("ended", ended);
      film.addEventListener("timeupdate", progress);
      film.addEventListener("error", error);
      return () => {
        film.removeEventListener("playing", playing);
        film.removeEventListener("waiting", waiting);
        film.removeEventListener("ended", ended);
        film.removeEventListener("timeupdate", progress);
        film.removeEventListener("error", error);
      };
    });
    const interrupt = (
      destination = pending?.destination ?? scene,
      changeHash = false,
    ) => {
      const interrupted = pending?.clip.video;
      settle(destination, null, changeHash);
      if (interrupted) interrupted.load();
    };
    const hashChange = () => {
      const index = hashes.indexOf(location.hash);
      interrupt(index === -1 ? undefined : index);
    };
    const visibility = () => {
      if (document.hidden) interrupt();
    };
    const rotate = () => {
      interrupt(undefined, hashes.includes(location.hash) || !location.hash);
      for (const { video: film } of films) {
        if (!film.hasAttribute("src")) continue;
        film.removeAttribute("src");
        film.load();
      }
      observeScene();
    };
    const preference = () => {
      if (stillOnly()) interrupt();
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && pending) interrupt();
      // Preparing is independent of playback: viewport entry never starts a film.
      if (entry.isIntersecting) prepareAdjacent();
    });
    observer.observe(stage);
    const removeGestures = attachSceneGestures(
      stage,
      (direction) =>
        scene + direction >= 0 && scene + direction < scenes.length,
      () => !!pending,
      (direction) => request.current(scene + direction),
    );
    window.addEventListener("hashchange", hashChange);
    document.addEventListener("visibilitychange", visibility);
    portrait.addEventListener("change", rotate);
    motion.addEventListener("change", preference);
    // The opening film is eager; other scenes use the observer above.
    if (scene === 0) prepare(films[0]);
    if (scene === 0) update();
    else settle(scene, null, false);
    return () => {
      disposed = true;
      cancelHandoff();
      clearTimeout(timer);
      clearBuffer();
      removeGestures();
      observer?.disconnect();
      window.removeEventListener("hashchange", hashChange);
      document.removeEventListener("visibilitychange", visibility);
      portrait.removeEventListener("change", rotate);
      motion.removeEventListener("change", preference);
      handlers.forEach((remove) => remove());
      for (const { video: film } of films) {
        if (!film.hasAttribute("src")) continue;
        film.pause();
        film.removeAttribute("src");
        film.load();
      }
      request.current = () => {};
    };
  }, []);

  const displayedScene = view.caption ?? view.scene;
  return (
    <section
      id="vizija"
      className="chapter"
      ref={section}
      aria-label="Filmska priča Adduca"
    >
      {scenes.slice(1).map((scene) => (
        <span key={scene.id} id={scene.id} className="scene-anchor" />
      ))}
      {scenes.map((scene, index) => (
        <picture
          key={scene.id}
          className="chapter-still"
          data-visible={view.still === index}
          data-settling={view.settling === index}
          onAnimationEnd={(event) => {
            if (event.animationName === "scene-settle")
              finishHandoff.current(index);
          }}
          aria-hidden="true"
        >
          <source
            media="(max-aspect-ratio: 9/10)"
            srcSet={
              view.stills.includes(index) ? sceneStill(index, true) : undefined
            }
          />
          <img
            src={
              view.stills.includes(index) ? sceneStill(index, false) : undefined
            }
            alt=""
            width="1920"
            height="1080"
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "low"}
          />
        </picture>
      ))}
      {sceneMedia.map((clip) => (
        <video
          key={clip.key}
          ref={(element) => {
            if (element) videoRefs.current.set(clip.key, element);
            else videoRefs.current.delete(clip.key);
          }}
          className="chapter-film"
          data-transition={clip.segment}
          data-direction={clip.direction}
          data-visible={view.film === clip.key}
          muted
          playsInline
          preload="none"
          disablePictureInPicture
          aria-hidden="true"
          tabIndex={-1}
        />
      ))}
      <div className="chapter-wash" />
      <div
        className="transition-progress"
        role="progressbar"
        aria-label="Učitavanje prijelaza"
        hidden={!view.buffering}
      />
      {scenes.map((scene, index) => {
        const Heading = index === 0 ? "h1" : "h2";
        return (
          <div
            key={scene.id}
            className="chapter-content"
            data-visible={view.caption === index}
            inert={view.caption !== index}
            aria-hidden={view.caption !== index}
          >
            <p className="eyebrow">{scene.label}</p>
            <Heading>
              {scene.title[0]}
              <br />
              <span>{scene.title[1]}</span>
            </Heading>
            <p className="chapter-copy">
              {scene.copy.map((line, i) => (
                <span key={line}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </p>
            <a className="text-link" href={scene.href}>
              {scene.action} <Arrow diagonal />
            </a>
          </div>
        );
      })}
      <p className="chapter-hint">
        {displayedScene < scenes.length - 1
          ? "Pomaknite se i zakoračite u priču"
          : "Nastavite i upoznajte naš rad"}{" "}
        <span aria-hidden="true">↓</span>
      </p>
      <nav className="scene-nav" aria-label="Scene filmske priče">
        {scenes.map(({ name }, index) => (
          <a
            key={name}
            href={hashes[index]}
            aria-label={`${index + 1} — ${name}`}
            aria-current={displayedScene === index ? "step" : undefined}
            onClick={(event) => {
              if (
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              event.preventDefault();
              request.current(index);
            }}
          >
            0{index + 1}
          </a>
        ))}
        <a className="scene-exit" href="#o-nama">
          O nama <Arrow diagonal />
        </a>
      </nav>
    </section>
  );
}
