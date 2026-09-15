import { useEffect, useRef, useState, useCallback } from "react";
import InquiryForm from "./InquiryForm";

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
export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}
function Wordmark() {
  return (
    <span className="brand-art">
      <img
        src="/assets/adduco-logo.webp"
        alt="Adduco"
        width="1008"
        height="209"
      />
    </span>
  );
}
function Experience({
  still,
  active,
  onFail,
}: {
  still: boolean;
  active: number;
  onFail: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (still || !host.current) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    const parent = host.current;
    const timeout = window.setTimeout(() => {
      import("./scene")
        .then(async ({ mountGarden }) => {
          if (disposed) return;
          cleanup = await mountGarden(parent, () => {
            if (!disposed) onFail();
          });
          if (disposed) cleanup?.();
        })
        .catch(() => {
          if (!disposed) onFail();
        });
    }, 120);
    return () => {
      disposed = true;
      clearTimeout(timeout);
      cleanup?.();
    };
  }, [still, onFail]);
  return (
    <div className="world" aria-hidden="true">
      <div className="world-stills">
        {chapters.map((c, i) => (
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
              height="1000"
              fetchPriority={i === 0 ? "high" : undefined}
              loading={i === 0 ? "eager" : "lazy"}
              className={active === i ? "active" : ""}
            />
          </picture>
        ))}
      </div>
      <div ref={host} className="world-canvas" />
      <div className="world-wash" />
    </div>
  );
}
export default function App() {
  const [still, setStill] = useState(true);
  const [active, setActive] = useState(0);
  const [menu, setMenu] = useState(false);
  const [atContact, setAtContact] = useState(false);
  const fail = useCallback(() => setStill(true), []);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = navigator as Navigator & {
      connection?: { saveData?: boolean };
      deviceMemory?: number;
    };
    setStill(
      mq.matches ||
        innerWidth < 1024 ||
        Boolean(connection.connection?.saveData) ||
        (connection.deviceMemory ?? 8) <= 4 ||
        new URLSearchParams(location.search).has("fallback"),
    );
    const motion = () => setStill(mq.matches);
    mq.addEventListener("change", motion);
    let ticking = false;
    const update = () => {
      const checkpoint = scrollY + innerHeight * 0.5;
      let n = 0;
      chapters.forEach((c, i) => {
        const el = document.getElementById(c.id);
        if (el && el.offsetTop <= checkpoint) n = i;
      });
      setActive(n);
      const contact = document.getElementById("kontakt");
      setAtContact(
        Boolean(
          contact && contact.getBoundingClientRect().top < innerHeight * 0.55,
        ),
      );
      ticking = false;
    };
    const scroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    update();
    return () => {
      mq.removeEventListener("change", motion);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
    };
  }, []);
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
  return (
    <>
      <a className="skip" href="#sadrzaj">
        Preskoči na sadržaj
      </a>
      <Experience still={still} active={active} onFail={fail} />
      <header className={`header ${atContact ? "on-dark" : ""}`}>
        <a href="#vizija" className="brand" aria-label="Adduco — početna">
          <Wordmark />
        </a>
        <nav
          className={`main-nav ${menu ? "is-open" : ""}`}
          id="main-nav"
          aria-label="Glavna navigacija"
          onClick={() => setMenu(false)}
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
          <span className="cta-full">Razgovarajmo o vašem projektu</span>
          <span className="cta-short">Razgovarajmo</span>
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
          {menu ? "Zatvori" : "Izbornik"}
          <span>{menu ? "−" : "+"}</span>
        </button>
      </header>
      <main id="sadrzaj">
        <section
          className="chapter hero"
          id="vizija"
          aria-labelledby="title-vizija"
        >
          <div className="chapter-content">
            <p className="eyebrow">
              <span className="tiny-line" />
              ADDUCO · GRAĐEVINARSTVO
            </p>
            <h1 id="title-vizija">{chapters[0].title}</h1>
            <p className="hero-intro">
              Niskogradnja, betonski radovi i prometnice.
              <br />
              Za privatne i poslovne investitore.
            </p>
            <a href="#usluge" className="text-link">
              Upoznajte Adduco <Arrow />
            </a>
          </div>
          <div className="hero-bottom">
            <p>
              Gradimo ono
              <br />
              <strong>što ostaje.</strong>
            </p>
            <a className="scroll-cue" href="#o-nama">
              <span className="scroll-line" />
              Pomaknite se i otkrijte našu priču
            </a>
            <span className="location">METKOVIĆ, HRVATSKA</span>
          </div>
          <span className="art-caption">01 / VIZIJA</span>
        </section>
        <section className="editorial intro-section" id="o-nama">
          <div className="section-label">01 — VIZIJA</div>
          <div className="intro-grid">
            <h2>
              Dobro izgrađeno
              <br />
              počinje <em>dobro promišljenim.</em>
            </h2>
            <div>
              <p className="body-large">{chapters[0].caption}</p>
              <p>
                Adduco d.o.o. je građevinska tvrtka iz Metkovića. Naš rad
                obuhvaća niskogradnju, betonske i asfalterske radove te gradnju
                cesta.
              </p>
              <a href="#kontakt" className="text-link">
                Razgovarajmo o vašem projektu <Arrow diagonal />
              </a>
            </div>
          </div>
          <div className="services" id="usluge">
            <div className="section-label">ŠTO RADIMO</div>
            {[
              {
                name: "Niskogradnja",
                text: "Zemljani radovi i priprema terena za infrastrukturu.",
              },
              {
                name: "Betonski radovi",
                text: "Betoniranje i izvedba betonskih konstrukcijskih elemenata.",
              },
              {
                name: "Asfaltiranje i prometnice",
                text: "Priprema i asfaltiranje površina te gradnja cesta.",
              },
            ].map((s, i) => (
              <a className="service" key={s.name} href="#kontakt">
                <span className="service-number">0{i + 1}</span>
                <h3>{s.name}</h3>
                <p>{s.text}</p>
                <Arrow diagonal />
              </a>
            ))}
            <p className="service-note">
              Opseg radova dogovaramo prema potrebama vašeg projekta.
            </p>
          </div>
        </section>
        <section
          className="chapter"
          id="povjerenje"
          aria-labelledby="title-povjerenje"
        >
          <div className="chapter-content">
            <p className="eyebrow">02 / {chapters[1].label}</p>
            <h2 id="title-povjerenje">{chapters[1].title}</h2>
            <p className="chapter-copy">{chapters[1].caption}</p>
          </div>
          <span className="art-caption">DVIJE FORME. JEDAN OSLONAC.</span>
        </section>
        <section className="editorial process-section">
          <div className="section-label">PRIJE PRVOG RAZGOVORA</div>
          <div className="section-heading">
            <h2>
              Jasan početak.
              <br />
              <em>Čvrst oslonac za dalje.</em>
            </h2>
            <p>
              Što nam više kažete o svom projektu, to razgovor može biti
              konkretniji. Krenimo od tri jednostavna koraka.
            </p>
          </div>
          <div className="process-grid">
            {[
              {
                title: "Podijelite ideju",
                text: "Recite nam gdje planirate graditi, čemu je projekt namijenjen i što želite postići.",
              },
              {
                title: "Pripremite osnovne podatke",
                text: "Prikupite dostupnu dokumentaciju, okvirni budžet i željeni vremenski plan.",
              },
              {
                title: "Razjasnimo sljedeći korak",
                text: "Razgovarajmo o potrebnom opsegu radova, otvorenim pitanjima i mogućnostima suradnje.",
              },
            ].map((s, i) => (
              <article key={s.title}>
                <span className="step-no">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
          <div className="download-row">
            <div>
              <span className="eyebrow">DOBRA PRIPREMA ČINI RAZLIKU</span>
              <h3>Vaš projekt, na jednom listu.</h3>
              <p>
                Kontrolna lista za pripremu razgovora o građevinskom projektu.
              </p>
            </div>
            <a
              className="outline-button"
              href="/kontrolna-lista-adduco.pdf"
              download
            >
              Preuzmite kontrolnu listu <span>PDF ↓</span>
            </a>
          </div>
        </section>
        <section
          className="chapter"
          id="preciznost"
          aria-labelledby="title-preciznost"
        >
          <div className="chapter-content">
            <p className="eyebrow">03 / {chapters[2].label}</p>
            <h2 id="title-preciznost">{chapters[2].title}</h2>
            <p className="chapter-copy">{chapters[2].caption}</p>
            <a href="#projekti" className="text-link">
              Pogledajte projekte <Arrow />
            </a>
          </div>
          <span className="art-caption">DETALJI KOJI DRŽE CJELINU.</span>
        </section>
        <section className="editorial projects-section" id="projekti">
          <div className="section-label">IZ NAŠEG RADA</div>
          <div className="section-heading">
            <h2>
              Stvarni projekti.
              <br />
              <em>Konkretna uloga.</em>
            </h2>
            <p>
              Od lokalnih prometnica do infrastrukturnih zahvata. Upoznajte
              projekte u kojima je sudjelovao Adduco.
            </p>
          </div>
          <article className="project-record">
            <div className="project-index">
              01<span>METKOVIĆ</span>
            </div>
            <div>
              <span className="eyebrow">PROMETNA INFRASTRUKTURA</span>
              <h3>
                Rekonstrukcija
                <br />
                Mlinske ulice
              </h3>
              <p>
                Grad Metković u svojem pregledu projekata navodi Adduco kao
                ugovorenog izvođača rekonstrukcije Mlinske ulice, od spoja s
                Industrijskom ulicom do graničnog prijelaza Unka.
              </p>
              <a
                className="text-link small"
                href="https://grad-metkovic.hr/wp-content/uploads/2025/03/Zavrseni-i-odobreni-projekti-u-periodu-od-2021.-2025.-godine.pdf"
                target="_blank"
                rel="noreferrer"
              >
                Projekt u izvješću Grada <Arrow diagonal />
              </a>
            </div>
            <dl>
              <dt>Uloga</dt>
              <dd>Ugovoreni izvođač radova</dd>
              <dt>Naručitelj</dt>
              <dd>Grad Metković</dd>
              <dt>Izvor</dt>
              <dd>Gradski pregled projekata 2021.–2025.</dd>
            </dl>
          </article>
          <article className="project-record">
            <div className="project-index">
              02<span>RABA — DUBA</span>
            </div>
            <div>
              <span className="eyebrow">KOMUNIKACIJSKA INFRASTRUKTURA</span>
              <h3>
                Infrastruktura za
                <br />
                bolju povezanost
              </h3>
              <p>
                U obavijesti iz svibnja 2026. Adduco i Konektor navedeni su kao
                izvođači iskopa kabelske kanalizacije na dionici Raba–Duba za
                razvoj širokopojasne mreže.
              </p>
              <a
                className="text-link small"
                href="https://metkovic-news.com/news/nocno-zatvaranje-ceste-na-dionici-raba-duba-zbog-radova-na-sirokopojasnoj-mrezi/"
                target="_blank"
                rel="noreferrer"
              >
                Pročitajte obavijest o radovima <Arrow diagonal />
              </a>
            </div>
            <dl>
              <dt>Uloga</dt>
              <dd>Sudjelovanje u izvođenju iskopa</dd>
              <dt>Zahvat</dt>
              <dd>Kabelska kanalizacija</dd>
              <dt>Izvor</dt>
              <dd>Metković NEWS, 20. 5. 2026.</dd>
            </dl>
          </article>
        </section>
        <section
          className="chapter final-chapter"
          id="projekt"
          aria-labelledby="title-projekt"
        >
          <div className="chapter-content">
            <p className="eyebrow">04 / {chapters[3].label}</p>
            <h2 id="title-projekt">{chapters[3].title}</h2>
            <p className="chapter-copy">{chapters[3].caption}</p>
            <a href="#kontakt" className="solid-button">
              Razgovarajmo o vašem projektu <Arrow diagonal />
            </a>
          </div>
          <span className="art-caption">
            SLJEDEĆE POGLAVLJE POČINJE S VAMA.
          </span>
        </section>
        <section className="contact-section" id="kontakt">
          <p className="eyebrow">KONTAKT</p>
          <div className="contact-grid">
            <div>
              <h2>
                Što želite
                <br />
                <em>izgraditi?</em>
              </h2>
              <p>
                Recite nam nešto o svom projektu.
                <br />
                Prvi korak je razgovor.
              </p>
              <a className="contact-email" href="mailto:adduco@adduco.hr">
                adduco@adduco.hr <Arrow diagonal />
              </a>
              <a className="contact-phone" href="tel:+38520681566">
                +385 (0)20 681 566
              </a>
              <address>
                Mlinska ulica 6<br />
                20350 Metković, Hrvatska
              </address>
            </div>
            <div id="inquiry-form">
              <InquiryForm />
            </div>
          </div>
          <footer>
            <a href="#vizija" aria-label="Adduco — povratak na početak">
              <Wordmark />
            </a>
            <span>ADDUCO d.o.o. · OIB 40912050957</span>
            <a
              href="https://infobiz.fina.hr/subjekt/adduco-d-o-o/OIB-40912050957"
              target="_blank"
              rel="noreferrer"
            >
              Podaci o društvu ↗
            </a>
            <span>© {new Date().getFullYear()} Adduco</span>
          </footer>
        </section>
      </main>
      <div className={`journey-dock ${atContact ? "dock-hidden" : ""}`}>
        <nav aria-label="Poglavlja priče">
          {chapters.map((c, i) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              aria-current={active === i ? "step" : undefined}
            >
              <span>0{i + 1}</span>
              <span className="dock-name">{c.name}</span>
              <i />
            </a>
          ))}
        </nav>
        <button
          className="mode-button"
          aria-pressed={still}
          onClick={() => setStill(!still)}
        >
          <span className="mode-icon">{still ? "Ⅱ" : "◌"}</span>
          <span>Mirni prikaz</span>
        </button>
      </div>
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
    </>
  );
}
