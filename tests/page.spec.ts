import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [320, 390, 768, 1440]) {
  test(`business content and a long inquiry remain usable at ${width}px`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#o-nama");
    if (width < 768) {
      await expect(
        page.getByRole("button", { name: "Otvori izbornik" }),
      ).toBeInViewport({ ratio: 1 });
    }
    for (const id of ["o-nama", "usluge", "priprema", "projekti", "kontakt"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(1);
    }
    await page.getByLabel("Ime i prezime *").fill("Ana Horvat");
    await page.getByLabel("E-pošta *").fill("ana@example.com");
    await page
      .getByLabel("O vašem projektu *")
      .fill("Planiramo uređenje prilaza. ".repeat(40));
    await page.getByRole("button", { name: "Pripremite upit" }).click();
    await expect(
      page.getByRole("region", { name: "Vaš upit je pripremljen." }),
    ).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Kopirajte tekst upita" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

for (const mode of ["denied", "unavailable"]) {
  test(`inquiry offers manual copying when clipboard is ${mode}`, async ({
    page,
  }) => {
    await page.addInitScript((mode) => {
      Object.defineProperty(navigator, "clipboard", {
        value:
          mode === "unavailable"
            ? undefined
            : {
                writeText: () =>
                  Promise.reject(new DOMException("Denied", "NotAllowedError")),
              },
      });
    }, mode);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#kontakt");
    await page.getByLabel("Ime i prezime *").fill("Ana Horvat");
    await page.getByLabel("E-pošta *").fill("ana@example.com");
    await page.getByLabel("O vašem projektu *").fill("Uređenje prilaza kući.");
    await page.getByRole("button", { name: "Pripremite upit" }).click();
    await page.getByRole("button", { name: "Kopirajte tekst upita" }).click();
    const text = page.getByRole("textbox", {
      name: "Tekst upita za ručno kopiranje",
    });
    await expect(text).toBeFocused();
    await expect(text).toHaveValue(/Uređenje prilaza kući\./);
    expect(
      await text.evaluate(
        (el: HTMLTextAreaElement) => el.selectionEnd - el.selectionStart,
      ),
    ).toBe((await text.inputValue()).length);
    await expect(
      page.getByText("Tekst upita je kopiran. Upit još nije poslan."),
    ).toHaveCount(0);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test("mobile menu keeps every action reachable on a short screen", async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 640, height: 360 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Otvori izbornik" }).click();
  const tabKey = browserName === "webkit" ? "Alt+Tab" : "Tab";
  for (let i = 0; i < 3; i++) await page.keyboard.press(tabKey);
  const contact = page
    .getByRole("navigation", { name: "Glavna navigacija" })
    .getByRole("link", { name: "Kontakt", exact: true });
  await expect(contact).toBeFocused();
  await expect(contact).toBeInViewport({ ratio: 1 });
  await contact.press("Enter");
  await expect(page.locator("#kontakt")).toBeFocused();
});

test("mobile keyboard navigation continues in the chosen section and closes on focus exit", async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Otvori izbornik" }).click();
  await page
    .getByRole("navigation", { name: "Glavna navigacija" })
    .getByRole("link", { name: "O nama", exact: true })
    .press("Enter");
  await expect(page.locator("#o-nama")).toBeFocused();
  const tabKey = browserName === "webkit" ? "Alt+Tab" : "Tab";
  await page.keyboard.press(tabKey);
  await expect(page.locator("#o-nama").getByRole("link")).toBeFocused();
  await page.getByRole("button", { name: "Otvori izbornik" }).click();
  // Tab out of the non-modal navigation and past the persistent header controls.
  for (let i = 0; i < 6; i++) await page.keyboard.press(tabKey);
  await expect(
    page.getByRole("button", { name: "Otvori izbornik" }),
  ).toHaveAttribute("aria-expanded", "false");
});

for (const hash of ["o-nama", "usluge", "priprema", "projekti", "kontakt"]) {
  test(`direct #${hash} opens ordinary content and survives Back`, async ({
    page,
  }) => {
    await page.goto(`/#${hash}`);
    await expect(page.locator(`#${hash}`)).toBeInViewport();
    await expect(page.locator("dialog")).toHaveCount(0);
    await page.getByRole("link", { name: "Adduco — početna" }).click();
    await expect(page.locator("#vizija")).toBeInViewport();
    await page.goBack();
    await expect(page.locator(`#${hash}`)).toBeInViewport();
  });
}

test("mobile menu, keyboard access, inquiry and PDF work without playback", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Otvori izbornik" }).click();
  await expect(
    page
      .getByRole("navigation", { name: "Glavna navigacija" })
      .getByRole("link", { name: "O nama" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Otvori izbornik" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Otvori izbornik" }).click();
  await page
    .getByRole("navigation", { name: "Glavna navigacija" })
    .getByRole("link", { name: "Kontakt", exact: true })
    .click();
  await expect(page.locator("#kontakt")).toBeInViewport();
  await page.getByRole("button", { name: "Pripremite upit" }).click();
  await expect(page.getByText("Unesite svoje ime.")).toBeVisible();
  await page.getByLabel("Ime i prezime *").fill("Ana Horvat");
  await page.getByLabel("E-pošta *").fill("ana@example.com");
  await page
    .getByLabel("O vašem projektu *")
    .fill("Planiramo izgradnju kuće u Metkoviću.");
  await page.getByRole("button", { name: "Pripremite upit" }).click();
  await expect(
    page.getByRole("link", { name: "Otvorite e-poštu" }),
  ).toHaveAttribute("href", /^mailto:/);
  await expect(page.getByText(/Upit još nije poslan/)).toBeVisible();
  const pdf = await request.get("/kontrolna-lista-adduco.pdf");
  expect(pdf.ok()).toBe(true);
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("all text and hash navigation work without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(baseURL!);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Glavna navigacija" })
    .getByRole("link", { name: "Usluge" })
    .click();
  await expect(page.locator("#usluge")).toBeInViewport();
  await expect(page.locator(".construction-story")).not.toHaveClass(
    /is-enhanced/,
  );
  await context.close();
});
