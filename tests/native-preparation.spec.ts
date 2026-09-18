import { test, expect } from "@playwright/test";

test("native preparation follows the requested order one movie at a time without autoplay", async ({
  page,
}) => {
  const requests: string[] = [];
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/transition-2/*-forward.mp4", async (route) => {
    await held;
    await route.continue();
  });
  page.on("request", (request) => {
    const match =
      /transition-(\d)\/(?:portrait|landscape)-(forward|reverse)\.mp4/.exec(
        request.url(),
      );
    if (match && !requests.includes(`${match[1]}-${match[2]}`))
      requests.push(`${match[1]}-${match[2]}`);
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect.poll(() => requests).toEqual(["1-forward", "2-forward"]);
    await page.waitForTimeout(400);
    expect(requests).toEqual(["1-forward", "2-forward"]);
    await expect(page.locator("video[src]")).toHaveCount(2);
    release();
    await expect
      .poll(() => requests, { timeout: 15000 })
      .toEqual([
        "1-forward",
        "2-forward",
        "1-reverse",
        "3-forward",
        "2-reverse",
        "3-reverse",
      ]);
    await expect
      .poll(() =>
        page
          .locator("video")
          .evaluateAll((videos: HTMLVideoElement[]) =>
            videos.every(
              (video) =>
                video.readyState === 4 &&
                video.paused &&
                video.currentTime === 0,
            ),
          ),
      )
      .toBe(true);
    for (const video of await page.locator("video").all())
      await expect(video).toHaveAttribute("preload", "auto");
    await expect(
      page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
    ).toBeVisible();
  } finally {
    release();
  }
});

test("rotation replaces native preparation with only the newly selected orientation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect
    .poll(() =>
      page
        .locator("video")
        .evaluateAll((videos: HTMLVideoElement[]) =>
          videos.every(
            (v) => v.readyState === 4 && v.currentSrc.includes("/portrait-"),
          ),
        ),
    )
    .toBe(true);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect
    .poll(() =>
      page
        .locator("video")
        .evaluateAll((videos: HTMLVideoElement[]) =>
          videos.every(
            (v) =>
              v.readyState === 4 &&
              v.paused &&
              v.currentSrc.includes("/landscape-"),
          ),
        ),
    )
    .toBe(true);
  await expect(
    page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
  ).toBeVisible();
});
