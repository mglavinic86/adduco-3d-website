import { test, expect } from "@playwright/test";

test("prepared scenes remain scrollable after interruption when further downloads fail", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  // Prevent HTTP cache from concealing a discarded prepared movie.
  let downloadsAvailable = true;
  await page.route("**/*.mp4", (route) =>
    downloadsAvailable ? route.continue() : route.abort(),
  );
  await page.addInitScript(() => {
    const ranges = Object.getOwnPropertyDescriptor(
      HTMLMediaElement.prototype,
      "seekable",
    )!;
    Object.defineProperty(HTMLMediaElement.prototype, "seekable", {
      get() {
        return this.currentSrc.startsWith("http")
          ? { length: 1, start: () => 0, end: () => 0 }
          : ranges.get!.call(this);
      },
    });
  });
  await page.goto("/");
  await expect(page.locator("video.ready")).toBeVisible();
  await page.evaluate(() =>
    window.scrollTo({
      top: document.getElementById("povjerenje")!.offsetTop * 1.4,
      behavior: "instant",
    }),
  );
  await expect(page.locator("video.ready")).toHaveAttribute(
    "data-segment",
    "1",
  );
  await expect
    .poll(() =>
      page
        .locator("video")
        .evaluateAll(
          (vs) =>
            vs.filter(
              (v) =>
                (v as HTMLVideoElement).readyState >= 2 &&
                (v as HTMLVideoElement).currentSrc.startsWith("blob:"),
            ).length,
        ),
    )
    .toBe(3);
  downloadsAvailable = false;
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  for (const progress of [0.8, 1.2, 2.2, 0.2]) {
    await page.evaluate(
      (progress) =>
        window.scrollTo({
          top: document.getElementById("povjerenje")!.offsetTop * progress,
          behavior: "instant",
        }),
      progress,
    );
    await expect(page.locator("video.ready")).toHaveAttribute(
      "data-segment",
      String(Math.floor(progress)),
    );
    await expect
      .poll(() =>
        page
          .locator("video.ready")
          .getAttribute("data-presented-time")
          .then(Number),
      )
      .toBeCloseTo((progress % 1) * 8, 1);
  }
  await page.locator(".header-cta").click();
  await expect(page.getByRole("dialog", { name: "Kontakt" })).toBeVisible();
});
