import InquiryForm from "./InquiryForm";
import { Arrow, Wordmark } from "./ui";
export const detailTitles = {
  "o-nama": "O nama",
  usluge: "Usluge",
  priprema: "Prije prvog razgovora",
  projekti: "Projekti",
  kontakt: "Kontakt",
};
export type Detail = keyof typeof detailTitles;
export default function BusinessContent({
  active,
}: {
  active?: Detail | null;
}) {
  return (
    <>
      <section
        hidden={
          active !== undefined && active !== "o-nama" && active !== "usluge"
        }
        className="editorial intro-section"
        id="o-nama"
      >
        <div className="section-label">01 — VIZIJA</div>
        <div className="intro-grid">
          <h2>
            Dobro izgrađeno
            <br />
            počinje <em>dobro promišljenim.</em>
          </h2>
          <div>
            <p className="body-large">
              Svaki projekt počinje jasnim razumijevanjem onoga što želite
              izgraditi.
            </p>
            <p>
              Adduco d.o.o. je građevinska tvrtka iz Metkovića. Naš rad obuhvaća
              visokogradnju, niskogradnju, betonske i asfalterske radove te
              gradnju cesta.
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
              name: "Visokogradnja",
              text: "Izvedba objekata i njihovih nosivih konstrukcija.",
            },
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
          <a href="#priprema" className="text-link">
            Kako pripremiti projekt <Arrow diagonal />
          </a>
        </div>
      </section>
      <section
        hidden={active !== undefined && active !== "priprema"}
        className="editorial process-section"
        id="priprema"
      >
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
        hidden={active !== undefined && active !== "projekti"}
        className="editorial projects-section"
        id="projekti"
      >
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
        hidden={active !== undefined && active !== "kontakt"}
        className="contact-section"
        id="kontakt"
      >
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
    </>
  );
}
