import { useEffect, useRef, useState } from "react";
import { attachSceneGestures } from "./sceneGestures";
import { Arrow } from "./ui";
import { scenes, sceneMedia, sceneStill } from "./scenes";

type View = { scene: number; busy: boolean; film: string | null };
const hashes = scenes.map((scene) => `#${scene.id}`);

/** Stationary scene anchors connected by complete native forward/reverse films. */
export default function SceneJourney() {
  const section = useRef<HTMLElement>(null);
  const videoRefs = useRef(new Map<string, HTMLVideoElement>());
  const request = useRef<(scene: number) => void>(() => {});
  const [view, setView] = useState<View>({ scene: 0, busy: false, film: null });

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
    let pending: { destination: number; clip: (typeof films)[number] } | null =
      null;
    let visibleFilm: string | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    const update = () => setView({ scene, busy: !!pending, film: visibleFilm });
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
      clearTimeout(timer);
      pending = null;
      for (const { video } of films)
        if (video.hasAttribute("src")) video.pause();
      scene = destination;
      visibleFilm = film;
      if (changeHash) history.replaceState(null, "", hashes[scene]);
      update();
      observeScene();
    };
    request.current = (destination) => {
      if (disposed || pending || destination === scene || !scenes[destination])
        return;
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
      const transition = { destination, clip };
      pending = transition;
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
        update();
      };
      const ended = () => {
        if (pending?.clip !== clip) return;
        settle(pending.destination, clip.key);
      };
      const error = () => {
        if (pending?.clip === clip) settle(pending.destination);
      };
      film.addEventListener("playing", playing);
      film.addEventListener("ended", ended);
      film.addEventListener("error", error);
      return () => {
        film.removeEventListener("playing", playing);
        film.removeEventListener("ended", ended);
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
    update();
    return () => {
      disposed = true;
      clearTimeout(timer);
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
          data-visible={view.scene === index}
          aria-hidden="true"
        >
          <source
            media="(max-aspect-ratio: 9/10)"
            srcSet={sceneStill(index, true)}
          />
          <img
            src={sceneStill(index, false)}
            alt=""
            width="1920"
            height="1080"
            fetchPriority={index === 0 ? "high" : "auto"}
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
      {scenes.map((scene, index) => {
        const Heading = index === 0 ? "h1" : "h2";
        return (
          <div
            key={scene.id}
            className="chapter-content"
            data-visible={view.scene === index && !view.busy}
            inert={view.scene !== index || view.busy}
            aria-hidden={view.scene !== index || view.busy}
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
        {view.scene < scenes.length - 1
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
            aria-current={view.scene === index ? "step" : undefined}
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
