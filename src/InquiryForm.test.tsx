import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import InquiryForm from "./InquiryForm";

async function prepareInquiry(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Ime i prezime *"), "Ana Horvat");
  await user.type(screen.getByLabelText("E-pošta *"), "ana@example.com");
  await user.type(screen.getByLabelText("Lokacija projekta"), "Metković");
  await user.type(
    screen.getByLabelText("O vašem projektu *"),
    "Uređenje prilaza kući.",
  );
  await user.click(screen.getByRole("button", { name: "Pripremite upit" }));
}

describe("Inquiry preparation", () => {
  afterEach(() => vi.restoreAllMocks());
  it("clears corrected field errors while keeping invalid fields identified", async () => {
    const user = userEvent.setup();
    render(<InquiryForm />);
    await user.click(screen.getByRole("button", { name: "Pripremite upit" }));
    const name = screen.getByLabelText("Ime i prezime *");
    const email = screen.getByLabelText("E-pošta *");
    expect(name).toHaveFocus();
    await user.type(name, "Ana");
    expect(name).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByText("Unesite svoje ime.")).not.toBeInTheDocument();
    await user.type(email, "ana@");
    expect(email).toHaveAttribute("aria-invalid", "true");
    await user.type(email, "example.com");
    expect(email).toHaveAttribute("aria-invalid", "false");
    await user.type(
      screen.getByLabelText("O vašem projektu *"),
      "Uređenje prilaza kući.",
    );
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Pripremite upit" }));
    expect(
      screen.getByRole("link", { name: "Otvorite e-poštu" }),
    ).toBeVisible();
  });
  it("offers selected, read-only text when clipboard access is denied without claiming success", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new DOMException("Denied", "NotAllowedError"),
    );
    render(<InquiryForm />);
    await prepareInquiry(user);
    await user.click(
      screen.getByRole("button", { name: "Kopirajte tekst upita" }),
    );
    const manual = await screen.findByRole("textbox", {
      name: "Tekst upita za ručno kopiranje",
    });
    expect(manual).toHaveFocus();
    expect(manual).toHaveAttribute("readonly");
    expect((manual as HTMLTextAreaElement).value).toContain(
      "Uređenje prilaza kući.",
    );
    expect((manual as HTMLTextAreaElement).selectionEnd).toBe(
      (manual as HTMLTextAreaElement).value.length,
    );
    expect((manual as HTMLTextAreaElement).selectionStart).toBe(0);
    expect(
      screen.queryByText("Tekst upita je kopiran. Upit još nije poslan."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Otvorite e-poštu" }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:adduco@adduco.hr?"),
    );
  });
  it("copies the reviewed message and removes the old draft when the visitor edits it", async () => {
    const user = userEvent.setup();
    render(<InquiryForm />);
    await prepareInquiry(user);
    await user.click(
      screen.getByRole("button", { name: "Kopirajte tekst upita" }),
    );
    expect(
      await screen.findByText("Tekst upita je kopiran. Upit još nije poslan."),
    ).toBeVisible();
    expect(await navigator.clipboard.readText()).toBe(
      "Poštovani,\n\nUređenje prilaza kući.\n\nLokacija projekta: Metković\nIme i prezime: Ana Horvat\nE-pošta: ana@example.com\n\nSrdačan pozdrav,\nAna Horvat",
    );
    await user.type(screen.getByLabelText("Lokacija projekta"), " — Unka");
    expect(
      screen.queryByText("Tekst upita je kopiran. Upit još nije poslan."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Otvorite e-poštu" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pripremite upit" }));
    await user.click(
      screen.getByRole("button", { name: "Kopirajte tekst upita" }),
    );
    expect(await navigator.clipboard.readText()).toContain("Metković — Unka");
  });
});
