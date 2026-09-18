import { test, expect } from "@playwright/test";

const captions = [
  "Od vizije do stvarnosti.",
  "Snaga je u detalju.",
  "Gradimo u visinu.",
  "Vaš projekt počinje razgovorom.",
];

test("destination text is readable during every film while gestures stay locked until its end", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  let scene = 0;
  for (const destination of [1, 2, 3, 2, 1, 0]) {
    const forward = destination > scene;
    const film = page.locator(
      `video[data-transition="${Math.max(scene, destination)}"][data-direction="${forward ? "forward" : "reverse"}"]`,
    );
    await page.keyboard.press(forward ? "PageDown" : "PageUp");
    await expect(
      page.getByRole("heading", { name: captions[destination] }),
    ).toBeVisible();
    await expect(
      page.locator('.chapter-content[data-visible="true"]'),
    ).toHaveCSS("opacity", "1");
    const state = await film.evaluate((v: HTMLVideoElement) => ({
      time: v.currentTime,
      ended: v.ended,
      paused: v.paused,
    }));
    expect(state.ended).toBe(false);
    expect(state.paused).toBe(false);
    expect(state.time).toBeGreaterThanOrEqual(1.5);
    expect(state.time).toBeLessThan(2.5);
    await expect(
      page.locator('.chapter-content[data-visible="true"]'),
    ).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: captions[scene] }),
    ).toHaveCount(0);
    await expect(page.locator('.scene-nav a[aria-current="step"]')).toHaveText(
      `0${destination + 1}`,
    );
    if (forward && (destination === 1 || destination === 3))
      await page.screenshot({
        path: `/tmp/adduco-early-caption-${testInfo.project.name}-${destination}.png`,
      });
    // Reading can start early; the same film must still finish before any new move.
    await page.keyboard.press("PageDown");
    await page.keyboard.press("PageUp");
    await expect(film).toHaveJSProperty("ended", true);
    await expect(
      page.getByRole("heading", { name: captions[destination] }),
    ).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    scene = destination;
  }
});

test("early destination action can leave the film immediately", async ({
  page,
}) => {
  await page.goto("/#preciznost");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("PageDown");
  const film = page.locator(
    'video[data-transition="3"][data-direction="forward"]',
  );
  await expect(page.getByRole("heading", { name: captions[3] })).toBeVisible();
  await expect(film).toHaveJSProperty("ended", false);
  await page.getByRole("link", { name: "Razgovarajmo", exact: true }).click();
  await expect(page.locator("#kontakt")).toBeInViewport();
  await expect(film).toHaveJSProperty("paused", true);
  await page.goBack();
  await expect(page).toHaveURL(/#projekt$/);
  await expect(
    page.getByRole("heading", { name: captions[3] }),
  ).toBeInViewport();
});

test("caption waits for actual playback progress when a movie stalls before halfway", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("PageDown");
  const film = page.locator(
    'video[data-transition="1"][data-direction="forward"]',
  );
  await expect
    .poll(() => film.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0.1);
  await film.evaluate((v: HTMLVideoElement) => v.pause());
  await page.waitForTimeout(1800);
  await expect(page.getByRole("heading", { name: captions[1] })).toHaveCount(0);
  await film.evaluate((v: HTMLVideoElement) => v.play());
  await expect(page.getByRole("heading", { name: captions[1] })).toBeVisible();
  await expect(film).toHaveJSProperty("ended", false);
});
