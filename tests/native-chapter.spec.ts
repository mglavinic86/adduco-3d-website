import { test, expect } from "@playwright/test";

for (const mode of [
  "reduced motion",
  "data saver",
  "rejected playback",
  "missing media",
] as const) {
  test(`${mode} keeps scene captions and business navigation available`, async ({
    page,
  }) => {
    const media: string[] = [];
    page.on("request", (r) => {
      if (r.url().endsWith(".mp4")) media.push(r.url());
    });
    if (mode === "reduced motion")
      await page.emulateMedia({ reducedMotion: "reduce" });
    if (mode === "data saver")
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "connection", {
          value: { saveData: true },
          configurable: true,
        });
      });
    if (mode === "rejected playback")
      await page.addInitScript(() => {
        HTMLMediaElement.prototype.play = () =>
          Promise.reject(new DOMException("Policy", "NotAllowedError"));
      });
    if (mode === "missing media")
      await page.route("**/*.mp4", (route) => route.abort());
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
    ).toBeVisible();
    await page.keyboard.press("PageDown");
    await expect(
      page.getByRole("heading", { name: "Snaga je u detalju." }),
    ).toBeVisible();
    await expect(
      page.locator('.chapter-still[data-visible="true"] img'),
    ).toHaveJSProperty("complete", true);
    await expect(page.locator('video[data-visible="true"]')).toHaveCount(0);
    await page.keyboard.press("PageUp");
    await expect(
      page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Razgovarajmo o vašem projektu" })
      .first()
      .click();
    await expect(page.locator("#kontakt")).toBeInViewport();
    await expect(page.getByLabel("Ime i prezime *")).toBeVisible();
    if (mode === "reduced motion" || mode === "data saver")
      expect(media).toEqual([]);
  });
}

test("a stalled movie releases the gesture and reveals its destination caption", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      return new Promise(() => {});
    };
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("PageDown");
  await expect(
    page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole("progressbar")).toBeHidden();
  const fallback = page.locator('.chapter-still[data-visible="true"] img');
  await expect(fallback).toHaveJSProperty("complete", true);
  expect(
    await fallback.evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0);
  await expect(page.locator('video[data-visible="true"]')).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Scene filmske priče" })
    .getByRole("link", { name: "O nama", exact: true })
    .click();
  await expect(page.locator("#o-nama")).toBeInViewport();
});

test("rotation during playback settles on the matching new-orientation still", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("PageDown");
  await expect
    .poll(() =>
      page
        .locator('video[data-transition="1"][data-direction="forward"]')
        .evaluate((v: HTMLVideoElement) => v.currentTime),
    )
    .toBeGreaterThan(0.1);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible();
  await expect(page.locator('video[data-visible="true"]')).toHaveCount(0);
  await expect
    .poll(() =>
      page
        .locator('.chapter-still[data-visible="true"] img')
        .evaluate((i: HTMLImageElement) => i.currentSrc),
    )
    .toContain("landscape-end.webp");
  await page.keyboard.press("PageUp");
  await expect(
    page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
  ).toBeVisible({ timeout: 7000 });
  await expect(
    page.locator('video[data-transition="1"][data-direction="reverse"]'),
  ).toHaveJSProperty("ended", true);
});

test("contact can interrupt playback; returning to the opening starts the next request from zero", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("PageDown");
  const forward = page.locator(
    'video[data-transition="1"][data-direction="forward"]',
  );
  await expect
    .poll(() => forward.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0.15);
  await page
    .getByRole("link", { name: "Razgovarajmo o vašem projektu" })
    .first()
    .click();
  await expect(page.locator("#kontakt")).toBeInViewport();
  await expect(forward).toHaveJSProperty("paused", true);
  await page.getByRole("link", { name: "Adduco — početna" }).click();
  await expect(
    page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
  ).toBeVisible();
  await expect(forward).toHaveJSProperty("currentTime", 0);
  // Direct scene navigation is available without any scroll gesture.
  await page.getByRole("link", { name: "2 — Betonski radovi" }).click();
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible({ timeout: 7000 });
  await expect(forward).toHaveJSProperty("ended", true);
});

test("direct detail hash opens a stationary destination and preserves business links", async ({
  page,
}) => {
  await page.goto("/#povjerenje");
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible();
  expect(
    await page
      .locator("video")
      .evaluateAll((videos) =>
        videos.every((v) => (v as HTMLVideoElement).paused),
      ),
  ).toBe(true);
  await page.getByRole("link", { name: "Istražite usluge" }).click();
  await expect(page.locator("#usluge")).toBeInViewport();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeInViewport();
});

test("a failed partial playback can later restart from its first frame", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      this.dataset.starts = JSON.stringify([
        ...JSON.parse(this.dataset.starts || "[]"),
        this.currentTime,
      ]);
      return play.call(this);
    };
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("PageDown");
  const forward = page.locator(
    'video[data-transition="1"][data-direction="forward"]',
  );
  await expect
    .poll(() => forward.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0.5);
  await forward.evaluate((v) => v.dispatchEvent(new Event("error")));
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible();
  await page.keyboard.press("PageUp");
  await expect(
    page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
  ).toBeVisible({ timeout: 7000 });
  await expect(
    page.locator('video[data-transition="1"][data-direction="reverse"]'),
  ).toHaveJSProperty("ended", true);
  await page.keyboard.press("PageDown");
  await expect.poll(() => forward.getAttribute("data-starts")).toBe("[0,0]");
});
