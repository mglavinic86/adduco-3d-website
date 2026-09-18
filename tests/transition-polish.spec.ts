import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";

for (const [segment, origin, caption] of [
  [1, "povjerenje", "Od vizije do stvarnosti."],
  [2, "preciznost", "Snaga je u detalju."],
  [3, "projekt", "Gradimo u visinu."],
] as const) {
  test(`reverse ${segment} settlement fades the decoded still over the held final movie frame for 150 ms`, async ({
    page,
  }, testInfo) => {
    await page.goto(`/#${origin}`);
    await page.waitForLoadState("networkidle");
    const film = page.locator(
      `video[data-transition="${segment}"][data-direction="reverse"]`,
    );
    // Sample actual compositor-facing styles on animation frames around native end.
    await film.evaluate((element: HTMLVideoElement) => {
      const samples: unknown[] = [];
      Object.assign(window, { settleSamples: samples });
      element.addEventListener(
        "ended",
        () => {
          const start = performance.now();
          const sample = () => {
            const image = document.querySelector<HTMLElement>(
              '.chapter-still[data-visible="true"]',
            )!;
            const css = getComputedStyle(image);
            samples.push({
              ms: performance.now() - start,
              opacity: Number(css.opacity),
              stillZ: Number(css.zIndex),
              movieZ: Number(getComputedStyle(element).zIndex),
              movieVisible: getComputedStyle(element).visibility === "visible",
              ended: element.ended,
              paused: element.paused,
              captionVisible:
                document.querySelector(
                  '.chapter-content[data-visible="true"]',
                ) !== null,
            });
            if (performance.now() - start < 400) requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        },
        { once: true },
      );
    });
    await page.keyboard.press("PageUp");
    await expect(film).toHaveJSProperty("ended", true);
    await page.waitForTimeout(450);
    const samples = await page.evaluate(
      () =>
        (
          window as unknown as {
            settleSamples: {
              ms: number;
              opacity: number;
              stillZ: number;
              movieZ: number;
              movieVisible: boolean;
              ended: boolean;
              paused: boolean;
              captionVisible: boolean;
            }[];
          }
        ).settleSamples,
    );
    await writeFile(
      `/tmp/adduco-settle-${testInfo.project.name}-${segment}.json`,
      JSON.stringify(samples, null, 2),
    );
    const fading = samples.filter((s) => s.opacity > 0 && s.opacity < 1);
    expect(fading.length).toBeGreaterThanOrEqual(3);
    expect(
      fading.every(
        (s) =>
          s.movieVisible &&
          s.ended &&
          s.paused &&
          s.stillZ > s.movieZ &&
          s.captionVisible,
      ),
    ).toBe(true);
    expect(fading.at(-1)!.ms - fading[0].ms).toBeGreaterThan(80);
    expect(
      samples.some((s) => s.ms >= 150 && s.opacity === 1 && !s.movieVisible),
    ).toBe(true);
    await expect(page.getByRole("heading", { name: caption })).toBeVisible();
  });
}

test("a fresh gesture during the reverse still fade starts the next film without a stale handoff hiding it", async ({
  page,
}) => {
  await page.goto("/#povjerenje");
  await page.waitForLoadState("networkidle");
  await page.locator(".chapter").evaluate((stage) => {
    stage.addEventListener(
      "animationstart",
      (event) => {
        if ((event as AnimationEvent).animationName === "scene-settle")
          document.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: "PageDown",
              bubbles: true,
              cancelable: true,
            }),
          );
      },
      { once: true },
    );
  });
  await page.keyboard.press("PageUp");
  const forward = page.locator(
    'video[data-transition="1"][data-direction="forward"]',
  );
  await expect
    .poll(() => forward.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0.3);
  await expect(forward).toBeVisible();
  await expect(
    page.locator('.chapter-still[data-settling="true"]'),
  ).toHaveCount(0);
  await expect(forward).toHaveJSProperty("ended", true);
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible();
  await expect(page).toHaveURL(/#povjerenje$/);
});

test("a completed film allows the next gesture even while its fallback still is delayed", async ({
  page,
}) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/transition-1/*-end.webp", async (route) => {
    await held;
    await route.continue();
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("PageDown");
  await expect(
    page.locator('video[data-transition="1"][data-direction="forward"]'),
  ).toHaveJSProperty("ended", true);
  await page.keyboard.press("PageDown");
  const next = page.locator(
    'video[data-transition="2"][data-direction="forward"]',
  );
  await expect
    .poll(() => next.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0.1);
  release();
  await expect(next).toHaveJSProperty("ended", true);
  await expect(
    page.getByRole("heading", { name: "Gradimo u visinu." }),
  ).toBeVisible();
});

test("buffering after the early caption keeps it visible when playback resumes", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("PageDown");
  const film = page.locator(
    'video[data-transition="1"][data-direction="forward"]',
  );
  const caption = page.getByRole("heading", { name: "Snaga je u detalju." });
  await expect(caption).toBeVisible();
  await film.evaluate((v: HTMLVideoElement) => {
    v.pause();
    v.dispatchEvent(new Event("waiting"));
  });
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(caption).toBeVisible();
  await film.evaluate((v: HTMLVideoElement) => v.play());
  await expect(page.getByRole("progressbar")).toBeHidden();
  await expect(caption).toBeVisible();
  await expect(film).toHaveJSProperty("ended", true);
});

test("a delayed fallback cannot override later direct scene navigation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () =>
      Promise.reject(new DOMException("Policy", "NotAllowedError"));
  });
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/transition-1/*-end.webp", async (route) => {
    await held;
    await route.continue();
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("PageDown");
  await page.getByRole("link", { name: "4 — Vaš projekt" }).click();
  await expect(
    page.getByRole("heading", { name: "Vaš projekt počinje razgovorom." }),
  ).toBeVisible();
  release();
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: "Vaš projekt počinje razgovorom." }),
  ).toBeVisible();
  await expect(page).toHaveURL(/#projekt$/);
});

test("loading retains the outgoing caption and shows a discreet indicator only after 300 ms", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => play.call(this).then(resolve, reject), 1200);
      });
    };
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("PageDown");
  const outgoing = page.getByRole("heading", {
    name: "Od vizije do stvarnosti.",
  });
  const loading = page.getByRole("progressbar", {
    name: "Učitavanje prijelaza",
  });
  await expect(outgoing).toBeVisible();
  await expect(loading).toBeHidden();
  await expect(loading).toBeVisible({ timeout: 1000 });
  await expect(outgoing).toBeVisible();
  const film = page.locator(
    'video[data-transition="1"][data-direction="forward"]',
  );
  await expect(film).toHaveJSProperty("paused", false);
  await expect(outgoing).toHaveCount(0);
  await expect(loading).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible();
});

test("1.2 seconds of modeled macOS trackpad momentum starts exactly one transition", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.locator(".chapter").evaluate(async (stage) => {
    for (let i = 0; i < 60; i++) {
      stage.dispatchEvent(
        new WheelEvent("wheel", {
          deltaY: 90 * Math.exp(-i / 20),
          bubbles: true,
          cancelable: true,
        }),
      );
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  });
  await expect(
    page.locator('video[data-transition="1"][data-direction="forward"]'),
  ).toHaveJSProperty("ended", true);
  await page.waitForTimeout(400);
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible();
  expect(
    await page
      .locator("video")
      .evaluateAll(
        (videos) =>
          videos.filter((v) => (v as HTMLVideoElement).currentTime > 0).length,
      ),
  ).toBe(1);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test("two-finger touch and pinch are ignored, including releasing one finger", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const prevented = await page.locator(".chapter").evaluate((stage) => {
    const send = (type: string, points: number[]) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, "touches", {
        value: points.map((y, i) => ({
          identifier: i,
          clientX: 180 + i * 40,
          clientY: y,
          target: stage,
        })),
      });
      stage.dispatchEvent(event);
      return event.defaultPrevented;
    };
    return [
      send("touchstart", [500, 500]),
      send("touchmove", [350, 600]),
      send("touchend", [350]),
      send("touchmove", [200]),
      send("touchend", []),
    ];
  });
  expect(prevented).toEqual([false, false, false, false, false]);
  expect(
    await page
      .locator("video")
      .evaluateAll((videos) =>
        videos.every(
          (v) =>
            (v as HTMLVideoElement).paused &&
            (v as HTMLVideoElement).currentTime === 0,
        ),
      ),
  ).toBe(true);
});

test("touch ending outside the stage clears the gesture and leaves exits usable", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.locator(".chapter").evaluate((stage) => {
    for (const [type, y] of [
      ["touchstart", 400],
      ["touchmove", 280],
    ] as const) {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, "touches", {
        value: [{ identifier: 1, clientX: 180, clientY: y, target: stage }],
      });
      stage.dispatchEvent(event);
    }
    const end = new Event("touchend", { bubbles: true, cancelable: true });
    Object.defineProperty(end, "touches", { value: [] });
    document.body.dispatchEvent(end);
  });
  await expect(
    page.locator('video[data-transition="1"][data-direction="forward"]'),
  ).toHaveJSProperty("ended", true);
  const captured = await page.locator(".chapter").evaluate((stage) => {
    const move = new Event("touchmove", { bubbles: true, cancelable: true });
    Object.defineProperty(move, "touches", {
      value: [
        { identifier: 2, clientX: 180, clientY: 200, target: document.body },
      ],
    });
    stage.dispatchEvent(move);
    return move.defaultPrevented;
  });
  expect(captured).toBe(false);
  await page.locator(".scene-exit").click();
  await expect(page.locator("#o-nama")).toBeInViewport();
});

test("Space and PageDown start separate complete transitions; rapid reversal during playback never queues", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Space");
  for (const key of ["PageUp", "PageDown", "ArrowUp", "Space"])
    await page.keyboard.press(key);
  await expect(
    page.locator('video[data-transition="1"][data-direction="forward"]'),
  ).toHaveJSProperty("ended", true);
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible();
  await page.waitForTimeout(350);
  await expect(
    page.locator('video[data-transition="1"][data-direction="reverse"]'),
  ).toHaveJSProperty("currentTime", 0);
  await expect(
    page.locator('video[data-transition="2"][data-direction="forward"]'),
  ).toHaveJSProperty("currentTime", 0);
  await page.keyboard.press("PageDown");
  await expect(
    page.locator('video[data-transition="2"][data-direction="forward"]'),
  ).toHaveJSProperty("ended", true);
  await expect(
    page.getByRole("heading", { name: "Gradimo u visinu." }),
  ).toBeVisible();
});

test("iOS-style downward overscroll at scene zero is not captured", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const prevented = await page.locator(".chapter").evaluate((stage) => {
    return ["touchstart", "touchmove", "touchend"].map((type, i) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, "touches", {
        value:
          type === "touchend"
            ? []
            : [
                {
                  identifier: 1,
                  clientX: 180,
                  clientY: 250 + i * 180,
                  target: stage,
                },
              ],
      });
      stage.dispatchEvent(event);
      return event.defaultPrevented;
    });
  });
  expect(prevented).toEqual([false, false, false]);
  await expect(
    page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
  ).toBeVisible();
  expect(
    await page
      .locator("video")
      .evaluateAll((videos) =>
        videos.every((v) => (v as HTMLVideoElement).paused),
      ),
  ).toBe(true);
});

for (const width of [390, 768, 1440]) {
  test(`both exits remain visible and tappable during playback at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({
      width,
      height: width === 390 ? 844 : width === 768 ? 1024 : 900,
    });
    for (const selector of [".header-cta", ".scene-exit"]) {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.keyboard.press("PageDown");
      const film = page.locator(
        'video[data-transition="1"][data-direction="forward"]',
      );
      await expect
        .poll(() => film.evaluate((v: HTMLVideoElement) => v.currentTime))
        .toBeGreaterThan(1.65);
      for (const control of [".header-cta", ".scene-exit"]) {
        const exit = page.locator(control);
        await expect(exit).toBeVisible();
        const box = (await exit.boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        expect(box.y + box.height).toBeLessThanOrEqual(
          page.viewportSize()!.height,
        );
        expect(
          await exit.evaluate((el) => {
            const r = el.getBoundingClientRect();
            return el.contains(
              document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2),
            );
          }),
        ).toBe(true);
      }
      if (selector === ".header-cta")
        await page.screenshot({
          path: `/tmp/adduco-batch1-${testInfo.project.name}-${width}.png`,
        });
      await expect(film).toHaveJSProperty("ended", false);
      await page.locator(selector).click();
      await expect(
        page.locator(selector === ".header-cta" ? "#kontakt" : "#o-nama"),
      ).toBeInViewport();
      await expect(film).toHaveJSProperty("paused", true);
    }
  });
}

test("opening requests one still and only the first film until ready; later stills wait for navigation", async ({
  page,
}, testInfo) => {
  const requests: { url: string; startMs: number; endMs?: number }[] = [];
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/transition-1/*-forward.mp4", async (route) => {
    await held;
    await route.continue();
  });
  const started = Date.now();
  page.on("request", (r) => {
    if (/\/transition-\d\//.test(r.url()))
      requests.push({ url: r.url(), startMs: Date.now() - started });
  });
  page.on("requestfinished", (r) => {
    const item = requests.find((item) => item.url === r.url() && !item.endMs);
    if (item) item.endMs = Date.now() - started;
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => requests.some((r) => r.url.endsWith(".mp4")))
    .toBe(true);
  expect(
    new Set(requests.filter((r) => r.url.endsWith(".webp")).map((r) => r.url))
      .size,
  ).toBe(1);
  expect(
    new Set(requests.filter((r) => r.url.endsWith(".mp4")).map((r) => r.url))
      .size,
  ).toBe(1);
  release();
  await expect
    .poll(
      () =>
        new Set(
          requests.filter((r) => r.url.endsWith(".mp4")).map((r) => r.url),
        ).size,
    )
    .toBe(6);
  await page.waitForLoadState("networkidle");
  await writeFile(
    `/tmp/adduco-native-waterfall-${testInfo.project.name}.json`,
    JSON.stringify(requests, null, 2),
  );
  expect(
    new Set(requests.filter((r) => r.url.endsWith(".webp")).map((r) => r.url))
      .size,
  ).toBe(1);
  for (const image of await page.locator(".chapter-still img").all()) {
    if ((await image.getAttribute("fetchpriority")) === "high") continue;
    await expect(image).toHaveAttribute("loading", "lazy");
    await expect(image).toHaveAttribute("fetchpriority", "low");
  }
  await page.keyboard.press("PageDown");
  await expect
    .poll(() => requests.some((r) => r.url.endsWith("-end.webp")))
    .toBe(true);
});

test("failed playback retains its origin until the lazy destination still is decoded, then reveals image and caption together", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () =>
      Promise.reject(new DOMException("Policy", "NotAllowedError"));
  });
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/transition-1/*-end.webp", async (route) => {
    await held;
    await route.continue();
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("PageDown");
  await page.waitForTimeout(350);
  await expect(
    page.getByRole("heading", { name: "Od vizije do stvarnosti." }),
  ).toBeVisible();
  const still = page.locator('.chapter-still[data-visible="true"] img');
  await expect(still).toHaveJSProperty("complete", true);
  expect(
    await still.evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0);
  release();
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible();
  await expect(still).toHaveJSProperty("complete", true);
  await expect
    .poll(() => still.evaluate((img: HTMLImageElement) => img.currentSrc))
    .toContain("-end.webp");
  expect(
    await still.evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0);
});
