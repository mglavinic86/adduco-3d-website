import { useEffect, useRef, useState, type FormEvent } from "react";
type Field = "name" | "email" | "location" | "message";
type Draft = { body: string; href: string };

function fieldError(name: Field, value: string) {
  const trimmed = value.trim();
  if (name === "name" && !trimmed) return "Unesite svoje ime.";
  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Unesite ispravnu adresu e-pošte.";
  }
  if (name === "message" && trimmed.length < 10) {
    return "Opišite projekt u najmanje 10 znakova.";
  }
}

function PreparedInquiry({ draft }: { draft: Draft }) {
  const [copyState, setCopyState] = useState<
    "idle" | "copying" | "copied" | "manual"
  >("idle");
  const manualText = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (copyState === "manual") {
      manualText.current?.focus();
      manualText.current?.select();
    }
  }, [copyState]);
  async function copy() {
    setCopyState("copying");
    try {
      await navigator.clipboard.writeText(draft.body);
      setCopyState("copied");
    } catch {
      setCopyState("manual");
    }
  }
  return (
    <>
      <h3 id="inquiry-result-title">Vaš upit je pripremljen.</h3>
      <p>
        Upit još nije poslan. Pregledajte ga i pošaljite iz svoje aplikacije za
        e-poštu.
      </p>
      {copyState === "manual" ? (
        <div className="field manual-copy">
          <label htmlFor="manual-inquiry">Tekst upita za ručno kopiranje</label>
          <textarea
            id="manual-inquiry"
            ref={manualText}
            readOnly
            value={draft.body}
            aria-describedby="copy-status"
            rows={10}
          />
        </div>
      ) : (
        <pre>{draft.body}</pre>
      )}
      <div className="draft-actions">
        <a href={draft.href}>
          Otvorite e-poštu <span aria-hidden="true">↗</span>
        </a>
        <button type="button" onClick={copy} disabled={copyState === "copying"}>
          {copyState === "copying" ? "Kopiranje…" : "Kopirajte tekst upita"}
        </button>
      </div>
      <p role="status" className="copy-status" id="copy-status">
        {copyState === "copied" &&
          "Tekst upita je kopiran. Upit još nije poslan."}
        {copyState === "manual" &&
          "Automatsko kopiranje nije dostupno. Označite i kopirajte tekst upita."}
      </p>
      <p>
        Ako koristite e-poštu u pregledniku, kopirajte tekst u novu poruku za
        adduco@adduco.hr.
      </p>
    </>
  );
}

export default function InquiryForm() {
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [draft, setDraft] = useState<Draft | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (draft) resultRef.current?.focus();
  }, [draft]);
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
    for (const name of ["name", "email", "message"] as const) {
      const error = fieldError(name, values[name]);
      if (error) next[name] = error;
    }
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
      onChange={(event) => {
        if (draft) setDraft(null);
        const input = event.target;
        if (!(
          input instanceof HTMLInputElement ||
          input instanceof HTMLTextAreaElement
        ))
          return;
        const name = input.name as Field;
        if (errors[name]) {
          setErrors({ ...errors, [name]: fieldError(name, input.value) });
        }
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
          role="region"
          aria-labelledby="inquiry-result-title"
        >
          <PreparedInquiry key={draft.href} draft={draft} />
        </div>
      )}
    </form>
  );
}
