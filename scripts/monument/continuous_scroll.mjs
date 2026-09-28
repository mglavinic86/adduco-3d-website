/* global Response, document, performance, MutationObserver, PerformanceObserver, window, getComputedStyle, scrollTo, requestAnimationFrame */
import { chromium, webkit } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.ADDUCO_BASE_URL || "http://127.0.0.1:5277";
const engine = process.env.ADDUCO_ENGINE || "chrome";
const orientation = process.env.ADDUCO_ORIENTATION || "portrait";
const profile = process.env.ADDUCO_PROFILE || "warm";
const out = process.env.ADDUCO_QA_DIR || "/tmp/adduco-continuous-baseline";
await mkdir(out, { recursive: true });
const browser = await (engine === "webkit" ? webkit : chromium).launch(
  engine === "webkit" ? {} : { channel: "chrome" },
);
const context = await browser.newContext({
  viewport:
    orientation === "portrait"
      ? { width: 390, height: 844 }
      : { width: 1440, height: 900 },
});
const page = await context.newPage();
const requests = [];
const activeRequests = new Set();
let peakRequests = 0;
page.on("request", (r) => {
  if (/\.(mp4|m4s)$/.test(r.url())) {
    activeRequests.add(r);
    peakRequests = Math.max(peakRequests, activeRequests.size);
    requests.push({ url: r.url(), event: "start", at: Date.now() });
  }
});
for (const event of ["requestfinished", "requestfailed"])
  page.on(event, (r) => {
    if (activeRequests.delete(r))
      requests.push({ url: r.url(), event, at: Date.now() });
  });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
if (Number(process.env.ADDUCO_CPU) > 1) {
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", {
    rate: Number(process.env.ADDUCO_CPU),
  });
}
if (profile === "cold-4g") {
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 165,
    downloadThroughput: 1012500,
    uploadThroughput: 168750,
  });
}
// Diagnostic-only A/B probe. It does not change the deployed application.
// Limit complete MP4 downloads to two; newest queued request goes first.
if (process.env.ADDUCO_FETCH_PROBE === "latest-two")
  await page.addInitScript(() => {
    const original = window.fetch.bind(window),
      queue = [];
    let active = 0;
    const pump = () => {
      while (active < 2 && queue.length) {
        const { args, resolve, reject } = queue.pop();
        active++;
        original(...args)
          .then(async (response) => {
            const body = await response.arrayBuffer();
            resolve(
              new Response(body, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
              }),
            );
          })
          .catch(reject)
          .finally(() => {
            active--;
            pump();
          });
      }
    };
    window.fetch = (...args) =>
      /\.(mp4|m4s)$/.test(String(args[0]))
        ? new Promise((resolve, reject) => {
            queue.push({ args, resolve, reject });
            pump();
          })
        : original(...args);
  });
await page.goto(base);
await page.locator('canvas[data-ready="true"]').waitFor();
if (profile === "warm") {
  for (const frame of [
    ...Array.from({ length: 81 }, (_, i) => i * 6),
    480,
    0,
  ]) {
    await page.evaluate((n) => {
      const s = document.querySelector("#vizija");
      scrollTo(
        0,
        ((s.offsetHeight -
          parseFloat(getComputedStyle(s).getPropertyValue("--story-height"))) *
          n) /
          480,
      );
    }, frame);
    await page.waitForFunction(
      (n) => document.querySelector("canvas").dataset.frame === String(n),
      frame,
    );
  }
}
const trace = await page.evaluate(async () => {
  const c = document.querySelector("canvas"),
    s = document.querySelector("#vizija"),
    v = document.querySelector("video");
  const travel =
    s.offsetHeight -
    parseFloat(getComputedStyle(s).getPropertyValue("--story-height"));
  const start = performance.now(),
    draws = [],
    samples = [],
    media = [],
    longTasks = [];
  let lastDraw = start,
    lastFrame = Number(c.dataset.frame),
    previousRaf = start;
  const observer = new MutationObserver(() => {
    const frame = Number(c.dataset.frame);
    if (frame !== lastFrame) {
      const now = performance.now();
      draws.push({ t: now - start, frame, gap: now - lastDraw });
      lastDraw = now;
      lastFrame = frame;
    }
  });
  observer.observe(c, { attributes: true, attributeFilter: ["data-frame"] });
  const po = new PerformanceObserver((list) => {
    for (const e of list.getEntries())
      longTasks.push({ t: e.startTime - start, ms: e.duration });
  });
  const observesLongTasks =
    PerformanceObserver.supportedEntryTypes.includes("longtask");
  if (observesLongTasks) po.observe({ type: "longtask" });
  for (const event of ["loadstart", "loadeddata", "seeking", "seeked"])
    v.addEventListener(event, () =>
      media.push({ event, t: performance.now() - start, time: v.currentTime }),
    );
  const legs = [
    { to: 480, ms: 8000 },
    { to: 0, ms: 4000 },
    { to: 480, ms: 2000 },
    { to: 240, ms: 1000 },
  ];
  let from = 0;
  for (let leg = 0; leg < legs.length; leg++) {
    const { to, ms } = legs[leg],
      t0 = performance.now();
    while (true) {
      const now = await new Promise(requestAnimationFrame),
        p = Math.min(1, (now - t0) / ms),
        target = Math.round(from + (to - from) * p);
      scrollTo(0, (travel * target) / 480);
      samples.push({
        t: now - start,
        leg,
        target,
        drawn: Number(c.dataset.frame),
        lag: Math.abs(target - Number(c.dataset.frame)),
        sinceDraw: now - lastDraw,
        rafGap: now - previousRaf,
      });
      previousRaf = now;
      if (p === 1) break;
    }
    from = to;
  }
  const stop = performance.now();
  while (c.dataset.frame !== "240" && performance.now() - stop < 5000)
    await new Promise(requestAnimationFrame);
  const settleMs = performance.now() - stop;
  observer.disconnect();
  po.disconnect();
  return {
    draws,
    samples,
    media,
    longTasks,
    observesLongTasks,
    settleMs,
    final: Number(c.dataset.frame),
    duration: stop - start,
  };
});
const percentile = (values, p) =>
  [...values].sort((a, b) => a - b)[
    Math.min(values.length - 1, Math.floor(values.length * p))
  ];
const summary = {
  base,
  engine,
  version: browser.version(),
  orientation,
  profile,
  fetchProbe: process.env.ADDUCO_FETCH_PROBE || "none",
  cpu: Number(process.env.ADDUCO_CPU) || 1,
  peakRequests,
  draws: trace.draws.length,
  maxFreezeMs: Math.max(
    ...trace.draws.map((d) => d.gap),
    ...trace.samples.map((s) => s.sinceDraw),
  ),
  lagP95: percentile(
    trace.samples.map((s) => s.lag),
    0.95,
  ),
  maxLag: Math.max(...trace.samples.map((s) => s.lag)),
  rafP95: percentile(
    trace.samples.map((s) => s.rafGap),
    0.95,
  ),
  settleMs: trace.settleMs,
  final: trace.final,
  longTasks: trace.observesLongTasks ? trace.longTasks.length : null,
  errors,
};
await writeFile(
  `${out}/${engine}-${orientation}-${profile}.json`,
  JSON.stringify({ summary, requests, trace }, null, 2),
);
console.log(JSON.stringify(summary, null, 2));
await browser.close();
// A coarse regression guard for the reproduced multi-second freeze, not a
// certification of smooth animation. Detailed cadence is retained in the trace.
if (
  process.env.ADDUCO_ASSERT_CONTINUITY === "1" &&
  (summary.maxFreezeMs > 1000 || summary.final !== 240)
) {
  console.error(
    "FAIL: the continuously scrolled film froze for more than one second or failed to settle.",
  );
  process.exitCode = 1;
}
