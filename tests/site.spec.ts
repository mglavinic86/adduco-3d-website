import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("film remains reversible when hosting reports no seekable byte ranges", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const time = Object.getOwnPropertyDescriptor(
      HTMLMediaElement.prototype,
      "currentTime",
    )!;
    const ranges = Object.getOwnPropertyDescriptor(
      HTMLMediaElement.prototype,
      "seekable",
    )!;
    // Reproduce the hosted response: a fully buffered HTTP movie reports [0, 0]
    // and ignores seeks. Locally loaded media has its normal browser behavior.
    Object.defineProperty(HTMLMediaElement.prototype, "seekable", {
      get() {
        return this.currentSrc.startsWith("http")
          ? { length: 1, start: () => 0, end: () => 0 }
          : ranges.get!.call(this);
      },
    });
    Object.defineProperty(HTMLMediaElement.prototype, "currentTime", {
      get() {
        return time.get!.call(this);
      },
      set(value) {
        if (!this.currentSrc.startsWith("http")) time.set!.call(this, value);
      },
    });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("video.ready")).toBeVisible();
  await page.locator('.journey-dock a[href="#preciznost"]').click();
  await expect
    .poll(() =>
      page.locator("video").evaluate((v: HTMLVideoElement) => v.currentTime),
    )
    .toBeGreaterThan(4.5);
  await page.locator('.journey-dock a[href="#vizija"]').click();
  await expect
    .poll(() =>
      page.locator("video").evaluate((v: HTMLVideoElement) => v.currentTime),
    )
    .toBeLessThan(0.1);
});
test("cinematic film follows native scrolling in both directions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const film = page.locator("video");
  await expect(film).toBeVisible({ timeout: 30000 });
  await expect
    .poll(() => film.evaluate((video: HTMLVideoElement) => video.readyState))
    .toBeGreaterThanOrEqual(2);
  await page.locator('.journey-dock a[href="#preciznost"]').click();
  await expect
    .poll(() =>
      film.evaluate(
        (video: HTMLVideoElement) => video.currentTime / video.duration,
      ),
    )
    .toBeGreaterThan(0.6);
  await expect(page.locator("#preciznost .chapter-content")).toBeInViewport();
  await page.locator('.journey-dock a[href="#vizija"]').click();
  await expect
    .poll(() => film.evaluate((video: HTMLVideoElement) => video.currentTime))
    .toBeLessThan(0.1);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
test("tablet starts in the lighter presentation without requesting the movie", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 768, height: 1024 },
    hasTouch: true,
  });
  const page = await context.newPage();
  const models: string[] = [];
  const stills: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".mp4")) models.push(request.url());
    if (/chapter(?:-mobile|-tablet)?-\d\.webp$/.test(request.url()))
      stills.push(request.url());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pokreni animaciju" }),
  ).toBeVisible();
  await page.waitForTimeout(500);
  expect(models).toEqual([]);
  expect(stills).toHaveLength(1);
  await page.locator('.journey-dock a[href="#povjerenje"]').click();
  await expect(page.locator(".world-stills img.active")).toHaveAttribute(
    "src",
    /chapter-1.webp$/,
  );
  await page.locator('.journey-dock a[href="#vizija"]').click();
  await expect(page.locator(".world-stills img.active")).toHaveAttribute(
    "src",
    /chapter-0.webp$/,
  );
  await page.getByRole("button", { name: "Pokreni animaciju" }).click();
  await expect(page.locator("video.ready")).toBeVisible();
  expect(models.length).toBeGreaterThan(0);
  await page.locator('.journey-dock a[href="#projekt"]').click();
  await expect
    .poll(() =>
      page
        .locator("video")
        .evaluate((video: HTMLVideoElement) => video.currentTime),
    )
    .toBeGreaterThan(6.99);
  await page.screenshot({ path: "/tmp/adduco-qa/cinema-tablet-end.png" });
  await context.close();
});

test("phone can opt into the film and return from a detail panel", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Pokreni animaciju" }).click();
  await expect(page.locator("video.ready")).toBeVisible();
  await page.locator('.journey-dock a[href="#projekt"]').click();
  await expect
    .poll(() =>
      page
        .locator("video")
        .evaluate((video: HTMLVideoElement) => video.currentTime),
    )
    .toBeGreaterThan(6.99);
  await page.screenshot({ path: "/tmp/adduco-qa/cinema-mobile-end.png" });
  const time = await page
    .locator("video")
    .evaluate((video: HTMLVideoElement) => video.currentTime);
  await page.locator(".header-cta").click();
  await expect(page.getByLabel("Ime i prezime *")).toBeInViewport();
  await page.getByRole("button", { name: "Natrag u priču" }).click();
  expect(
    await page
      .locator("video")
      .evaluate((video: HTMLVideoElement) => video.currentTime),
  ).toBeCloseTo(time, 1);
  await page.locator('.journey-dock a[href="#vizija"]').click();
  await expect
    .poll(() =>
      page
        .locator("video")
        .evaluate((video: HTMLVideoElement) => video.currentTime),
    )
    .toBeLessThan(0.1);
});
test("a narrow desktop opens the cinematic film and preserves an explicit pause on resize", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1013, height: 941 });
  await page.goto("/");
  await expect(page.locator("video.ready")).toBeVisible({ timeout: 30000 });
  await expect(
    page.getByRole("button", { name: "Zaustavi animaciju" }),
  ).toBeVisible();
  const firstChapter = await page.locator("video").screenshot();
  await page.locator('.journey-dock a[href="#povjerenje"]').click();
  await expect(page.locator("#povjerenje .chapter-content")).toBeInViewport();
  expect(await page.locator("video").screenshot()).not.toEqual(firstChapter);
  await page.getByRole("button", { name: "Zaustavi animaciju" }).click();
  await expect(page.locator("video")).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(
    page.getByRole("button", { name: "Pokreni animaciju" }),
  ).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  await page.getByRole("button", { name: "Pokreni animaciju" }).click();
  await expect(page.locator("video.ready")).toBeVisible({ timeout: 30000 });
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
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
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
    await page.getByRole("button", { name: "Natrag u priču" }).click();
    if (width < 768)
      await expect(
        page.getByRole("button", { name: "Otvori izbornik" }),
      ).toBeFocused();
    await page.locator(".header-cta").click();
    await expect(page.locator("#kontakt")).toBeInViewport();
    await expect(page.locator(".panel-shell")).toHaveCSS("opacity", "1");
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
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
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("video.ready")).toBeVisible({ timeout: 30000 });
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
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(2);
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 450);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(350);
  await page.mouse.wheel(0, -450);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(120);
  expect(errors).toEqual([]);
});

test("essential business content and direct contact work without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Glavna navigacija" })
    .getByRole("link", { name: "Usluge", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Visokogradnja" }),
  ).toBeVisible();
  await page.locator(".header-cta").click();
  await expect(page.locator('a[href="mailto:adduco@adduco.hr"]')).toBeVisible();
  await expect(page.locator(".inquiry-form")).toBeHidden();
  await context.close();
});
test("reduced motion and unavailable video keep a usable illustrated page", async ({
  browser,
}) => {
  for (const mode of ["reduced", "unavailable"]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
    });
    const page = await context.newPage();
    if (mode === "unavailable")
      await page.route("**/assets/construction-film*.mp4", (route) =>
        route.abort(),
      );
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Pokreni animaciju" }),
    ).toBeVisible();
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
  await page.getByRole("button", { name: "Natrag u priču" }).click();
  await page.locator('.journey-dock a[href="#povjerenje"]').click();
  await page.getByRole("link", { name: "Kako počinjemo" }).click();
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
  await expect(page.locator("video.ready")).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "Zaustavi animaciju" }).click();
  await expect(page.locator("video")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Pokreni animaciju" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pokreni animaciju" }).click();
  await expect(page.locator("video.ready")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("video")).toHaveCount(1);
  await page.goto("/?fallback");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Preskoči na sadržaj" }),
  ).toBeFocused();
});

test("continuous scene keeps its caption framed and details return to the same camera position", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("video.ready")).toBeVisible({ timeout: 30000 });
  const caption = page.locator("#vizija .chapter-content");
  const before = await caption.boundingBox();
  await page.mouse.wheel(0, 260);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(200);
  const after = await caption.boundingBox();
  expect(Math.abs(after!.y - before!.y)).toBeLessThan(35);
  const scrollPosition = await page.evaluate(() => scrollY);
  await page
    .getByRole("navigation", { name: "Glavna navigacija" })
    .getByRole("link", { name: "Usluge", exact: true })
    .click();
  await expect(page.getByRole("dialog", { name: "Usluge" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(scrollPosition, 0);
  await expect(
    page
      .getByRole("navigation", { name: "Glavna navigacija" })
      .getByRole("link", { name: "Usluge", exact: true }),
  ).toBeFocused();
});

test("direct detail URLs and browser Back preserve the immersive page", async ({
  page,
}) => {
  await page.goto("/?fallback#projekti");
  await expect(page.getByRole("dialog", { name: "Projekti" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Mlinske ulice/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Natrag u priču" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Glavna navigacija" })
    .getByRole("link", { name: "Usluge", exact: true })
    .click();
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
