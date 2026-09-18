import { useEffect, useRef, useState } from "react";
import SceneJourney from "./SceneJourney";
import BusinessContent from "./BusinessContent";
import { Arrow, Wordmark } from "./ui";

export default function App() {
  const [menu, setMenu] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!menu) return;
    navigation.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenu(false);
    };
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", outside);
    };
  }, [menu]);
  return (
    <div className="site">
      <a className="skip" href="#o-nama">
        Preskoči na sadržaj
      </a>
      <header
        className="header"
        ref={headerRef}
        onClick={(event) => {
          if ((event.target as Element).closest("a")) setMenu(false);
        }}
      >
        <a href="#vizija" className="brand" aria-label="Adduco — početna">
          <Wordmark />
        </a>
        <nav
          ref={navigation}
          className={`main-nav ${menu ? "is-open" : ""}`}
          id="main-nav"
          aria-label="Glavna navigacija"
        >
          <span className="menu-heading" aria-hidden="true">
            ADDUCO / ISTRAŽITE
          </span>
          <a href="#o-nama">
            <span className="menu-index" aria-hidden="true">
              01
            </span>
            <span>O nama</span>
            <Arrow diagonal />
          </a>
          <a href="#usluge">
            <span className="menu-index" aria-hidden="true">
              02
            </span>
            <span>Usluge</span>
            <Arrow diagonal />
          </a>
          <a href="#projekti">
            <span className="menu-index" aria-hidden="true">
              03
            </span>
            <span>Projekti</span>
            <Arrow diagonal />
          </a>
          <a href="#kontakt" className="mobile-contact">
            <span className="menu-index" aria-hidden="true">
              04
            </span>
            <span>Kontakt</span>
            <Arrow diagonal />
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
          <span aria-hidden="true">+</span>
        </button>
      </header>
      <main id="sadrzaj">
        <SceneJourney />
        <div className="business-content">
          <BusinessContent />
        </div>
      </main>
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
