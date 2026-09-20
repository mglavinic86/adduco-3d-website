import { expect, test } from "@playwright/test";

test("direct scene links work again after free scrolling away from the same hash", async ({
  page,
}) => {
  await page.goto("/");
  const film = page.locator("video").first();
  const end = page.getByRole("link", {
    name: "2 — Betonski radovi",
    exact: true,
  });
  await end.click();
  await expect
    .poll(() => film.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(7.9);
  await page.evaluate(() => window.scrollTo(0, innerHeight));
  await expect
    .poll(() => film.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeLessThan(4);
  await end.click();
  await expect
    .poll(() => film.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(7.9);
});

test("direct camera primes once on one-finger touch, ignores pinch and stays paused", async ({
  page,
}) => {
  await page.goto("/");
  await expect
    .poll(() =>
      page
        .locator("video")
        .first()
        .evaluate((v: HTMLVideoElement) => v.readyState),
    )
    .toBe(4);
  const state = await page.locator(".scroll-stage").evaluate(async (stage) => {
    const film = stage.querySelector("video")!;
    let plays = 0;
    film.addEventListener("play", () => {
      plays++;
    });
    const touch = (count: number) => {
      const event = new Event("touchstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, "touches", {
        value: Array.from({ length: count }, (_, i) => ({
          identifier: i,
          target: stage,
          clientX: 180 + i * 40,
          clientY: 500,
        })),
      });
      stage.dispatchEvent(event);
      return event.defaultPrevented;
    };
    const pinchPrevented = touch(2);
    await new Promise((r) => setTimeout(r, 100));
    const pinchPlays = plays;
    const touchPrevented = touch(1);
    await new Promise((r) => setTimeout(r, 200));
    touch(1);
    await new Promise((r) => setTimeout(r, 100));
    return {
      plays,
      pinchPlays,
      pinchPrevented,
      touchPrevented,
      paused: film.paused,
    };
  });
  expect(state).toEqual({
    plays: 1,
    pinchPlays: 0,
    pinchPrevented: false,
    touchPrevented: false,
    paused: true,
  });
  await page.evaluate(() => window.scrollTo(0, innerHeight));
  await expect(page.locator("video").first()).toHaveCSS("opacity", "1");
});

test("direct camera keeps the still until scrolling presents a real video frame", async ({
  page,
}) => {
  await page.goto("/");
  const film = page.locator('video[data-scroll-film="scroll"]').first();
  await expect
    .poll(() => film.evaluate((v: HTMLVideoElement) => v.readyState))
    .toBe(4);
  await expect(film).toHaveCSS("opacity", "0");
  await page.evaluate(() => window.scrollTo(0, innerHeight));
  await expect(film).toHaveCSS("opacity", "1");
  expect(await film.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
});

test("direct camera follows native scroll, holds, and returns to the latest position", async ({
  page,
}) => {
  await page.goto("/");

  const film = page.locator('video[data-scroll-film="scroll"]').first();
  await expect
    .poll(() => film.evaluate((v: HTMLVideoElement) => v.readyState))
    .toBeGreaterThanOrEqual(2);
  await page.evaluate(() => window.scrollTo(0, innerHeight * 1.5));
  await expect
    .poll(() => film.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(2);
  const held = await film.evaluate((v: HTMLVideoElement) => v.currentTime);
  await page.waitForTimeout(250);
  expect(
    await film.evaluate((v: HTMLVideoElement) => v.currentTime),
  ).toBeCloseTo(held, 1);
  expect(await film.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, innerHeight * 0.8));
  await expect
    .poll(() => film.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeLessThan(held - 0.5);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.getByRole("link", { name: "1 — Vizija", exact: true }).click();
  await expect
    .poll(() => film.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeLessThan(0.05);
  await expect(
    page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
  ).toBeVisible();
});

for (const mode of ["scroll"]) {
  test(`${mode}: reduced motion loads no video and retains direct content exits`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const movies: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith(".mp4")) movies.push(request.url());
    });
    await page.goto(`/`);
    await expect(
      page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "2 — Betonski radovi", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Snaga je u detalju." }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "Prizori", exact: true })
      .getByRole("link", { name: "O nama" })
      .click();
    await expect(page.locator("#o-nama")).toBeInViewport();
    expect(movies).toEqual([]);
  });

  test(`${mode}: unavailable video retains artwork, captions and navigation`, async ({
    page,
  }) => {
    await page.route("**/assets/scroll/*.mp4", (route) =>
      route.fulfill({ status: 404, body: "" }),
    );
    await page.goto(`/`);
    await page
      .getByRole("link", { name: "2 — Betonski radovi", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Snaga je u detalju." }),
    ).toBeVisible();
    const last = page.locator('img[src$="end.webp"]');
    await expect(last).toBeVisible();
    await expect(last).toHaveCSS("opacity", "1");
    await page.locator(".header-cta").click();
    await expect(page.locator("#kontakt")).toBeInViewport();
  });
}

for (const width of [390, 768, 1440]) {
  test(`selected A: artwork, controls and active-film exits at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    for (const mode of ["scroll"]) {
      const loaded: string[] = [];
      page.on("request", (request) => {
        if (request.url().endsWith(".mp4")) loaded.push(request.url());
      });
      await page.goto(`/`);
      await expect
        .poll(() =>
          page
            .locator("video")
            .first()
            .evaluate((v: HTMLVideoElement) => v.readyState),
        )
        .toBe(4);
      if (mode === "scroll")
        await page.evaluate(() => window.scrollTo(0, innerHeight * 1.1));
      else await page.keyboard.press("PageDown");
      const cta = page.locator(".header-cta");
      const exit = page
        .getByRole("navigation", { name: "Prizori", exact: true })
        .getByRole("link", { name: "O nama" });
      for (const link of [cta, exit]) {
        await expect(link).toBeInViewport();
        const box = (await link.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(
          await link.evaluate((el) => {
            const r = el.getBoundingClientRect();
            return el.contains(
              document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2),
            );
          }),
        ).toBe(true);
      }
      await page.waitForTimeout(mode === "native" ? 350 : 150);
      await page.screenshot({
        path: testInfo.outputPath(`${mode}-${width}.png`),
      });
      const orientation =
        width / (width === 1440 ? 900 : 844) <= 0.9 ? "portrait" : "landscape";
      expect(loaded.length).toBeGreaterThan(0);
      expect(loaded.every((url) => url.includes(`/${orientation}-`))).toBe(
        true,
      );
      await exit.click();
      await expect(page.locator("#o-nama")).toBeInViewport();
    }
  });
}

test("a late compositor callback never locks subsequent scroll input", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const native = HTMLVideoElement.prototype.requestVideoFrameCallback;
    let stale = true;
    HTMLVideoElement.prototype.requestVideoFrameCallback = function (callback) {
      return native.call(this, (now, metadata) => {
        if (stale) {
          stale = false;
          callback(now, {
            ...metadata,
            mediaTime: metadata.mediaTime - 1 / 24,
          });
        } else callback(now, metadata);
      });
    };
  });
  await page.goto("/");
  await expect
    .poll(() =>
      page
        .locator("video")
        .first()
        .evaluate((v: HTMLVideoElement) => v.readyState),
    )
    .toBe(4);
  await page.evaluate(() => window.scrollTo(0, innerHeight));
  await page.waitForTimeout(150);
  await page
    .getByRole("link", { name: "2 — Betonski radovi", exact: true })
    .click();
  await expect
    .poll(() =>
      page
        .locator("video")
        .first()
        .evaluate((v: HTMLVideoElement) => v.currentTime),
    )
    .toBeGreaterThan(7.9);
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible();
});

test("orientation changes keep the reading and camera position", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect
    .poll(() =>
      page
        .locator("video")
        .first()
        .evaluate((v: HTMLVideoElement) => v.readyState),
    )
    .toBe(4);
  await page.evaluate(() =>
    window.scrollTo(
      0,
      (0.25 + 0.6 * 1.65) *
        document.querySelector<HTMLElement>(".chapter")!.clientHeight,
    ),
  );
  await expect
    .poll(() =>
      page
        .locator("video")
        .first()
        .evaluate((v: HTMLVideoElement) => v.currentTime),
    )
    .toBeCloseTo(4.8, 1);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator("video").first()).toHaveAttribute(
    "src",
    /landscape/,
  );
  await expect
    .poll(() =>
      page
        .locator("video")
        .first()
        .evaluate((v: HTMLVideoElement) => v.currentTime),
    )
    .toBeCloseTo(4.8, 1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("video").first()).toHaveAttribute(
    "src",
    /portrait/,
  );
  await expect
    .poll(() =>
      page
        .locator("video")
        .first()
        .evaluate((v: HTMLVideoElement) => v.currentTime),
    )
    .toBeCloseTo(4.8, 1);
});

test("Data Saver keeps the scene stills and never requests a movie", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "connection", {
      value: { saveData: true },
    }),
  );
  const movies: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".mp4")) movies.push(r.url());
  });
  await page.goto("/");
  await page
    .getByRole("link", { name: "2 — Betonski radovi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible();
  expect(movies).toEqual([]);
});
