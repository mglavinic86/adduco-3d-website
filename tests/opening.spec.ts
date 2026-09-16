import { test, expect } from "./video-fallback";
import { writeFile } from "node:fs/promises";

for (const width of [390, 768, 1440]) {
  test(`the opening still matches the decoded frame at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.locator("video.ready")).toBeVisible();
    await expect(page.locator(".world-stills img.active")).toHaveJSProperty(
      "complete",
      true,
    );
    const result = await page.evaluate(() => {
      const sources = [
        document.querySelector<HTMLImageElement>(".world-stills img.active")!,
        document.querySelector<HTMLVideoElement>("video.ready")!,
      ];
      const captures = sources.map((source) => {
        const canvas = document.createElement("canvas");
        const landscape =
          sources[1] instanceof HTMLVideoElement &&
          sources[1].videoWidth > sources[1].videoHeight;
        canvas.width = landscape ? 640 : 360;
        canvas.height = landscape ? 360 : 640;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        return {
          pixels: ctx.getImageData(0, 0, canvas.width, canvas.height).data,
          png: canvas.toDataURL(),
        };
      });
      // Compare camera/geometry separately from browser-specific video color
      // conversion. A fitted channel offset/gain cannot hide moved edges.
      const fit = [0, 1, 2].map((channel) => {
        let x = 0,
          y = 0,
          xx = 0,
          xy = 0;
        const n = captures[0].pixels.length / 4;
        for (let i = channel; i < captures[0].pixels.length; i += 4) {
          const a = captures[0].pixels[i],
            b = captures[1].pixels[i];
          x += a;
          y += b;
          xx += a * a;
          xy += a * b;
        }
        const gain = (xy - (x * y) / n) / (xx - (x * x) / n);
        return { gain, offset: (y - gain * x) / n };
      });
      let sum = 0;
      for (let i = 0; i < captures[0].pixels.length; i++) {
        if (i % 4 !== 3) {
          const { gain, offset } = fit[i % 4];
          sum +=
            (captures[0].pixels[i] * gain + offset - captures[1].pixels[i]) **
            2;
        }
      }
      return {
        rms: Math.sqrt(sum / (360 * 640 * 3)),
        images: captures.map((c) => c.png),
      };
    });
    for (let i = 0; i < result.images.length; i++) {
      const name = i ? "decoded-opening" : "opening-still";
      const path = testInfo.outputPath(`${name}.png`);
      await writeFile(
        path,
        Buffer.from(result.images[i].split(",")[1], "base64"),
      );
      await testInfo.attach(name, { path, contentType: "image/png" });
    }
    expect(
      result.rms,
      "Initial scene must not jump when video replaces its still",
    ).toBeLessThan(8);
  });
}

test("the opening blends into video before the camera starts moving", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const samples: { opacity: number; time: number }[] = [];
    const observer = new MutationObserver(() => {
      const v = document.querySelector<HTMLVideoElement>("video.ready");
      if (!v) return;
      observer.disconnect();
      window.scrollTo({ top: 350, behavior: "instant" });
      const started = performance.now();
      const record = () => {
        samples.push({
          opacity: Number(getComputedStyle(v).opacity),
          time: Number(v.dataset.presentedTime),
        });
        if (performance.now() - started < 300) requestAnimationFrame(record);
      };
      record();
    });
    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    (window as unknown as { openingBlend: typeof samples }).openingBlend =
      samples;
  });
  await page.goto("/");
  await expect(page.locator("video.ready")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as { openingBlend: { opacity: number }[] }
          ).openingBlend.at(-1)?.opacity,
      ),
    )
    .toBe(1);
  const samples = await page.evaluate(
    () =>
      (
        window as unknown as {
          openingBlend: { opacity: number; time: number }[];
        }
      ).openingBlend,
  );
  expect(samples[0].opacity).toBeLessThan(0.2);
  const blending = samples.filter((s) => s.opacity > 0.05 && s.opacity < 0.95);
  expect(blending.length).toBeGreaterThan(1);
  expect(blending.every((s) => s.time === 0)).toBe(true);
});

for (const noRanges of [false, true]) {
  test(`scrolling during initial loading starts from the opening (${noRanges ? "Blob recovery" : "HTTP seeking"})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    if (noRanges)
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
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/construction-portrait-*.mp4", async (route) => {
      await held;
      await route.continue();
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("video")).toHaveCount(1);
    await page.evaluate(() => {
      const frames: number[] = [];
      const observer = new MutationObserver(() => {
        const v = document.querySelector<HTMLVideoElement>("video.ready");
        if (v) frames.push(Number(v.dataset.presentedTime));
      });
      observer.observe(document.querySelector(".world-film-stage")!, {
        subtree: true,
        attributes: true,
      });
      (window as unknown as { openingFrames: number[] }).openingFrames = frames;
      window.scrollTo({ top: 350, behavior: "instant" });
    });
    // Reproduce a scroll that has settled before the first movie is downloaded.
    await page.waitForTimeout(700);
    release();
    await expect(page.locator("video.ready")).toBeVisible();
    const first = await page.evaluate(
      () => (window as unknown as { openingFrames: number[] }).openingFrames[0],
    );
    expect(
      first,
      "Do not reveal a later camera pose directly over the opening still",
    ).toBeLessThan(0.1);
    await expect
      .poll(() =>
        page
          .locator("video.ready")
          .evaluate((v: HTMLVideoElement) => Number(v.dataset.presentedTime)),
      )
      .toBeGreaterThan(1);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect
      .poll(() =>
        page
          .locator("video.ready")
          .evaluate((v: HTMLVideoElement) => Number(v.dataset.presentedTime)),
      )
      .toBe(0);
  });
}
