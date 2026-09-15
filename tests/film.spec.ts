import { test, expect } from "@playwright/test";

test("a near-square desktop keeps the landscape composition", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1013, height: 941 });
  await page.goto("/");
  await expect(page.locator("video.ready")).toHaveAttribute(
    "data-orientation",
    "landscape",
  );
  expect(
    await page
      .locator(".world-stills img.active")
      .evaluate(
        (img: HTMLImageElement) => img.naturalWidth > img.naturalHeight,
      ),
  ).toBe(true);
});

test("portrait composition fills the scene and only loads its own film on request", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const movies: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".mp4")) movies.push(request.url());
  });
  await page.goto("/");
  const still = page.locator(".world-stills img.active");
  await expect(still).toBeVisible();
  const bounds = await still.boundingBox();
  expect(bounds!.height).toBeGreaterThanOrEqual(840);
  expect(
    await still.evaluate(
      (img: HTMLImageElement) => img.naturalHeight > img.naturalWidth,
    ),
  ).toBe(true);
  expect(movies).toEqual([]);
  await expect(page.locator("#vizija .text-link")).toBeInViewport();
  await page.getByRole("button", { name: "Pokreni animaciju" }).click();
  await expect(page.locator("video.ready")).toHaveAttribute(
    "data-orientation",
    "portrait",
  );
  expect(movies.every((url) => url.includes("construction-portrait-"))).toBe(
    true,
  );
});

test("loads only the needed landscape film and reverses across camera segments", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const movies = new Set<string>();
  page.on("request", (request) => {
    if (request.url().endsWith(".mp4"))
      movies.add(new URL(request.url()).pathname);
  });
  await page.goto("/");
  await expect(page.locator("video.ready")).toBeVisible();
  expect([...movies]).toEqual(["/assets/construction-landscape-0.mp4"]);
  await page.locator('.journey-dock a[href="#preciznost"]').click();
  await expect(page.locator("video.ready")).toHaveAttribute(
    "data-segment",
    "2",
  );
  await page.locator('.journey-dock a[href="#projekt"]').click();
  await expect
    .poll(() =>
      page
        .locator("video.ready")
        .evaluate((v: HTMLVideoElement) => v.currentTime / v.duration),
    )
    .toBeGreaterThan(0.98);
  await page.locator('.journey-dock a[href="#povjerenje"]').click();
  await expect(page.locator("video.ready")).toHaveAttribute(
    "data-segment",
    "1",
  );
  await page.locator('.journey-dock a[href="#vizija"]').click();
  await expect(page.locator("video.ready")).toHaveAttribute(
    "data-segment",
    "0",
  );
  await expect
    .poll(() =>
      page
        .locator("video.ready")
        .evaluate((v: HTMLVideoElement) => v.currentTime),
    )
    .toBeLessThan(0.1);
  expect([...movies].some((url) => url.includes("portrait"))).toBe(false);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("keeps a decoded frame while a later move loads and keeps contact usable if it fails", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let release!: () => void;
  let requested!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const arrival = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await page.route("**/construction-landscape-2.mp4", async (route) => {
    requested();
    await gate;
    await route.abort();
  });
  await page.goto("/");
  await expect(page.locator("video.ready")).toHaveAttribute(
    "data-segment",
    "0",
  );
  await page.locator('.journey-dock a[href="#preciznost"]').click();
  await arrival;
  await expect(page.locator("video.ready")).toBeVisible();
  await expect(page.locator("video.ready")).not.toHaveAttribute(
    "data-segment",
    "2",
  );
  await expect(page.locator("#preciznost .text-link")).toBeInViewport();
  release();
  await expect(
    page.getByRole("button", { name: "Pokreni animaciju" }),
  ).toBeVisible();
  await expect(page.locator(".world-stills img.active")).toBeVisible();
  await page.locator(".header-cta").click();
  await expect(page.getByLabel("Ime i prezime *")).toBeInViewport();
});

test("switches the running film composition after rotating the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Pokreni animaciju" }).click();
  await expect(page.locator("video.ready")).toHaveAttribute(
    "data-orientation",
    "portrait",
  );
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator("video.ready")).toHaveAttribute(
    "data-orientation",
    "landscape",
  );
  await expect(page.locator('video[data-orientation="portrait"]')).toHaveCount(
    0,
  );
  await expect(page.locator(".header-cta")).toBeInViewport();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("video.ready")).toHaveAttribute(
    "data-orientation",
    "portrait",
  );
});
