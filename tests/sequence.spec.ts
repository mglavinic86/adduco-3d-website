import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test("phone opens with a prepared frame and scrolls without video seeking", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const movies: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".mp4")) movies.push(request.url());
  });
  await page.goto("/");
  const scene = page.locator("canvas.world-sequence.ready");
  await expect(scene).toBeVisible();
  await expect(scene).toHaveAttribute("data-frame", "0");
  await page.evaluate(() => window.scrollTo({ top: 350, behavior: "instant" }));
  await expect
    .poll(() => scene.getAttribute("data-frame").then(Number))
    .toBeGreaterThan(25);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(scene).toHaveAttribute("data-frame", "0");
  expect(movies).toEqual([]);
  await page.locator(".header-cta").click();
  await expect(page.getByRole("dialog", { name: "Kontakt" })).toBeVisible();
});

async function move(page: import("@playwright/test").Page, frame: number) {
  await page.evaluate(
    (frame) =>
      window.scrollTo({
        top: (document.getElementById("povjerenje")!.offsetTop * frame) / 192,
        behavior: "instant",
      }),
    frame,
  );
}

async function settled(page: import("@playwright/test").Page, frame: number) {
  await expect(page.locator("canvas.world-sequence.ready")).toHaveAttribute(
    "data-frame",
    String(frame),
  );
}

test("a delayed future packet cannot block cached reverse motion or repaint an obsolete pose", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/portrait-v1/016.bin", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/");
  await settled(page, 0);
  await move(page, 180);
  await settled(page, 180);
  await move(page, 208);
  await expect
    .poll(() =>
      page.locator("canvas.ready").getAttribute("data-frame").then(Number),
    )
    .toBeGreaterThan(186);
  await page.waitForTimeout(150);
  await move(page, 165);
  // Earlier compressed packets are cached even when their bitmaps were evicted.
  // Downloading a future packet must not occupy the available decode slots.
  await settled(page, 165);
  release();
  await page.waitForTimeout(500);
  await settled(page, 165);
  await expect(page.locator("canvas.ready")).toHaveCSS("opacity", "1");
  await page.locator(".header-cta").click();
  await expect(page.getByRole("dialog", { name: "Kontakt" })).toBeVisible();
});

test("prepared frames remain paced across fast reversals and both joins", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await settled(page, 0);
  // Populate compressed packets before measuring rendering independently of the network.
  await move(page, 432);
  await settled(page, 432);
  await move(page, 150);
  await settled(page, 150);
  const samples = await page.evaluate(async () => {
    const scene = document.querySelector<HTMLCanvasElement>("canvas.ready")!;
    const distance = document.getElementById("povjerenje")!.offsetTop;
    const samples: { wall: number; frame: number; target: number }[] = [];
    const observer = new MutationObserver(() => {
      samples.push({
        wall: performance.now(),
        frame: Number(scene.dataset.frame),
        target: (scrollY / distance) * 192,
      });
    });
    observer.observe(scene, {
      attributes: true,
      attributeFilter: ["data-frame"],
    });
    const pause = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    for (const target of [215, 170, 220, 165, 420, 365, 410, 355]) {
      window.scrollTo({ top: (distance * target) / 192, behavior: "instant" });
      await pause(target === 420 ? 2100 : 600);
    }
    await pause(800);
    observer.disconnect();
    return samples;
  });
  const motion = samples.slice(1).flatMap((sample, i) =>
    Math.abs(samples[i].target - samples[i].frame) > 8
      ? [
          {
            gap: sample.wall - samples[i].wall,
            jump: Math.abs(sample.frame - samples[i].frame),
            obsolete:
              (sample.frame - samples[i].frame) *
                (sample.target - samples[i].frame) <
              0,
          },
        ]
      : [],
  );
  const gaps = motion.map((s) => s.gap).sort((a, b) => a - b);
  const report = {
    count: samples.length,
    medianGapMs: gaps[Math.floor(gaps.length * 0.5)],
    p95GapMs: gaps[Math.floor(gaps.length * 0.95)],
    maxGapMs: gaps.at(-1),
    maxJump: Math.max(...motion.map((s) => s.jump)),
    obsolete: motion.filter((s) => s.obsolete).length,
    samples,
  };
  await writeFile(
    `/tmp/adduco-sequence-${testInfo.project.name}-pacing.json`,
    JSON.stringify(report),
  );
  await testInfo.attach("sequence-pacing", {
    body: JSON.stringify(report),
    contentType: "application/json",
  });
  expect(samples.length).toBeGreaterThan(120);
  expect(samples.some((s) => s.frame > 384)).toBe(true);
  expect(report.p95GapMs).toBeLessThan(55);
  expect(report.maxJump).toBeLessThanOrEqual(4);
  expect(report.obsolete).toBe(0);
  await settled(page, 355);
});

test("decoded image memory stays bounded and is released for reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const counts = { live: 0, peak: 0, total: 0 };
    Object.assign(window, { bitmapCounts: counts });
    const original = window.createImageBitmap.bind(window);
    window.createImageBitmap = (async (
      ...args: Parameters<typeof createImageBitmap>
    ) => {
      const image = await original(...args);
      counts.total++;
      counts.live++;
      counts.peak = Math.max(counts.peak, counts.live);
      const close = image.close.bind(image);
      let closed = false;
      image.close = () => {
        if (!closed) {
          closed = true;
          counts.live--;
        }
        close();
      };
      return image;
    }) as typeof createImageBitmap;
  });
  await page.goto("/");
  await settled(page, 0);
  for (const frame of [240, 410, 60]) {
    await move(page, frame);
    await settled(page, frame);
  }
  const counts = await page.evaluate(
    () =>
      (
        window as unknown as {
          bitmapCounts: { live: number; peak: number; total: number };
        }
      ).bitmapCounts,
  );
  expect(counts.total).toBeGreaterThan(300);
  expect(counts.peak).toBeLessThanOrEqual(21);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("canvas.world-sequence")).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { bitmapCounts: { live: number } }).bitmapCounts
            .live,
      ),
    )
    .toBe(0);
  await page.locator(".header-cta").click();
  await expect(page.getByRole("dialog", { name: "Kontakt" })).toBeVisible();
});

for (const corrupt of [false, true]) {
  test(`unavailable frame packets retain usable stills and contact (${corrupt ? "invalid bytes" : "network failure"})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route("**/portrait-v1/000.bin", (route) =>
      corrupt ? route.fulfill({ body: "not an image packet" }) : route.abort(),
    );
    await page.goto("/");
    await expect(page.locator(".world-stills img.active")).toBeVisible();
    await expect(page.locator("canvas.world-sequence")).toHaveCount(0);
    await page.locator(".header-cta").click();
    await expect(page.getByRole("dialog", { name: "Kontakt" })).toBeVisible();
  });
}

test("orientation changes retain the old scene until the replacement is ready", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // Model a compositor withholding video presentation callbacks while the
  // retained opaque canvas covers it. Completed media seeks still fire.
  await page.addInitScript(() => {
    const callback = HTMLVideoElement.prototype.requestVideoFrameCallback;
    HTMLVideoElement.prototype.requestVideoFrameCallback = function (render) {
      return callback.call(this, (now, metadata) => {
        const deliver = () => {
          if (document.querySelector("canvas.ready")) setTimeout(deliver, 16);
          else render(now, metadata);
        };
        deliver();
      });
    };
  });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/construction-landscape-*.mp4", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/");
  await settled(page, 0);
  await move(page, 70);
  await settled(page, 70);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator("canvas.ready")).toBeVisible();
  await page.waitForTimeout(200);
  await expect(page.locator("canvas.ready")).toBeVisible();
  release();
  await expect(page.locator("video.ready")).toBeVisible();
  await expect(page.locator("canvas.world-sequence")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("canvas.ready")).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  await move(page, 0);
  await settled(page, 0);
});

test("poster and both camera joins preserve the same geometry", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await settled(page, 0);
  const pixels = () =>
    page.locator("canvas.ready").evaluate((source: HTMLCanvasElement) => {
      const small = document.createElement("canvas");
      small.width = 180;
      small.height = 320;
      const context = small.getContext("2d")!;
      context.drawImage(source, 0, 0, 180, 320);
      return Array.from(context.getImageData(0, 0, 180, 320).data);
    });
  const poster = await page
    .locator(".world-stills img.active")
    .evaluate(async (source: HTMLImageElement) => {
      await source.decode();
      const small = document.createElement("canvas");
      small.width = 180;
      small.height = 320;
      const context = small.getContext("2d")!;
      context.drawImage(source, 0, 0, 180, 320);
      return Array.from(context.getImageData(0, 0, 180, 320).data);
    });
  const rms = (a: number[], b: number[]) =>
    Math.sqrt(
      a.reduce(
        (sum, value, index) =>
          sum + (index % 4 === 3 ? 0 : (value - b[index]) ** 2),
        0,
      ) /
        (180 * 320 * 3),
    );
  const opening = rms(poster, await pixels());
  await writeFile(
    `/tmp/adduco-sequence-${testInfo.project.name}-opening.json`,
    JSON.stringify({ opening }),
  );
  expect(opening).toBeLessThan(8);
  const joins = [];
  for (const boundary of [192, 384]) {
    await move(page, boundary - 1);
    await settled(page, boundary - 1);
    const before = await pixels();
    await move(page, boundary);
    await settled(page, boundary);
    const delta = rms(before, await pixels());
    joins.push(delta);
    expect(delta).toBeLessThan(12);
  }
  await testInfo.attach("sequence-image-continuity", {
    body: JSON.stringify({ opening, joins }),
    contentType: "application/json",
  });
});

test("cached reverse travel survives interruption and failed later downloads", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let available = true;
  await page.route("**/portrait-v1/*.bin", (route) =>
    available ? route.continue() : route.abort(),
  );
  await page.goto("/");
  await settled(page, 0);
  await move(page, 280);
  await settled(page, 280);
  available = false;
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  for (const frame of [140, 235, 50]) {
    await move(page, frame);
    await settled(page, frame);
  }
});
