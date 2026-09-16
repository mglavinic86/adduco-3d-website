import { test, expect } from "@playwright/test";

test("the opening artwork has bandwidth priority while contact stays usable", async ({
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
  const movies: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".mp4")) movies.push(request.url());
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".site")).toHaveClass(/is-ready/);
  await expect(
    page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
  ).toBeVisible();
  await page.locator(".header-cta").click();
  await expect(page.getByRole("dialog", { name: "Kontakt" })).toBeVisible();
  expect(
    movies,
    "The movie must not compete with the initial still",
  ).toHaveLength(0);
  await page.getByRole("button", { name: "Natrag u priču" }).click();
  release();
  await expect(page.locator("video.ready")).toBeVisible();
  await expect(page.locator("video.ready")).toHaveAttribute(
    "data-presented-time",
    "0",
  );
  expect(movies.every((url) => url.includes("portrait-v2-0"))).toBe(true);
});

test("a hidden page releases unused movies and returns to the retained pose", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
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
    const revoked: string[] = [];
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = (url: string) => {
      revoked.push(url);
      revoke(url);
    };
    (window as unknown as { revokedMovies: string[] }).revokedMovies = revoked;
  });
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".mp4")) requests.push(r.url());
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
        .locator("video.ready")
        .getAttribute("data-presented-time")
        .then(Number),
    )
    .toBeCloseTo(3.2, 1);
  await expect
    .poll(() =>
      page
        .locator("video")
        .evaluateAll(
          (vs) =>
            vs.filter((v) =>
              (v as HTMLVideoElement).currentSrc.startsWith("blob:"),
            ).length,
        ),
    )
    .toBe(3);
  const shown = await page.locator("video.ready").elementHandle();
  const pose = await shown!.getAttribute("data-presented-time");
  const unused = await page
    .locator("video:not(.ready)")
    .evaluateAll((vs) => vs.map((v) => (v as HTMLVideoElement).currentSrc));
  const position = await page.evaluate(() => scrollY);
  await page.evaluate(() => {
    // Controlled page-lifecycle model; this is not a physical screen-lock test.
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("video")).toHaveCount(1);
  expect(await shown!.evaluate((v) => v.isConnected)).toBe(true);
  const revoked = await page.evaluate(
    () => (window as unknown as { revokedMovies: string[] }).revokedMovies,
  );
  expect(revoked).toEqual(expect.arrayContaining(unused));
  const requestCount = requests.length;
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await page.waitForTimeout(200);
  expect(requests).toHaveLength(requestCount);
  expect(await shown!.getAttribute("data-presented-time")).toBe(pose);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator('video[data-segment="2"]')).toHaveCount(1);
  expect(await shown!.getAttribute("class")).toContain("ready");
  expect(await shown!.getAttribute("data-presented-time")).toBe(pose);
  expect(await page.evaluate(() => scrollY)).toBe(position);
  await page.locator('.journey-dock a[href="#vizija"]').click();
  await expect(page.locator("video.ready")).toHaveAttribute(
    "data-segment",
    "0",
  );
  await expect(page.locator("video.ready")).toHaveAttribute(
    "data-presented-time",
    "0",
  );
  await expect(
    page.getByRole("button", { name: /Pokreni animaciju|Zaustavi animaciju/ }),
  ).toHaveCount(0);
});

test("returning from page cache during the opening can resume scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      const movie = document.querySelector("video.opening");
      if (!movie) return;
      observer.disconnect();
      // Freeze the opening to model a browser suspending CSS animation events.
      (movie as HTMLElement).style.animationPlayState = "paused";
      window.dispatchEvent(
        new PageTransitionEvent("pagehide", { persisted: true }),
      );
    });
    observer.observe(document, {
      subtree: true,
      attributes: true,
      childList: true,
    });
  });
  await page.goto("/");
  await expect(page.locator("video.ready")).toHaveCSS(
    "animation-play-state",
    "paused",
  );
  await page.evaluate(() => {
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    );
    window.scrollTo({ top: 650, behavior: "instant" });
  });
  await expect(page.locator("video.ready")).not.toHaveClass(/opening/);
  await expect
    .poll(() =>
      page
        .locator("video.ready")
        .getAttribute("data-presented-time")
        .then(Number),
    )
    .toBeGreaterThan(2);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(page.locator("video.ready")).toHaveAttribute(
    "data-presented-time",
    "0",
  );
});

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

test("no-range hosts prepare later movies without duplicate native downloads", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
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
  const nextRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith("construction-portrait-v3-1.mp4"))
      nextRequests.push(r.resourceType());
  });
  await page.goto("/");
  await expect(page.locator("video.ready")).toBeVisible();
  await page.evaluate(() =>
    window.scrollTo({
      top: document.getElementById("povjerenje")!.offsetTop * 0.4,
      behavior: "instant",
    }),
  );
  await expect
    .poll(() =>
      page
        .locator('video[data-segment="1"]')
        .evaluateAll((vs) => vs.map((v) => (v as HTMLVideoElement).currentSrc)),
    )
    .toEqual([expect.stringMatching(/^blob:/)]);
  expect(nextRequests).toEqual(["fetch"]);
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
