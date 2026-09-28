import { useEffect, useRef, useState } from "react";
import { mountScrollFilm } from "./ScrollFilm";
const count = 481;
export default function SceneJourney() {
  const section = useRef<HTMLElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false),
    [enhanced, setEnhanced] = useState(false),
    [failed, setFailed] = useState(false),
    [frame, setFrame] = useState(0);
  useEffect(() => {
    const stage = section.current!,
      surface = canvas.current!;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const portrait = matchMedia("(max-aspect-ratio: 9/10)");
    const saveData = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection?.saveData;
    let store: ReturnType<typeof mountScrollFilm> | undefined;
    let raf = 0,
      active = true,
      lastWidth = innerWidth;
    let progress = 0,
      stableHeight = innerHeight;
    let observer: IntersectionObserver | undefined;
    let firstLayout = true,
      layoutFrame = 0;
    stage.style.setProperty("--story-height", `${stableHeight}px`);
    function update() {
      raf = 0;
      const rect = stage.getBoundingClientRect();
      progress = Math.max(
        0,
        Math.min(1, -rect.top / (stage.offsetHeight - stableHeight || 1)),
      );
      store?.seek(Math.round(progress * (count - 1)));
    }
    function scroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }
    function configure() {
      cancelAnimationFrame(layoutFrame);
      observer?.disconnect();
      store?.dispose();
      store = undefined;
      document.documentElement.dataset.storyMotion = String(
        !motion.matches && !saveData,
      );
      if (motion.matches || saveData) {
        setEnhanced(false);
        setReady(false);
        setFrame(0);
        return;
      }
      setEnhanced(true);
      setFailed(false);
      // Retain the previous canvas until the matching new orientation is decoded.
      const start = () => {
        if (store || !active) return;
        store = mountScrollFilm(
          surface,
          `/assets/story-hd/${portrait.matches ? "portrait" : "landscape"}`,
          (i) => {
            if (!active) return;
            setFrame(i);
            setReady(true);
            setFailed(false);
          },
          () => setFailed(true),
        );
        update();
      };
      // Business deep links must not pay for a film they never enter.
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) start();
      });
      const anchor = firstLayout
        ? document.getElementById(location.hash.slice(1))
        : null;
      firstLayout = false;
      layoutFrame = requestAnimationFrame(() => {
        if (anchor?.closest(".business-content")) anchor.scrollIntoView();
        observer?.observe(stage);
        update();
      });
    }
    function resize() {
      if (innerWidth === lastWidth) return;
      const rect = stage.getBoundingClientRect(),
        inside = rect.top <= 0 && rect.bottom >= stableHeight;
      const top = rect.top + scrollY;
      lastWidth = innerWidth;
      stableHeight = innerHeight;
      stage.style.setProperty("--story-height", `${stableHeight}px`);
      if (inside)
        window.scrollTo({
          top: top + progress * (stage.offsetHeight - stableHeight),
          behavior: "instant",
        });
      configure();
    }
    configure();
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", resize);
    motion.addEventListener("change", configure);
    portrait.addEventListener("change", configure);
    return () => {
      active = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(layoutFrame);
      store?.dispose();
      observer?.disconnect();
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", resize);
      motion.removeEventListener("change", configure);
      portrait.removeEventListener("change", configure);
    };
  }, []);
  const caption =
    frame < 96
      ? "Sve počinje temeljem."
      : frame < 192
        ? "Snaga je u detalju."
        : frame < 264
          ? "Oblik dobiva čvrstoću."
          : frame < 384
            ? "Preciznost u svakom spoju."
            : frame < 444
              ? "Od konstrukcije do cjeline."
              : "Vaš projekt počinje razgovorom.";
  return (
    <section
      tabIndex={-1}
      id="vizija"
      ref={section}
      className={`construction-story ${enhanced ? "is-enhanced" : ""}`}
      data-reveal={frame >= 120}
      aria-label="Filmska priča Adduca"
    >
      <div className="story-stage">
        <picture className="story-poster" aria-hidden="true">
          <source
            media="(max-aspect-ratio: 9/10)"
            srcSet="/assets/story-hd/portrait.webp"
          />
          <img
            src="/assets/story-hd/landscape.webp"
            width="1920"
            height="1080"
            alt=""
            fetchPriority="high"
            {...{ elementtiming: "story-poster" }}
          />
        </picture>
        <canvas
          ref={canvas}
          className="story-canvas"
          data-ready={ready}
          aria-hidden="true"
        />
        <div className="story-shade" />
        <div className="story-copy">
          <div style={{ opacity: Math.max(0, 1 - frame / 120) }}>
            <p className="eyebrow">ADDUCO · GRAĐEVINARSTVO</p>
            <h1>
              Od vizije
              <br />
              do stvarnosti.
            </h1>
          </div>
          <p className="story-caption">{caption}</p>
          <a className="text-link" href="#o-nama">
            Upoznajte Adduco <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="story-bottom">
          <span>
            {failed
              ? "Prikaz je privremeno nedostupan."
              : enhanced
                ? "Konceptualna vizualizacija · pomicanjem upravljajte prizorom"
                : "Konceptualni prikaz gradnje"}
          </span>
          <a href="#o-nama">Preskoči priču ↗</a>
        </div>
        <div
          className="story-progress"
          aria-hidden="true"
          style={{ transform: `scaleX(${frame / (count - 1)})` }}
        />
      </div>
    </section>
  );
}
