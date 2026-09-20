import ProjectRecords from "./ProjectRecords";
import InquiryForm from "./InquiryForm";
import { Arrow, Wordmark } from "./ui";
export default function BusinessContent() {
  return (
    <>
      <section className="editorial intro-section" id="o-nama">
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
      </section>
      <section className="editorial services" id="usluge">
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
      </section>
      <section className="editorial process-section" id="priprema">
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
        <ProjectRecords />
      </section>
      <section className="contact-section" id="kontakt">
        <p className="eyebrow">KONTAKT</p>
        <div className="contact-grid">
          <div className="contact-intro">
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
