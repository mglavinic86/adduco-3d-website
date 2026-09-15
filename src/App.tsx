import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type MouseEvent,
  type CSSProperties,
} from "react";
import { journeyProgress } from "./journey";
import CinematicFilm from "./CinematicFilm";
import BusinessContent, { detailTitles, type Detail } from "./BusinessContent";
import { Arrow, Wordmark } from "./ui";
const chapters = [
  {
    id: "vizija",
    name: "Vizija",
    label: "Jasna ideja. Čvrst početak.",
    title: (
      <>
        Od vizije
        <br />
        <span>do stvarnosti.</span>
      </>
    ),
    caption:
      "Svaki projekt počinje jasnim razumijevanjem onoga što želite izgraditi.",
  },
  {
    id: "povjerenje",
    name: "Temelji povjerenja",
    label: "Odnos koji nosi projekt.",
    title: (
      <>
        Temelji
        <br />
        <span>povjerenja.</span>
      </>
    ),
    caption:
      "Povjerenje gradimo jasnim dogovorima i odgovornim pristupom vašem projektu.",
  },
  {
    id: "preciznost",
    name: "Preciznost izvedbe",
    label: "Svaki detalj ima svoju ulogu.",
    title: (
      <>
        Preciznost
        <br />
        <span>izvedbe.</span>
      </>
    ),
    caption: "Kvaliteta cjeline počinje pažnjom posvećenom svakom detalju.",
  },
  {
    id: "projekt",
    name: "Vaš sljedeći projekt",
    label: "Prostor za ono što dolazi.",
    title: (
      <>
        Vaša vizija.
        <br />
        <span>Naš sljedeći korak.</span>
      </>
    ),
    caption:
      "Podijelite svoju viziju s nama i napravimo prvi korak prema realizaciji.",
  },
];
function Experience({
  still,
  active,
  onFail,
}: {
  still: boolean;
  active: number;
  onFail: () => void;
}) {
  const [loadedStills, setLoadedStills] = useState([true, false, false, false]);
  const [shownStill, setShownStill] = useState(0);
  useEffect(() => {
    if (loadedStills[active]) setShownStill(active);
  }, [active, loadedStills]);
  return (
    <div className="world" aria-hidden="true">
      <div className="world-stills">
        {chapters.map(
          (c, i) =>
            (loadedStills[i] || active === i) && (
              <picture key={c.id}>
                <source
                  media="(max-width: 767px)"
                  srcSet={`/assets/chapter-mobile-${i}.webp`}
                />
                <source
                  media="(max-width: 1023px)"
                  srcSet={`/assets/chapter-tablet-${i}.webp`}
                />
                <img
                  src={`/assets/chapter-${i}.webp`}
                  alt=""
                  width="1600"
                  height="900"
                  fetchPriority={i === 0 ? "high" : undefined}
                  loading="eager"
                  onLoad={() => {
                    setLoadedStills((previous) =>
                      previous[i]
                        ? previous
                        : previous.map(
                            (loaded, index) => loaded || index === i,
                          ),
                    );
                    if (i === active) setShownStill(i);
                  }}
                  className={shownStill === i ? "active" : ""}
                />
              </picture>
            ),
        )}
      </div>
      {!still && <CinematicFilm onFail={onFail} />}
      <div className="world-wash" />
    </div>
  );
}
export default function App() {
  const [ready, setReady] = useState(false);
  const [still, setStill] = useState(true);
  const [progress, setProgress] = useState(0);
  const active = Math.round(progress);
  const [menu, setMenu] = useState(false);
  const [panel, setPanel] = useState<Detail | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const fail = useCallback(() => setStill(true), []);
  const closePanel = useCallback(() => {
    setPanel(null);
    history.replaceState(null, "", `#${chapters[active].id}`);
  }, [active]);
  useEffect(() => {
    setReady(true);
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const device = navigator as Navigator & {
      connection?: { saveData?: boolean };
      deviceMemory?: number;
    };
    setStill(
      mq.matches ||
        innerWidth < 768 ||
        (innerWidth < 1024 && matchMedia("(pointer: coarse)").matches) ||
        Boolean(device.connection?.saveData) ||
        (device.deviceMemory ?? 8) <= 4 ||
        new URLSearchParams(location.search).has("fallback"),
    );
    const motion = () => setStill(mq.matches);
    mq.addEventListener("change", motion);
    const route = () => {
      const id = location.hash.slice(1);
      setPanel(id in detailTitles ? (id as Detail) : null);
    };
    route();
    const restore = () => {
      const id = location.hash.slice(1);
      if (id in detailTitles) window.scrollTo({ top: 0, behavior: "instant" });
      else if (chapters.some((c) => c.id === id))
        document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
    };
    const initial = requestAnimationFrame(restore);
    window.addEventListener("load", restore, { once: true });
    window.addEventListener("hashchange", route);
    window.addEventListener("popstate", route);
    return () => {
      cancelAnimationFrame(initial);
      window.removeEventListener("load", restore);
      mq.removeEventListener("change", motion);
      window.removeEventListener("hashchange", route);
      window.removeEventListener("popstate", route);
    };
  }, []);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setProgress(journeyProgress());
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
    };
  }, []);
  const panelOpen = panel !== null;
  useEffect(() => {
    if (!panelOpen) return;
    const element = dialog.current!;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      opener.current?.focus({ preventScroll: true });
    };
  }, [panelOpen]);
  useEffect(() => {
    if (panel) {
      const section = document.getElementById(panel);
      const scroller = dialog.current?.querySelector(".panel-scroll");
      if (section && scroller)
        scroller.scrollTop +=
          section.getBoundingClientRect().top -
          scroller.getBoundingClientRect().top -
          24;
    }
  }, [panel]);
  useEffect(() => {
    if (!menu) return;
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [menu]);
  function navigate(event: MouseEvent<HTMLDivElement>) {
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      'a[href^="#"]',
    );
    if (
      !link ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const id = link.hash.slice(1);
    setMenu(false);
    if (id in detailTitles) {
      event.preventDefault();
      if (!panel)
        opener.current =
          menu && link.closest(".main-nav") ? menuButton.current : link;
      history.pushState(null, "", `#${id}`);
      setPanel(id as Detail);
    } else if (panel) setPanel(null);
  }
  return (
    <div className={`site ${ready ? "is-ready" : ""}`} onClick={navigate}>
      <a className="skip" href="#o-nama">
        Preskoči na sadržaj
      </a>
      <Experience still={still} active={active} onFail={fail} />
      <header className="header">
        <a href="#vizija" className="brand" aria-label="Adduco — početna">
          <Wordmark />
        </a>
        <nav
          className={`main-nav ${menu ? "is-open" : ""}`}
          id="main-nav"
          aria-label="Glavna navigacija"
        >
          <a href="#o-nama">O nama</a>
          <a href="#usluge">Usluge</a>
          <a href="#projekti">Projekti</a>
          <a href="#kontakt" className="mobile-contact">
            Kontakt
          </a>
        </nav>
        <a
          href="#kontakt"
          className="header-cta"
          aria-label="Razgovarajmo o vašem projektu"
        >
          <span>Razgovarajmo</span>
          <Arrow diagonal />
        </a>
        <button
          ref={menuButton}
          className="menu-toggle"
          aria-label={menu ? "Zatvori izbornik" : "Otvori izbornik"}
          aria-expanded={menu}
          aria-controls="main-nav"
          onClick={() => setMenu(!menu)}
        >
          <span>{menu ? "−" : "+"}</span>
        </button>
      </header>
      <main id="sadrzaj" className="journey">
        {chapters.map((chapter, i) => (
          <section
            key={chapter.id}
            id={chapter.id}
            className={`chapter ${i === 0 ? "hero" : ""}`}
            aria-labelledby={`title-${chapter.id}`}
          >
            <div
              className="chapter-content"
              inert={ready && Math.abs(progress - i) >= 0.48}
              style={
                {
                  "--caption-opacity": Math.max(
                    0,
                    Math.min(1, (0.48 - Math.abs(progress - i)) / 0.16),
                  ),
                  "--caption-drift": `${(progress - i) * -36}px`,
                } as CSSProperties
              }
            >
              <p className="eyebrow">
                {i === 0 ? "ADDUCO · GRAĐEVINARSTVO" : chapter.label}
              </p>
              {i === 0 ? (
                <h1 id={`title-${chapter.id}`}>{chapter.title}</h1>
              ) : (
                <h2 id={`title-${chapter.id}`}>{chapter.title}</h2>
              )}
              <p className="chapter-copy">
                {i === 0 ? (
                  <>
                    Visokogradnja i niskogradnja.
                    <br />
                    Betonski radovi i prometnice.
                  </>
                ) : (
                  chapter.caption
                )}
              </p>
              <a
                className="text-link"
                href={["#o-nama", "#priprema", "#projekti", "#kontakt"][i]}
              >
                {
                  [
                    "Upoznajte Adduco",
                    "Kako počinjemo",
                    "Pogledajte projekte",
                    "Razgovarajmo o vašem projektu",
                  ][i]
                }
                <Arrow diagonal />
              </a>
            </div>
          </section>
        ))}
      </main>
      {!ready && (
        <div className="business-library">
          <BusinessContent />
        </div>
      )}
      <div className="journey-meta">
        <span>METKOVIĆ, HRVATSKA</span>
        <a href={active === 3 ? "#vizija" : `#${chapters[active + 1].id}`}>
          {active === 3
            ? "Povratak na početak ↑"
            : "Pomaknite se i zakoračite u priču ↓"}
        </a>
      </div>
      <div className="journey-dock">
        <nav aria-label="Poglavlja priče">
          {chapters.map((c, i) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              aria-label={`${String(i + 1).padStart(2, "0")} ${c.name}`}
              aria-current={active === i ? "step" : undefined}
            >
              <span>0{i + 1}</span>
              <span className="dock-name">{c.name}</span>
              <i />
            </a>
          ))}
        </nav>
        <button className="mode-button" onClick={() => setStill(!still)}>
          <span className="mode-icon" aria-hidden="true">
            {still ? "▶" : "Ⅱ"}
          </span>
          <span>{still ? "Pokreni animaciju" : "Zaustavi animaciju"}</span>
        </button>
      </div>
      {ready && (
        <dialog
          ref={dialog}
          className="detail-panel"
          aria-label={panel ? detailTitles[panel] : undefined}
          onCancel={(e) => {
            e.preventDefault();
            closePanel();
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePanel();
          }}
        >
          <div className="panel-shell">
            <div className="panel-top">
              <span className="eyebrow">
                ADDUCO / {panel ? detailTitles[panel] : ""}
              </span>
              <button
                type="button"
                onClick={closePanel}
                className="panel-close"
              >
                Natrag u priču <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="panel-scroll">
              <BusinessContent active={panel} />
            </div>
          </div>
        </dialog>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "GeneralContractor",
            name: "ADDUCO d.o.o.",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Mlinska ulica 6",
              postalCode: "20350",
              addressLocality: "Metković",
              addressCountry: "HR",
            },
            identifier: "40912050957",
          }),
        }}
      />
    </div>
  );
}
