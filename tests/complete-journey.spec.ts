import { test, expect } from "@playwright/test";

const captions = [
  "Od vizije do stvarnosti.",
  "Snaga je u detalju.",
  "Gradimo u visinu.",
  "Vaš projekt počinje razgovorom.",
];

test("one fresh gesture per transition reaches all four scenes and returns through them", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  for (let scene = 1; scene < captions.length; scene++) {
    await page.keyboard.press("PageDown");
    await expect(
      page.getByRole("heading", { name: captions[scene] }),
    ).toBeVisible({ timeout: 7000 });
    await expect(
      page.locator(
        `video[data-transition="${scene}"][data-direction="forward"]`,
      ),
    ).toHaveJSProperty("ended", true);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  }
  for (let scene = 2; scene >= 0; scene--) {
    const reverse = page.locator(
      `video[data-transition="${scene + 1}"][data-direction="reverse"]`,
    );
    await expect
      .poll(() => reverse.evaluate((v) => (v as HTMLVideoElement).readyState))
      .toBeGreaterThanOrEqual(2);
    // Prepared reverse films must include the full opening, with no edit-list offset.
    await expect(reverse).toHaveJSProperty("currentTime", 0);
    await expect(reverse).toHaveJSProperty("duration", 3);
    await page.keyboard.press("PageUp");
    await expect(
      page.getByRole("heading", { name: captions[scene] }),
    ).toBeVisible({ timeout: 7000 });
    await expect(
      page.locator(
        `video[data-transition="${scene + 1}"][data-direction="reverse"]`,
      ),
    ).toHaveJSProperty("ended", true);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  }
});

test("later films load only next to the current scene and do not play on arrival", async ({
  page,
}) => {
  const requested: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".mp4")) requested.push(r.url());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(requested.length).toBeGreaterThan(0);
  expect(
    requested.every(
      (url) => url.includes("/transition-1/") && url.endsWith("-forward.mp4"),
    ),
  ).toBe(true);
  await page.keyboard.press("PageDown");
  await expect(page.getByRole("heading", { name: captions[1] })).toBeVisible({
    timeout: 7000,
  });
  await page.waitForLoadState("networkidle");
  expect(
    requested.some(
      (url) => url.includes("/transition-2/") && url.endsWith("-forward.mp4"),
    ),
  ).toBe(true);
  expect(requested.some((url) => url.includes("/transition-3/"))).toBe(false);
  expect(
    await page
      .locator("video")
      .evaluateAll((videos) =>
        videos.every((v) => (v as HTMLVideoElement).paused),
      ),
  ).toBe(true);
});

test("direct final scene, contact, and native exit remain immediate", async ({
  page,
}) => {
  await page.goto("/#projekt");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: captions[3] })).toBeVisible();
  expect(
    await page
      .locator("video")
      .evaluateAll((videos) =>
        videos.every((v) => (v as HTMLVideoElement).paused),
      ),
  ).toBe(true);
  await page.getByRole("link", { name: "Razgovarajmo", exact: true }).click();
  await expect(page.locator("#kontakt")).toBeInViewport();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: captions[3] }),
  ).toBeInViewport();
  await page.locator(".chapter .eyebrow").last().click();
  await page.keyboard.press("PageDown");
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
});

test("a failed later movie reveals the correct scene and does not block the final action", async ({
  page,
}) => {
  await page.route("**/transition-3/*.mp4", (route) => route.abort());
  await page.goto("/#preciznost");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("PageDown");
  await expect(page.getByRole("heading", { name: captions[3] })).toBeVisible();
  await expect(page.locator('video[data-visible="true"]')).toHaveCount(0);
  await expect(
    page.locator('.chapter-still[data-visible="true"] img'),
  ).toHaveJSProperty("complete", true);
  await page.getByRole("link", { name: "Razgovarajmo", exact: true }).click();
  await expect(page.locator("#kontakt")).toBeInViewport();
});

for (const [width, height] of [
  [360, 640],
  [390, 844],
  [768, 1024],
  [1440, 900],
]) {
  test(`later scene artwork, captions and navigation fit ${width}x${height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height });
    for (const [hash, title] of [
      ["preciznost", captions[2]],
      ["projekt", captions[3]],
    ]) {
      await page.goto(`/#${hash}`);
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
      await expect(
        page.locator('.chapter-content[data-visible="true"]'),
      ).toHaveCSS("opacity", "1");
      await page.evaluate(() => document.fonts.ready);
      const caption = await page
        .locator('.chapter-content[data-visible="true"]')
        .boundingBox();
      const nav = await page
        .getByRole("navigation", { name: "Scene filmske priče" })
        .boundingBox();
      const header = await page.locator("header").boundingBox();
      expect(caption!.y).toBeGreaterThan(header!.y + header!.height);
      expect(caption!.y + caption!.height).toBeLessThan(nav!.y);
      expect(
        await page.locator("body").evaluate((e) => e.scrollWidth),
      ).toBeLessThanOrEqual(width);
      await expect(
        page.getByRole("link", { name: "4 — Vaš projekt" }),
      ).toBeInViewport();
      await page.screenshot({
        path: `/tmp/adduco-${hash}-${testInfo.project.name}-${width}.png`,
      });
    }
  });
}
