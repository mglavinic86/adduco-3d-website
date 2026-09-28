import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("cold reversals respect the disclosed full-HD transfer ceiling", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "CDP byte counters are Chromium-specific",
  );
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 165,
    downloadThroughput: 1012500,
    uploadThroughput: 168750,
  });
  const complete = new Map<string, number>(),
    partial = new Map<string, number>();
  cdp.on("Network.loadingFinished", (e) =>
    complete.set(e.requestId, e.encodedDataLength),
  );
  cdp.on("Network.dataReceived", (e) =>
    partial.set(
      e.requestId,
      (partial.get(e.requestId) || 0) + e.encodedDataLength,
    ),
  );
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "0");
  for (const frame of [432, 0, 96, 192, 288, 384, 480, 0]) {
    await page.evaluate((n) => scrollTo(0, (4050 * n) / 480), frame);
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-frame",
      String(frame),
    );
  }
  await page.waitForTimeout(500);
  const bytes = [...new Set([...complete.keys(), ...partial.keys()])].reduce(
    (sum, id) => sum + Math.max(complete.get(id) || 0, partial.get(id) || 0),
    0,
  );
  expect(bytes).toBeLessThanOrEqual(26_000_000);
});

test("the complete construction follows 4.5 screens of native scroll and reverses to its opening", async ({
  page,
}) => {
  await page.goto("/");
  const story = page.locator("#vizija");
  await expect(story).toHaveClass(/is-enhanced/);
  const travel = await story.evaluate((el) => el.clientHeight - innerHeight);
  expect(travel).toBe(4050);
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "0");
  await expect(page.getByText("Sve počinje temeljem.")).toBeVisible();
  await page.evaluate((y) => scrollTo(0, y), travel);
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "480");
  await expect(page.getByText("Vaš projekt počinje razgovorom.")).toBeVisible();
  const finalImage = await page
    .locator("canvas")
    .evaluate((el: HTMLCanvasElement) => el.toDataURL());
  await page.waitForTimeout(250);
  expect(
    await page
      .locator("canvas")
      .evaluate((el: HTMLCanvasElement) => el.toDataURL()),
  ).toBe(finalImage);
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "0");
  await expect(page.getByText("Sve počinje temeljem.")).toBeVisible();
  await page.getByRole("link", { name: "Preskoči priču" }).click();
  await expect(page.locator("#o-nama")).toBeInViewport();
});

for (const mode of ["reduced", "data-saver"]) {
  test(`${mode} retains a static composition with no film or long empty scroll`, async ({
    page,
  }) => {
    if (mode === "reduced")
      await page.emulateMedia({ reducedMotion: "reduce" });
    else
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
    await expect(page.locator("#vizija")).not.toHaveClass(/is-enhanced/);
    expect(
      await page.locator("#vizija").evaluate((el) => el.clientHeight),
    ).toBe(900);
    await page.getByRole("link", { name: "Preskoči priču" }).click();
    await expect(page.locator("#o-nama")).toBeInViewport();
    expect(movies).toEqual([]);
  });
}

test("a missing film leaves its poster, keyboard exit and contact accessible", async ({
  page,
}) => {
  await page.route(
    /\/assets\/(story-hd|story-stream|story-hevc)\/.*\.(mp4|m4s)$/,
    (route) => route.abort(),
  );
  await page.goto("/");
  await expect(
    page.getByText("Prikaz je privremeno nedostupan."),
  ).toBeVisible();
  await expect(page.locator(".story-poster img")).toBeVisible();
  await page.getByRole("link", { name: "Preskoči priču" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#o-nama")).toBeInViewport();
  await page
    .getByRole("link", { name: "Razgovarajmo o vašem projektu", exact: true })
    .first()
    .click();
  await expect(page.locator("#kontakt")).toBeInViewport();
});

for (const [orientation, width, height] of [
  ["landscape", 1440, 900],
  ["portrait", 390, 844],
] as const)
  test(`${orientation}: displayed pixels match independently decoded frames and rapid reversal`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    const travel = height * 4.5;
    await page.goto("/");
    await expect(page.locator("canvas")).toHaveAttribute("data-ready", "true");
    const codec = await page.locator("canvas").getAttribute("data-codec");
    const folder = mkdtempSync(join(tmpdir(), "adduco-pixels-"));
    const frames = [0, 100, 101, 102, 240, 241, 400, 480];
    try {
      execFileSync("ffmpeg", [
        "-v",
        "error",
        "-i",
        `deliverables/adduco-story/web-encodes/${codec === "hevc" ? "hevc/" : ""}${orientation}.mp4`,
        "-vf",
        `select='${frames.map((n) => `eq(n,${n})`).join("+")}'`,
        "-fps_mode",
        "vfr",
        "-color_trc",
        "2",
        "-color_primaries",
        "2",
        "-colorspace",
        "2",
        join(folder, "%02d.png"),
      ]);
      await page.goto("/");
      await expect(page.locator("canvas")).toHaveAttribute(
        "data-ready",
        "true",
      );
      expect(
        await page
          .locator("canvas")
          .evaluate((c: HTMLCanvasElement) => [c.width, c.height]),
      ).toEqual(orientation === "portrait" ? [1080, 1920] : [1920, 1080]);
      for (const frame of [...frames, 101, 0]) {
        await page.evaluate(
          ({ n, travel }) => scrollTo(0, (n * travel) / 480),
          { n: frame, travel },
        );
        await expect(page.locator("canvas")).toHaveAttribute(
          "data-frame",
          String(frame),
        );
        const source = `data:image/png;base64,${readFileSync(join(folder, `${String(frames.indexOf(frame) + 1).padStart(2, "0")}.png`)).toString("base64")}`;
        const rms = await page.evaluate(async (src) => {
          const image = new Image();
          image.src = src;
          await image.decode();
          const expected = document.createElement("canvas"),
            actual = document.createElement("canvas");
          expected.width = actual.width = 320;
          expected.height = actual.height = 180;
          // Compare the same canvas-to-canvas sampling path in both branches.
          // Direct Image -> small canvas uses a different Chrome downsampler.
          const reference = document.createElement("canvas");
          reference.width = image.naturalWidth;
          reference.height = image.naturalHeight;
          reference.getContext("2d")!.drawImage(image, 0, 0);
          expected.getContext("2d")!.drawImage(reference, 0, 0, 320, 180);
          actual
            .getContext("2d")!
            .drawImage(document.querySelector("canvas")!, 0, 0, 320, 180);
          const a = actual.getContext("2d")!.getImageData(0, 0, 320, 180).data;
          const b = expected
            .getContext("2d")!
            .getImageData(0, 0, 320, 180).data;
          // Engines convert tagged BT.709 video into canvas sRGB differently.
          // Fit only a global channel gain/offset; moved edges cannot be aligned away.
          let sum = 0;
          const n = a.length / 4;
          for (let c = 0; c < 3; c++) {
            let x = 0,
              y = 0,
              xx = 0,
              xy = 0;
            for (let i = c; i < a.length; i += 4) {
              x += b[i];
              y += a[i];
              xx += b[i] * b[i];
              xy += b[i] * a[i];
            }
            const gain = (n * xy - x * y) / (n * xx - x * x),
              offset = (y - gain * x) / n;
            for (let i = c; i < a.length; i += 4)
              sum += (a[i] - (gain * b[i] + offset)) ** 2;
          }
          return Math.sqrt(sum / (n * 3));
        }, source);
        expect(rms, `decoded frame ${frame}`).toBeLessThan(4);
      }
      await page.evaluate(async (travel) => {
        scrollTo(0, travel);
        await new Promise(requestAnimationFrame);
        scrollTo(0, travel * 0.2);
        await new Promise(requestAnimationFrame);
        scrollTo(0, 0);
      }, travel);
      await expect(page.locator("canvas")).toHaveAttribute("data-frame", "0");
      await page.waitForTimeout(200);
      await expect(page.locator("canvas")).toHaveAttribute("data-frame", "0");
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });

test("a direct contact visit loads no film until the visitor returns to the story", async ({
  page,
}) => {
  const movies: string[] = [];
  page.on("request", (request) => {
    if (/\.(mp4|m4s)$/.test(request.url())) movies.push(request.url());
  });
  await page.goto("/#kontakt");
  await expect(page.locator("#kontakt")).toBeInViewport();
  await page.waitForTimeout(400);
  expect(movies).toEqual([]);
  await page.getByRole("link", { name: "Adduco — početna" }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "0");
  expect(movies.length).toBeGreaterThan(0);
});

test("rotation keeps the same construction phase and never flashes the opening", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => scrollTo(0, 2025));
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "240");
  const observed: string[] = [];
  await page.exposeFunction("recordFrame", (frame: string) =>
    observed.push(frame),
  );
  await page.evaluate(() => {
    new MutationObserver(() =>
      (window as unknown as { recordFrame: (s: string) => void }).recordFrame(
        document.querySelector("canvas")!.dataset.frame!,
      ),
    ).observe(document.querySelector("canvas")!, {
      attributes: true,
      attributeFilter: ["data-frame"],
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.locator("canvas").evaluate((c: HTMLCanvasElement) => c.width),
    )
    .toBe(1080);
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "240");
  expect(observed).not.toContain("0");
  await page.setViewportSize({ width: 844, height: 390 });
  await expect
    .poll(() =>
      page.locator("canvas").evaluate((c: HTMLCanvasElement) => c.width),
    )
    .toBe(1920);
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "240");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
});

test("prepared part changes stay within the agreed warm response budget", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "0");
  const samples = await page.evaluate(async () => {
    const canvas = document.querySelector("canvas")!;
    const frames = [48, 96, 144, 192, 240, 288, 336, 384, 432, 0];
    const measurements: number[] = [];
    for (let cycle = -1; cycle < 3; cycle++) {
      for (const frame of frames) {
        const elapsed = await new Promise<number>((resolve, reject) => {
          const start = performance.now();
          // Observe draw completion itself, rather than adding the next RAF's
          // 16.7 ms quantization to the decoder's measured response.
          const observer = new MutationObserver(() => {
            if (canvas.dataset.frame === String(frame)) {
              observer.disconnect();
              clearTimeout(deadline);
              resolve(performance.now() - start);
            }
          });
          const deadline = setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Missing frame ${frame}`));
          }, 5000);
          observer.observe(canvas, {
            attributes: true,
            attributeFilter: ["data-frame"],
          });
          scrollTo(0, (4050 * frame) / 480);
        });
        if (cycle >= 0) measurements.push(elapsed);
      }
    }
    return measurements.sort((a, b) => a - b);
  });
  expect(samples[Math.floor(samples.length * 0.95)]).toBeLessThanOrEqual(80);
  expect(samples.at(-1)).toBeLessThanOrEqual(150);
});
