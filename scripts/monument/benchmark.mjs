/* global createImageBitmap, window, document, scrollTo, getComputedStyle, requestAnimationFrame, setTimeout, performance, fetch, OffscreenCanvas */
/** Local browser lab. Draw submission and compositor callbacks are not physical-panel measurements. */
import { chromium, webkit } from "@playwright/test";
import { writeFile, mkdir, stat } from "node:fs/promises";
const base = "http://127.0.0.1:5274";
const output = process.env.ADDUCO_QA_DIR || "/tmp/adduco-monument-qa";
await mkdir(output, { recursive: true });
const report = {
  date: new Date().toISOString(),
  conditions:
    "Local production preview, no network/CPU throttle; desktop browsers; GPU rendering stopped before measurement",
  sequence: [],
  video: [],
};
const percentile = (a, p) =>
  [...a].sort((a, b) => a - b)[
    Math.min(a.length - 1, Math.floor(a.length * p))
  ];
for (const [name, engine, options] of [
  ["chrome", chromium, { channel: "chrome" }],
  ["webkit", webkit, {}],
]) {
  const browser = await engine.launch(options);
  for (const [orientation, width, height] of [
    ["landscape", 1440, 900],
    ["portrait", 390, 844],
  ]) {
    if (
      process.env.ADDUCO_ORIENTATION &&
      process.env.ADDUCO_ORIENTATION !== orientation
    )
      continue;
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      const original = createImageBitmap;
      const metrics = { liveBytes: 0, peakBytes: 0, draws: [] };
      window.__frameMetrics = metrics;
      window.createImageBitmap = async (...args) => {
        const b = await original(...args);
        const bytes = b.width * b.height * 4;
        metrics.liveBytes += bytes;
        metrics.peakBytes = Math.max(metrics.peakBytes, metrics.liveBytes);
        const close = b.close.bind(b);
        let closed = false;
        b.close = () => {
          if (!closed) {
            closed = true;
            metrics.liveBytes -= bytes;
          }
          close();
        };
        return b;
      };
    });
    const begin = Date.now();
    await page.goto(base);
    await page.locator('canvas[data-ready="true"]').waitFor();
    const firstDrawMs = Date.now() - begin;
    for (const state of ["cold", "warm"]) {
      const values = [];
      for (const frame of Array.from(
        { length: state === "warm" ? 5 : 1 },
        () => [
          0, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 143, 108, 72, 36, 0,
          108, 36, 120, 24,
        ],
      ).flat()) {
        const sample = await page.evaluate(async (frame) => {
          const stage = document.querySelector(".pilot-story"),
            c = document.querySelector("canvas"),
            start = performance.now();
          scrollTo(
            0,
            ((stage.offsetHeight -
              parseFloat(
                getComputedStyle(stage).getPropertyValue("--pilot-height"),
              )) *
              frame) /
              143,
          );
          while (
            Number(c.dataset.frame) !== frame &&
            performance.now() - start < 5000
          )
            await new Promise((r) => requestAnimationFrame(r));
          return {
            frame,
            drawn: Number(c.dataset.frame),
            latency: performance.now() - start,
          };
        }, frame);
        values.push(sample);
      }
      const correctness = await page.evaluate(async (orientation) => {
        const canvas = document.querySelector("canvas"),
          before = canvas.dataset.frame;
        const bitmap = await createImageBitmap(
          await (await fetch(`/assets/pilot/${orientation}/0024.webp`)).blob(),
        );
        const expected = new OffscreenCanvas(bitmap.width, bitmap.height),
          ctx = expected.getContext("2d");
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        const a = canvas
            .getContext("2d")
            .getImageData(0, 0, canvas.width, canvas.height).data,
          b = ctx.getImageData(0, 0, expected.width, expected.height).data;
        let changedChannels = 0;
        for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) changedChannels++;
        await new Promise((r) => setTimeout(r, 2000));
        return { changedChannels, stationary: canvas.dataset.frame === before };
      }, orientation);
      const resources = await page.evaluate(() =>
        performance.getEntriesByType("resource").map((e) => ({
          name: e.name,
          transfer: e.transferSize,
          encoded: e.encodedBodySize,
        })),
      );
      const metrics = await page.evaluate(() => window.__frameMetrics);
      const l = values.map((x) => x.latency);
      report.sequence.push({
        engine: name,
        version: browser.version(),
        orientation,
        state,
        firstDrawMs,
        p50: percentile(l, 0.5),
        p95: percentile(l, 0.95),
        max: Math.max(...l),
        samples: values,
        bitmapPeakBytes: metrics.peakBytes,
        correctness,
        resources,
      });
    }
    await page.screenshot({ path: `${output}/${name}-${orientation}.png` });
    await context.close();
    for (const gop of [1, 4, 8]) {
      const media = `/assets/pilot/video/${orientation}-g${gop}.mp4`;
      try {
        await stat("public" + media);
      } catch {
        continue;
      }
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      await page.route("**/benchmark", (route) =>
        route.fulfill({
          contentType: "text/html",
          body: `<video src="${media}" muted playsinline preload="auto" style="width:100%"></video>`,
        }),
      );
      await page.goto(base + "/benchmark");
      const samples = await page.evaluate(async () => {
        const v = document.querySelector("video");
        await v.play();
        v.pause();
        await new Promise((r) => setTimeout(r, 100));
        const out = [];
        for (const frame of [
          1, 24, 72, 120, 143, 108, 36, 0, 100, 30, 125, 12,
        ]) {
          const start = performance.now();
          let metadata;
          const callback = v.requestVideoFrameCallback((_, m) => {
            metadata = m;
          });
          v.currentTime = (frame + 0.5) / 24;
          while (!metadata && performance.now() - start < 2000)
            await new Promise((r) => setTimeout(r, 4));
          v.cancelVideoFrameCallback(callback);
          out.push({
            frame,
            requestedTime: v.currentTime,
            mediaTime: metadata?.mediaTime,
            presentedFrame: metadata
              ? Math.round(metadata.mediaTime * 24)
              : null,
            latency: performance.now() - start,
            compositorObserved: !!metadata,
          });
        }
        return out;
      });
      report.video.push({
        engine: name,
        orientation,
        gop,
        bytes: (await stat("public" + media)).size,
        samples,
      });
      await context.close();
    }
  }
  await browser.close();
}
await writeFile(`${output}/benchmark.json`, JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      sequence: report.sequence.map((x) => ({
        engine: x.engine,
        orientation: x.orientation,
        state: x.state,
        p95: x.p95,
        max: x.max,
        bitmapPeakBytes: x.bitmapPeakBytes,
      })),
      video: report.video.map((x) => ({
        ...x,
        samples: x.samples.map((s) => ({
          frame: s.frame,
          presented: s.presentedFrame,
          ms: s.latency,
        })),
      })),
    },
    null,
    2,
  ),
);
