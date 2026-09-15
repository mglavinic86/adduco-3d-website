import { test, expect } from "@playwright/test";

test("late loading cannot undo the visitor's first scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/adduco-logo-dark.webp", async (route) => {
    await held;
    await route.continue();
  });
  await page.goto("/#vizija", { waitUntil: "domcontentloaded" });
  await expect(page.locator("video.ready")).toBeVisible();
  await expect(page.locator("video.ready")).not.toHaveClass(/opening/);
  await page.evaluate(() => window.scrollTo({ top: 950, behavior: "instant" }));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(950);
  await expect
    .poll(() =>
      page
        .locator("video.ready")
        .getAttribute("data-presented-time")
        .then(Number),
    )
    .toBeGreaterThan(3);

  release();
  await page.waitForLoadState("load");
  expect(await page.evaluate(() => scrollY)).toBe(950);
  await expect(
    page.locator('.journey-dock a[href="#povjerenje"]'),
  ).toHaveAttribute("aria-current", "step");

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect
    .poll(() =>
      page
        .locator("video.ready")
        .getAttribute("data-presented-time")
        .then(Number),
    )
    .toBe(0);
});

test("a direct chapter URL opens at its scene before and after loading", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/adduco-logo-dark.webp", async (route) => {
    await held;
    await route.continue();
  });
  await page.goto("/#preciznost", { waitUntil: "domcontentloaded" });
  await expect(page.locator("video.ready")).toBeVisible();
  await expect(
    page.locator('.journey-dock a[href="#preciznost"]'),
  ).toHaveAttribute("aria-current", "step");
  await expect(page.locator("#preciznost .chapter-content")).toBeVisible();
  const position = await page
    .locator("#preciznost")
    .evaluate((el: HTMLElement) => el.offsetTop);
  expect(await page.evaluate(() => scrollY)).toBe(position);
  release();
  await page.waitForLoadState("load");
  expect(await page.evaluate(() => scrollY)).toBe(position);
});

for (const fallback of [false, true]) {
  test(`toolbar expansion preserves the artwork framing (${fallback ? "still" : "film"})`, async ({
    page,
  }, testInfo) => {
    // Desktop engines do not have retractable browser chrome. Model its CSS
    // environment: small/large units stay fixed while the visible viewport
    // grows/shrinks. This covers layout, not a physical phone's compositor.
    const smallHeight = 700;
    const largeHeight = 758;
    await page.route("**/assets/*.css", async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(
        /\b(\d+(?:\.\d+)?)(svh|lvh|vh)\b/g,
        (_, value, unit) =>
          `${(Number(value) * (unit === "svh" ? smallHeight : largeHeight)) / 100}px`,
      );
      await route.fulfill({ response, body });
    });
    await page.setViewportSize({ width: 390, height: smallHeight });
    await page.goto(fallback ? "/?fallback" : "/");
    const artwork = page.locator(
      fallback ? ".world-stills img.active" : "video.ready",
    );
    await expect(artwork).toBeVisible();
    if (!fallback) await expect(artwork).not.toHaveClass(/opening/);
    const initial = await artwork.boundingBox();
    const distance = await page
      .locator("#povjerenje")
      .evaluate((el: HTMLElement) => el.offsetTop);
    await page.screenshot({ path: testInfo.outputPath("toolbar-shown.png") });
    for (const height of [729, largeHeight, 729, smallHeight]) {
      await page.setViewportSize({ width: 390, height });
      const box = (await artwork.boundingBox())!;
      expect(
        box,
        "Hiding the address bar must not zoom or reposition the movie",
      ).toEqual(initial);
      expect(
        box.y + box.height,
        "Artwork must cover the newly exposed bottom edge",
      ).toBeGreaterThanOrEqual(height);
      expect(
        await page
          .locator("#povjerenje")
          .evaluate((el: HTMLElement) => el.offsetTop),
      ).toBe(distance);
      await expect(page.locator(".header-cta")).toBeInViewport();
      await expect(page.locator(".journey-dock")).toBeInViewport();
      await expect(
        page.getByRole("button", {
          name: /Pokreni animaciju|Zaustavi animaciju/,
        }),
      ).toHaveCount(0);
      if (!fallback)
        await expect(artwork).toHaveAttribute("data-presented-time", "0");
      if (height === largeHeight)
        await page.screenshot({
          path: testInfo.outputPath("toolbar-hidden.png"),
        });
    }
    // Repeat while already partway into the first move: viewport changes
    // must not seek to a different camera position or rewind its caption.
    await page.evaluate(
      (distance) =>
        window.scrollTo({
          top: Math.round(distance * 0.25),
          behavior: "instant",
        }),
      distance,
    );
    if (!fallback)
      await expect
        .poll(() => artwork.getAttribute("data-presented-time").then(Number))
        .toBe(2);
    for (const height of [largeHeight, smallHeight]) {
      await page.setViewportSize({ width: 390, height });
      expect(await artwork.boundingBox()).toEqual(initial);
      expect(await page.evaluate(() => scrollY)).toBe(
        Math.round(distance * 0.25),
      );
      if (!fallback)
        await expect(artwork).toHaveAttribute("data-presented-time", "2");
    }
  });
}
