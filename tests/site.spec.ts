import { test, expect } from "@playwright/test";
test("tablet starts in the lighter presentation without requesting a 3D model", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  const models: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".glb")) models.push(request.url());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Mirni prikaz" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(500);
  expect(models).toEqual([]);
});
test("checklist download returns a real PDF without an email gate", async ({
  request,
}) => {
  const response = await request.get("/kontrolna-lista-adduco.pdf");
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("application/pdf");
  expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
});

for (const width of [390, 768, 1440]) {
  test(`readable layout and direct navigation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?fallback");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".header-cta")).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBeTruthy();
    await expect(page.locator(".world-stills img").first()).toHaveJSProperty(
      "complete",
      true,
    );
    await page.screenshot({ path: `/tmp/adduco-qa/desktop-${width}.png` });
    if (width < 768) {
      await page.getByRole("button", { name: "Otvori izbornik" }).click();
      await expect(
        page.getByRole("button", { name: "Zatvori izbornik" }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "Otvori izbornik" }),
      ).toBeFocused();
      await page.getByRole("button", { name: "Otvori izbornik" }).click();
    }
    await page
      .getByRole("navigation", { name: "Glavna navigacija" })
      .getByRole("link", { name: "Usluge", exact: true })
      .click();
    await expect(page.locator("#usluge")).toBeInViewport();
    await page.screenshot({ path: `/tmp/adduco-qa/services-${width}.png` });
    await page.locator(".header-cta").click();
    await expect(page.locator("#kontakt")).toBeInViewport();
    await page.screenshot({ path: `/tmp/adduco-qa/contact-${width}.png` });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBeTruthy();
  });
}
test("all chapters work forward and backward with native scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("canvas.ready")).toBeVisible({ timeout: 30000 });
  const ids = [
    "vizija",
    "povjerenje",
    "preciznost",
    "projekt",
    "preciznost",
    "povjerenje",
    "vizija",
  ];
  for (const id of ids) {
    await page.locator(`.journey-dock a[href="#${id}"]`).click();
    await expect(
      page.locator(`.journey-dock a[href="#${id}"]`),
    ).toHaveAttribute("aria-current", "step");
    await expect(page.locator(`#${id} .chapter-content`)).toBeInViewport();
  }
  await page.mouse.wheel(0, 450);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(350);
  await page.mouse.wheel(0, -450);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(120);
});
test("reduced motion and unavailable WebGL keep a usable illustrated page", async ({
  browser,
}) => {
  for (const mode of ["reduced", "unavailable"]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
    });
    const page = await context.newPage();
    if (mode === "unavailable")
      await page.addInitScript(() => {
        const old = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (
          this: HTMLCanvasElement,
          type: string,
          ...args: unknown[]
        ) {
          if (type.includes("webgl")) return null;
          return old.apply(this, [type, ...args] as Parameters<typeof old>);
        } as typeof old;
      });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Mirni prikaz" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".world-stills img").first()).toHaveJSProperty(
      "naturalWidth",
      1600,
    );
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.locator(".header-cta").click();
    await expect(page.getByLabel("Ime i prezime *")).toBeInViewport();
    await context.close();
  }
});
test("inquiry errors, a reviewable draft and every internal CTA", async ({
  page,
}) => {
  await page.goto("/?fallback");
  await page.locator(".header-cta").click();
  await page.getByRole("button", { name: "Pripremite upit" }).click();
  await expect(page.getByText("Unesite svoje ime.")).toBeVisible();
  await page.getByLabel("Ime i prezime *").fill("Testni investitor");
  await page.getByLabel("E-pošta *").fill("investitor@example.com");
  await page
    .getByLabel("O vašem projektu *")
    .fill("Priprema lokalnog pregleda; ovaj upit ne treba slati.");
  await page.getByRole("button", { name: "Pripremite upit" }).click();
  await expect(
    page.getByRole("link", { name: "Otvorite e-poštu" }),
  ).toHaveAttribute("href", /^mailto:adduco@adduco.hr/);
  await expect(page.getByText(/Upit još nije poslan/)).toBeVisible();
  const broken = await page
    .locator('a[href^="#"]')
    .evaluateAll((links) =>
      links
        .map((a) => a.getAttribute("href"))
        .filter((href) => !document.querySelector(href!)),
    );
  expect(broken).toEqual([]);
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: /Preuzmite kontrolnu listu/ }).click();
  expect((await download).suggestedFilename()).toBe(
    "kontrolna-lista-adduco.pdf",
  );
});
test("mode changes and keyboard access preserve a working page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("canvas.ready")).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "Mirni prikaz" }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Mirni prikaz" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Mirni prikaz" }).click();
  await expect(page.locator("canvas.ready")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.goto("/?fallback");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Preskoči na sadržaj" }),
  ).toBeFocused();
});
