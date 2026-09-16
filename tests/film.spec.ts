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

test("portrait composition fills the scene and automatically loads only its own film", async ({
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
  await expect(page.locator("#vizija .text-link")).toBeInViewport();
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
  // The preceding movie already reaches the shared Visokogradnja anchor.
  // Its caption may be active; the decoded image must remain fully visible.
  await expect(page.locator("video.ready")).toHaveCSS("opacity", "1");
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

test("phone animation follows scrolling automatically without playback buttons", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /Pokreni animaciju|Zaustavi animaciju/ }),
  ).toHaveCount(0);
  await expect(page.locator("video.ready")).toBeVisible();
  await page.mouse.wheel(0, 450);
  await expect
    .poll(() =>
      page
        .locator("video.ready")
        .evaluate((v: HTMLVideoElement) => v.currentTime),
    )
    .toBeGreaterThan(1);
  await page.mouse.wheel(0, -450);
  await expect
    .poll(() =>
      page
        .locator("video.ready")
        .evaluate((v: HTMLVideoElement) => v.currentTime),
    )
    .toBeLessThan(0.1);
});

test("prepares the next phone film for seeking and retains it when reversing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
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
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("construction-portrait-"))
      requests.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator("video.ready")).toBeVisible();
  await page.mouse.wheel(0, 800);
  const next = page.locator('video[data-segment="1"]');
  await expect
    .poll(() =>
      next.evaluateAll((videos) =>
        videos.map((v) => (v as HTMLVideoElement).currentSrc),
      ),
    )
    .toEqual([expect.stringMatching(/^blob:/)]);
  const previous = await page
    .locator('video[data-segment="0"]')
    .elementHandle();
  await page.locator('.journey-dock a[href="#povjerenje"]').click();
  await expect(page.locator("video.ready")).toHaveAttribute(
    "data-segment",
    "1",
  );
  expect(await previous!.evaluate((v) => v.isConnected)).toBe(true);
  const fetched = requests.filter((url) => url.includes("-0.mp4")).length;
  await page.locator('.journey-dock a[href="#vizija"]').click();
  await expect(page.locator("video.ready")).toHaveAttribute(
    "data-segment",
    "0",
  );
  expect(requests.filter((url) => url.includes("-0.mp4"))).toHaveLength(
    fetched,
  );
});

test("a sharp scroll eases through intermediate frames", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("video.ready")).toBeVisible();
  const samples = await page.evaluate(async () => {
    const video = document.querySelector<HTMLVideoElement>("video.ready")!;
    const values: number[] = [];
    const record = () => values.push(video.currentTime);
    video.addEventListener("seeking", record);
    await new Promise((resolve) => setTimeout(resolve, 250));
    const distance = document.getElementById("povjerenje")!.offsetTop;
    window.scrollTo({ top: distance * 0.7, behavior: "instant" });
    await new Promise((resolve) => setTimeout(resolve, 700));
    video.removeEventListener("seeking", record);
    return { values, end: video.currentTime };
  });
  expect(
    samples.values.filter((time) => time > 0.1 && time < 5).length,
  ).toBeGreaterThan(3);
  expect(samples.values[0]).toBeLessThan(2);
  // A fling is paced instead of racing through 5.6 source seconds in 700ms.
  expect(samples.end).toBeGreaterThan(1);
  await expect
    .poll(
      () =>
        page
          .locator("video.ready")
          .getAttribute("data-presented-time")
          .then(Number),
      { timeout: 3000 },
    )
    .toBeGreaterThan(5.4);
});

test("caption stays with the last decoded image when the decoder stalls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("video.ready")).toBeVisible();
  await page.locator("video.ready").evaluate((video: HTMLVideoElement) => {
    const time = video.currentTime;
    Object.defineProperty(video, "currentTime", {
      get: () => time,
      set: () => {},
    });
  });
  await page.mouse.wheel(0, 700);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(600);
  await expect(page.locator("#vizija .chapter-content")).toHaveCSS(
    "opacity",
    "1",
  );
});

test("rotation does not flash the incoming movie's unrequested opening frame", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("video.ready")).toBeVisible();
  await page.mouse.wheel(0, 700);
  await expect
    .poll(() =>
      page
        .locator("video.ready")
        .evaluate((v: HTMLVideoElement) => v.currentTime),
    )
    .toBeGreaterThan(2.7);
  await page.evaluate(() => {
    const times: number[] = [];
    const observer = new MutationObserver(() => {
      const video = document.querySelector<HTMLVideoElement>(
        'video.ready[data-orientation="landscape"]',
      );
      if (video) times.push(Number(video.dataset.presentedTime));
    });
    observer.observe(document.querySelector(".world-film-stage")!, {
      subtree: true,
      attributes: true,
    });
    (window as unknown as { rotationFrames: number[] }).rotationFrames = times;
  });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator("video.ready")).toHaveAttribute(
    "data-orientation",
    "landscape",
  );
  const times = await page.evaluate(
    () => (window as unknown as { rotationFrames: number[] }).rotationFrames,
  );
  expect(times.length).toBeGreaterThan(0);
  expect(Math.min(...times)).toBeGreaterThan(0.1);
});

test("continuous phone scrolling presents intermediate frames in both directions", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("video.ready")).toBeVisible();
  const result = await page.evaluate(async () => {
    const video = document.querySelector<HTMLVideoElement>("video.ready")!;
    const frames: { wall: number; media: number; scroll: number }[] = [];
    let callback: number;
    const record: VideoFrameRequestCallback = (wall, metadata) => {
      frames.push({ wall, media: metadata.mediaTime, scroll: window.scrollY });
      callback = video.requestVideoFrameCallback(record);
    };
    callback = video.requestVideoFrameCallback(record);
    const distance = document.getElementById("povjerenje")!.offsetTop * 0.8;
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const move = (now: number) => {
        const elapsed = now - start;
        const part =
          elapsed < 3000 ? elapsed / 3000 : 1 - (elapsed - 3000) / 3000;
        window.scrollTo({
          top: Math.max(0, distance * part),
          behavior: "instant",
        });
        if (elapsed < 6000) requestAnimationFrame(move);
        else resolve();
      };
      requestAnimationFrame(move);
    });
    await new Promise((resolve) => setTimeout(resolve, 750));
    video.cancelVideoFrameCallback(callback);
    return { frames, start, finalTime: video.currentTime };
  });
  const forward = result.frames.filter(
    (frame) => frame.wall < result.start + 3000,
  );
  const reverse = result.frames.filter(
    (frame) =>
      frame.wall > result.start + 3300 && frame.wall < result.start + 6000,
  );
  expect(forward.length).toBeGreaterThan(30);
  expect(reverse.length).toBeGreaterThan(30);
  expect(result.finalTime).toBeLessThan(0.1);
  const gaps = result.frames
    .slice(1)
    .map((frame, i) => frame.wall - result.frames[i].wall)
    .sort((a, b) => a - b);
  await testInfo.attach("presented-frame-timing", {
    body: JSON.stringify({
      frames: result.frames.length,
      forward: forward.length,
      reverse: reverse.length,
      medianGapMs: gaps[Math.floor(gaps.length * 0.5)],
      p95GapMs: gaps[Math.floor(gaps.length * 0.95)],
      maxGapMs: gaps.at(-1),
      samples: result.frames,
    }),
    contentType: "application/json",
  });
});

test("older browsers animate without frame callbacks and reduced-motion phones keep stills", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  await context.addInitScript(() => {
    Object.defineProperty(
      HTMLVideoElement.prototype,
      "requestVideoFrameCallback",
      { value: undefined },
    );
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("video.ready")).toBeVisible();
  await page.mouse.wheel(0, 700);
  await expect
    .poll(() =>
      page
        .locator("video.ready")
        .evaluate((v: HTMLVideoElement) => v.currentTime),
    )
    .toBeGreaterThan(2.7);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("video")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Pokreni animaciju|Zaustavi animaciju/ }),
  ).toHaveCount(0);
  await page.locator(".header-cta").click();
  await expect(page.getByLabel("Ime i prezime *")).toBeInViewport();
  await context.close();
});
