import { useRef, useState, type FormEvent } from "react";
type Field = "name" | "email" | "location" | "message";
export default function InquiryForm() {
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [draft, setDraft] = useState<{ body: string; href: string } | null>(
    null,
  );
  const resultRef = useRef<HTMLDivElement>(null);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const values = Object.fromEntries(
      ["name", "email", "location", "message"].map((k) => [
        k,
        String(data.get(k) ?? "").trim(),
      ]),
    ) as Record<Field, string>;
    const next: Partial<Record<Field, string>> = {};
    if (!values.name) next.name = "Unesite svoje ime.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      next.email = "Unesite ispravnu adresu e-pošte.";
    if (values.message.length < 10)
      next.message = "Opišite projekt u najmanje 10 znakova.";
    setErrors(next);
    if (Object.keys(next).length) {
      setDraft(null);
      (
        form.elements.namedItem(Object.keys(next)[0]) as HTMLInputElement
      )?.focus();
      return;
    }
    const body = `Poštovani,\n\n${values.message}\n\nLokacija projekta: ${values.location || "Za dogovor"}\nIme i prezime: ${values.name}\nE-pošta: ${values.email}\n\nSrdačan pozdrav,\n${values.name}`;
    setDraft({
      body,
      href: `mailto:adduco@adduco.hr?subject=${encodeURIComponent("Upit o građevinskom projektu")}&body=${encodeURIComponent(body)}`,
    });
    requestAnimationFrame(() => resultRef.current?.focus());
  }
  const field = (
    name: Field,
    label: string,
    placeholder: string,
    type = "text",
  ) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {name === "message" ? (
        <textarea
          id={name}
          name={name}
          required
          minLength={10}
          maxLength={1200}
          placeholder={placeholder}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={name === "name" || name === "email"}
          maxLength={name === "email" ? 254 : 120}
          autoComplete={
            name === "name" ? "name" : name === "email" ? "email" : "off"
          }
          placeholder={placeholder}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
        />
      )}
      {errors[name] && (
        <span className="field-error" id={`${name}-error`} role="alert">
          {errors[name]}
        </span>
      )}
    </div>
  );
  return (
    <form
      className="inquiry-form"
      onSubmit={submit}
      onChange={() => {
        if (draft) setDraft(null);
      }}
      noValidate
    >
      {field("name", "Ime i prezime *", "Vaše ime i prezime")}
      <div className="field-row">
        {field("email", "E-pošta *", "vasa@adresa.hr", "email")}
        {field("location", "Lokacija projekta", "Mjesto ili grad")}
      </div>
      {field(
        "message",
        "O vašem projektu *",
        "Što planirate graditi? Navedite lokaciju, okvirni rok i dostupnu dokumentaciju.",
      )}
      <p className="form-note">
        * Obavezna polja. Podaci se ovdje ne šalju niti pohranjuju. Pripremit
        ćemo poruku koju možete pregledati i poslati iz svoje aplikacije za
        e-poštu.
      </p>
      <button className="solid-button" type="submit">
        Pripremite upit <span aria-hidden="true">↗</span>
      </button>
      {draft && (
        <div
          className="form-result"
          ref={resultRef}
          tabIndex={-1}
          role="status"
        >
          <h3>Vaš upit je pripremljen.</h3>
          <p>
            Upit još nije poslan. Pregledajte ga i pošaljite iz svoje aplikacije
            za e-poštu.
          </p>
          <pre>{draft.body}</pre>
          <a href={draft.href}>
            Otvorite e-poštu <span aria-hidden="true">↗</span>
          </a>
          <p>
            Ako nemate aplikaciju za e-poštu, kopirajte tekst i pošaljite ga na
            adduco@adduco.hr.
          </p>
        </div>
      )}
    </form>
  );
}
