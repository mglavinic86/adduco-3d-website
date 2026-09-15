import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import App from "./App";
describe("Investor journey", () => {
  it("explains the business immediately and links directly to a reachable inquiry section", async () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Od vizije",
    );
    expect(screen.getAllByText(/niskogradnj/i).length).toBeGreaterThan(0);
    const cta = screen.getAllByRole("link", {
      name: /Razgovarajmo o vašem projektu/i,
    })[0];
    expect(cta).toHaveAttribute("href", "#kontakt");
    await userEvent.click(cta);
    expect(document.getElementById("kontakt")).toBeInTheDocument();
  });
  it("opens services over the garden and closes the panel back to its opener", async () => {
    render(<App />);
    const user = userEvent.setup();
    const opener = within(
      screen.getByRole("navigation", { name: "Glavna navigacija" }),
    ).getByRole("link", { name: "Usluge" });
    await user.click(opener);
    const panel = screen.getByRole("dialog", { name: "Usluge" });
    expect(
      within(panel).getByRole("heading", { name: "Niskogradnja" }),
    ).toBeVisible();
    expect(
      within(panel).getByRole("heading", { name: "Visokogradnja" }),
    ).toBeVisible();
    await user.click(
      within(panel).getByRole("button", { name: "Natrag u priču" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
  it("provides direct links to all four chapters and lets visitors choose a still presentation", async () => {
    render(<App />);
    const chapters = screen.getByRole("navigation", {
      name: "Poglavlja priče",
    });
    expect(chapters.querySelectorAll("a")).toHaveLength(4);
    for (const link of chapters.querySelectorAll("a"))
      expect(
        document.querySelector(link.getAttribute("href")!),
      ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pokreni 3D" })).toBeVisible();
  });
  it("validates an inquiry and prepares a reviewable email without claiming it was sent", async () => {
    render(<App />);
    const user = userEvent.setup();
    await user.click(
      screen.getAllByRole("link", { name: "Razgovarajmo o vašem projektu" })[0],
    );
    await user.click(screen.getByRole("button", { name: "Pripremite upit" }));
    expect(screen.getByText("Unesite svoje ime.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Ime i prezime *"), "Ana Horvat");
    await user.type(screen.getByLabelText("E-pošta *"), "ana@example.com");
    await user.type(
      screen.getByLabelText("O vašem projektu *"),
      "Planiramo urediti prilaz obiteljskoj kući u Metkoviću.",
    );
    await user.click(screen.getByRole("button", { name: "Pripremite upit" }));
    const draft = screen.getByRole("link", { name: "Otvorite e-poštu" });
    expect(draft.getAttribute("href")).toContain("mailto:adduco@adduco.hr?");
    expect(decodeURIComponent(draft.getAttribute("href")!)).toContain(
      "Ana Horvat",
    );
    expect(screen.getByText(/Upit još nije poslan/)).toBeInTheDocument();
    await user.type(
      screen.getByLabelText("O vašem projektu *"),
      " Novi detalj.",
    );
    expect(
      screen.queryByRole("link", { name: "Otvorite e-poštu" }),
    ).not.toBeInTheDocument();
  });
});
