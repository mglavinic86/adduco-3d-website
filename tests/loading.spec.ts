import { test, expect } from "@playwright/test";

test("failed opening artwork still allows the film and contact", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.route("**/chapter-mobile-v2-0.*", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("video.ready")).toBeVisible();
  await page.locator(".header-cta").click();
  await expect(page.getByRole("dialog", { name: "Kontakt" })).toBeVisible();
});

test("scrolling before the opening image loads still begins at the opening pose", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/chapter-mobile-v2-0.*", async (route) => {
    await held;
    await route.continue();
  });
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      const movie = document.querySelector<HTMLVideoElement>("video.ready");
      if (movie?.dataset.presentedTime === undefined) return;
      (window as unknown as { firstPose: number }).firstPose = Number(
        movie.dataset.presentedTime,
      );
      observer.disconnect();
    });
    observer.observe(document, {
      attributes: true,
      subtree: true,
      childList: true,
    });
  });
  await page.goto("/#vizija", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".site")).toHaveClass(/is-ready/);
  await page.evaluate(() => window.scrollTo({ top: 350, behavior: "instant" }));
  release();
  await expect(page.locator("video.ready")).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as unknown as { firstPose: number }).firstPose,
    ),
  ).toBe(0);
  await expect
    .poll(() =>
      page
        .locator("video.ready")
        .getAttribute("data-presented-time")
        .then(Number),
    )
    .toBeGreaterThan(1);
  expect(await page.evaluate(() => scrollY)).toBe(350);
});
