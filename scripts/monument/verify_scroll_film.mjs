/* global innerWidth, window, document, performance, MutationObserver, PerformanceObserver, scrollTo, getComputedStyle, requestAnimationFrame */
import { chromium, webkit } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.ADDUCO_BASE_URL || "http://127.0.0.1:5277";
const out = process.env.ADDUCO_QA_DIR || "/tmp/adduco-scroll-film-qa";
await mkdir(out, { recursive: true });
const report = {
  date: new Date().toISOString(),
  base,
  note: "Desktop engines and emulated viewports, not physical phones. Latency measures canvas draw submission. JS heap excludes decoder/GPU memory.",
  warm: [],
  loading: [],
};
const percentile = (a, p) =>
  [...a].sort((x, y) => x - y)[
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
    const context = await browser.newContext({ viewport: { width, height } }),
      page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page.locator('canvas[data-ready="true"]').waitFor();
    const samples = await page.evaluate(async () => {
      const c = document.querySelector("canvas"),
        s = document.querySelector("#vizija");
      const travel =
        s.offsetHeight -
        parseFloat(getComputedStyle(s).getPropertyValue("--story-height"));
      const frames = [
        0, 24, 48, 96, 144, 192, 240, 288, 336, 384, 432, 480, 400, 241, 240,
        101, 100, 0, 480, 0,
      ];
      const results = [];
      for (let cycle = -1; cycle < 3; cycle++)
        for (const frame of frames) {
          const start = performance.now();
          let drawMs = c.dataset.frame === String(frame) ? 0 : null;
          const drawObserver = new MutationObserver(() => {
            if (c.dataset.frame === String(frame) && drawMs === null)
              drawMs = performance.now() - start;
          });
          drawObserver.observe(c, {
            attributes: true,
            attributeFilter: ["data-frame"],
          });
          scrollTo(0, (travel * frame) / 480);
          while (
            c.dataset.frame !== String(frame) &&
            performance.now() - start < 5000
          )
            await new Promise(requestAnimationFrame);
          drawObserver.disconnect();
          if (cycle >= 0)
            results.push({
              frame,
              drawn: Number(c.dataset.frame),
              ms: drawMs ?? performance.now() - start,
              observedNextRafMs: performance.now() - start,
            });
        }
      return results;
    });
    const ms = samples.map((s) => s.ms);
    const snapshots = [];
    for (const [phase, frame] of [
      ["opening", 0],
      ["concrete", 240],
      ["final", 480],
    ]) {
      await page.evaluate((n) => {
        const s = document.querySelector("#vizija");
        scrollTo(
          0,
          ((s.offsetHeight -
            parseFloat(
              getComputedStyle(s).getPropertyValue("--story-height"),
            )) *
            n) /
            480,
        );
      }, frame);
      await page.waitForFunction(
        (n) => document.querySelector("canvas").dataset.frame === String(n),
        frame,
      );
      const path = `${out}/${name}-${orientation}-${phase}.png`;
      await page.screenshot({ path });
      snapshots.push(path);
    }
    report.warm.push({
      engine: name,
      version: browser.version(),
      orientation,
      p50: percentile(ms, 0.5),
      p95: percentile(ms, 0.95),
      max: Math.max(...ms),
      correct: samples.every((s) => s.frame === s.drawn),
      samples,
      errors,
      snapshots,
      ...(await page.evaluate(() => ({
        canvasBytes:
          document.querySelector("canvas").width *
          document.querySelector("canvas").height *
          4,
        liveDecoders: document.querySelectorAll("video").length,
        overflow: document.documentElement.scrollWidth - innerWidth,
      }))),
    });
    await context.close();
  }
  await browser.close();
}
if (process.env.ADDUCO_WARM_ONLY === "1") {
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      report.warm.map(({ engine, orientation, p95, max, correct, errors }) => ({
        engine,
        orientation,
        p95,
        max,
        correct,
        errors,
      })),
      null,
      2,
    ),
  );
  process.exit(0);
}
const browser = await chromium.launch({ channel: "chrome" });
for (const [orientation, width, height] of [
  ["landscape", 1440, 900],
  ["portrait", 390, 844],
]) {
  if (
    process.env.ADDUCO_ORIENTATION &&
    process.env.ADDUCO_ORIENTATION !== orientation
  )
    continue;
  for (const profile of ["4G", "slow-4G-CPU4"]) {
    const context = await browser.newContext({ viewport: { width, height } }),
      page = await context.newPage(),
      cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Performance.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: profile === "4G" ? 165 : 250,
      downloadThroughput: profile === "4G" ? 1012500 : 400000,
      uploadThroughput: 168750,
    });
    if (profile !== "4G")
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      window.__filmTiming = { draw: null, poster: null, longTasks: [], cls: 0 };
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          if (e.identifier === "story-poster" && e.renderTime)
            window.__filmTiming.poster ??= e.renderTime;
      }).observe({ type: "element", buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          window.__filmTiming.longTasks.push(e.duration);
      }).observe({ type: "longtask", buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          if (!e.hadRecentInput) window.__filmTiming.cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
      new MutationObserver(() => {
        if (document.querySelector('canvas[data-ready="true"]'))
          window.__filmTiming.draw ??= performance.now();
      }).observe(document, {
        subtree: true,
        attributes: true,
        childList: true,
      });
    });
    for (const cache of ["cold", "warm"]) {
      const completed = new Map(),
        partial = new Map();
      const received = (e) => {
        completed.set(e.requestId, e.encodedDataLength);
      };
      cdp.on("Network.loadingFinished", received);
      const progress = (e) =>
        partial.set(
          e.requestId,
          (partial.get(e.requestId) || 0) + e.encodedDataLength,
        );
      cdp.on("Network.dataReceived", progress);
      await page.goto(base);
      await page.locator('canvas[data-ready="true"]').waitFor();
      const early = await page.evaluate(() => ({ ...window.__filmTiming }));
      const jump = await page.evaluate(async () => {
        const s = document.querySelector("#vizija"),
          c = document.querySelector("canvas"),
          start = performance.now();
        scrollTo(
          0,
          (s.offsetHeight -
            parseFloat(
              getComputedStyle(s).getPropertyValue("--story-height"),
            )) *
            0.9,
        );
        while (c.dataset.frame !== "432" && performance.now() - start < 15000)
          await new Promise(requestAnimationFrame);
        return { ms: performance.now() - start, frame: c.dataset.frame };
      });
      await page.evaluate(async () => {
        const c = document.querySelector("canvas"),
          s = document.querySelector("#vizija");
        const travel =
          s.offsetHeight -
          parseFloat(getComputedStyle(s).getPropertyValue("--story-height"));
        for (const n of [0, 96, 192, 288, 384, 480, 0]) {
          scrollTo(0, (travel * n) / 480);
          const start = performance.now();
          while (
            c.dataset.frame !== String(n) &&
            performance.now() - start < 15000
          )
            await new Promise(requestAnimationFrame);
        }
      });
      await page.waitForTimeout(300);
      const heap = (await cdp.send("Performance.getMetrics")).metrics.find(
        (x) => x.name === "JSHeapUsedSize",
      )?.value;
      report.loading.push({
        orientation,
        profile,
        cache,
        firstDrawMs: early.draw,
        posterPaintMs: early.poster,
        jump,
        totalTransferredBytes: [
          ...new Set([...completed.keys(), ...partial.keys()]),
        ].reduce(
          (sum, id) =>
            sum + Math.max(completed.get(id) || 0, partial.get(id) || 0),
          0,
        ),
        jsHeapBytes: heap,
        ...(await page.evaluate(() => ({
          cls: window.__filmTiming.cls,
          longTasks: window.__filmTiming.longTasks,
          requests: performance
            .getEntriesByType("resource")
            .filter((r) => r.name.endsWith(".mp4"))
            .map((r) => ({ name: r.name, bytes: r.transferSize })),
        }))),
      });
      cdp.off("Network.loadingFinished", received);
      cdp.off("Network.dataReceived", progress);
    }
    await context.close();
  }
}
await browser.close();
await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      warm: report.warm.map((r) => ({
        engine: r.engine,
        orientation: r.orientation,
        p95: r.p95,
        max: r.max,
        correct: r.correct,
        errors: r.errors,
      })),
      loading: report.loading,
    },
    null,
    2,
  ),
);
