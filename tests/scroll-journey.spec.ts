import { expect, test } from "@playwright/test";
test("all four scenes follow native scrolling, reverse, and keep normal exits", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Prizori", exact: true });
  for (const [name, title] of [
    ["3 — Visokogradnja", "Gradimo u visinu."],
    ["4 — Vaš projekt", "Vaš projekt počinje razgovorom."],
    ["2 — Betonski radovi", "Snaga je u detalju."],
    ["1 — Vizija", "Od vizije do stvarnosti."],
  ]) {
    await nav.getByRole("link", { name, exact: true }).click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  }
  await nav.getByRole("link", { name: "O nama" }).click();
  await expect(page.locator("#o-nama")).toBeInViewport();
});
test("later films remain unrequested until approaching their transitions", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".mp4")) requests.push(r.url());
  });
  await page.goto("/");
  await expect.poll(() => new Set(requests).size).toBe(1);
  await page.waitForTimeout(350);
  expect(new Set(requests).size).toBe(1);
  await page
    .getByRole("link", { name: "3 — Visokogradnja", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Gradimo u visinu." }),
  ).toBeVisible();
  // The immediate caption is independent of the following native request.
  await expect
    .poll(() => requests.some((x) => x.includes("segment-2")))
    .toBe(true);
});
test("reduced motion supports every scene and requests no movies", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const movies: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".mp4")) movies.push(r.url());
  });
  await page.goto("/#projekt");
  await expect(
    page.getByRole("heading", { name: "Vaš projekt počinje razgovorom." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "3 — Visokogradnja", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Gradimo u visinu." }),
  ).toBeVisible();
  expect(movies).toEqual([]);
});

for (const width of [390, 768, 1440]) {
  test(`every movie presents both directions and survives boundary reversals at ${width}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    await page.goto("/");
    for (const [i, fraction] of [
      [0, 0.9],
      [1, 0.1],
      [0, 0.95],
      [1, 0.9],
      [2, 0.1],
      [1, 0.95],
      [2, 0.9],
      [1, 0.5],
      [0, 0.4],
    ]) {
      await page.evaluate(
        ({ i, fraction }) =>
          window.scrollTo(
            0,
            ([0.25, 2.55, 4.85][i] + fraction * 1.65) *
              document.querySelector<HTMLElement>(".chapter")!.clientHeight,
          ),
        { i, fraction },
      );
      const film = page.locator("video").nth(i);
      await expect(film).toHaveCSS("opacity", "1");
      await expect
        .poll(() => film.evaluate((v: HTMLVideoElement) => v.currentTime))
        .toBeCloseTo(fraction * 8, 1);
      await page.waitForTimeout(180);
      await expect(film).toHaveCSS("opacity", "1");
      expect(await film.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    }
    for (const [i, name] of [
      "1 — Vizija",
      "2 — Betonski radovi",
      "3 — Visokogradnja",
      "4 — Vaš projekt",
    ].entries()) {
      await page.getByRole("link", { name, exact: true }).click();
      await page.waitForTimeout(250);
      await page.screenshot({
        path: info.outputPath(`scene-${i}-${width}.png`),
      });
    }
  });
}

test("a cold requested film keeps outgoing copy, shows buffering, and settles after a stall", async ({
  page,
}) => {
  await page.route("**/assets/scroll/*.mp4", async (route) => {
    await new Promise((r) => setTimeout(r, 8500));
    await route.abort();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() =>
    scrollTo(
      0,
      1.9 * document.querySelector<HTMLElement>(".chapter")!.clientHeight,
    ),
  );
  await expect(
    page.getByRole("heading", {
      name: "Od vizije do stvarnosti.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("status", { name: "Priprema prijelaza" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible({ timeout: 7500 });
  await expect(page.locator(".scroll-still")).toHaveJSProperty(
    "complete",
    true,
  );
  await expect(page.locator(".header-cta")).toBeInViewport();
});
test("keyboard, horizontal input and pinch retain browser-owned scrolling", async ({
  page,
}) => {
  await page.goto("/");
  const prevented = await page.locator(".scroll-stage").evaluate((stage) => {
    const events = [
      new WheelEvent("wheel", {
        deltaX: 100,
        deltaY: 0,
        bubbles: true,
        cancelable: true,
      }),
      new WheelEvent("wheel", {
        deltaY: 100,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    ];
    return events.map((event) => {
      stage.dispatchEvent(event);
      return event.defaultPrevented;
    });
  });
  expect(prevented).toEqual([false, false]);
  await page.keyboard.press("PageDown");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  const beforeSpace = await page.evaluate(() => scrollY);
  await page.keyboard.press("Space");
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(beforeSpace + 100);
});

test("a touch playback policy rejection uses a still without downloading another codec", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () =>
      Promise.reject(new DOMException("Playback policy", "NotAllowedError"));
  });
  const movies = new Set<string>();
  page.on("request", (r) => {
    if (r.url().endsWith(".mp4")) movies.add(r.url());
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
  await page.locator(".scroll-stage").evaluate((stage) => {
    const e = new Event("touchstart", { bubbles: true });
    Object.defineProperty(e, "touches", {
      value: [{ clientX: 180, clientY: 500 }],
    });
    stage.dispatchEvent(e);
  });
  await page.waitForTimeout(300);
  expect(movies.size).toBe(1);
  await page
    .getByRole("link", { name: "2 — Betonski radovi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible();
});
