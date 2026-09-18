/* global window, document, performance, HTMLVideoElement, MutationObserver, PerformanceObserver, requestAnimationFrame, getComputedStyle, matchMedia */
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";

// DevTools presets, including its throughput/latency adjustment factors.
const profiles = {
  "4G": { latency: 165, downloadThroughput: 1012500, uploadThroughput: 168750 },
  Fast3G: {
    latency: 562.5,
    downloadThroughput: 180000,
    uploadThroughput: 84375,
  },
};
const [
  url = "https://adduco-crveni-monolit.mglavinic.chatgpt.site/",
  label = "before",
  output = "/tmp/adduco-load-before.json",
] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome" });
const reports = [];
const samples = Number(process.argv[6] ?? 1);
if (!Number.isInteger(samples) || samples < 1 || samples > 5)
  throw new Error("Sample count must be an integer from 1 to 5");
try {
  for (let run = 1; run <= samples; run++) {
    for (const [profile, network] of Object.entries(profiles)) {
      if (process.argv[5] && profile !== process.argv[5]) continue;
      for (const orientation of ["portrait", "landscape"]) {
        const context = await browser.newContext({
          viewport:
            orientation === "portrait"
              ? { width: 390, height: 844 }
              : { width: 1440, height: 900 },
        });
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        await cdp.send("Network.enable");
        await cdp.send("Network.clearBrowserCache");
        await cdp.send("Network.setCacheDisabled", { cacheDisabled: false });
        await cdp.send("Network.emulateNetworkConditions", {
          offline: false,
          ...network,
          connectionType: "cellular4g",
        });
        const requests = new Map();
        let navigationStart;
        cdp.on("Network.requestWillBeSent", (e) => {
          if (e.type === "Document" && navigationStart === undefined)
            navigationStart = e.timestamp;
          requests.set(e.requestId, {
            url: e.request.url,
            type: e.type,
            startMs: (e.timestamp - navigationStart) * 1000,
            priority: e.request.initialPriority,
            bytes: 0,
          });
        });
        cdp.on("Network.responseReceived", (e) => {
          Object.assign(requests.get(e.requestId) ?? {}, {
            status: e.response.status,
            fromDiskCache: e.response.fromDiskCache,
            cacheControl: e.response.headers["cache-control"],
            responseMs: (e.timestamp - navigationStart) * 1000,
          });
        });
        cdp.on("Network.loadingFinished", (e) =>
          Object.assign(requests.get(e.requestId) ?? {}, {
            bytes: e.encodedDataLength,
            endMs: (e.timestamp - navigationStart) * 1000,
          }),
        );
        await page.addInitScript(() => {
          window.loadAudit = {
            ready: {},
            playing: [],
            imagePaintMs: null,
            imageDecodedMs: null,
            lqipMs: null,
            imagePaintEntries: [],
          };
          const opening = () => {
            const image = document.querySelector(".chapter-still img");
            if (!image || image.hasAttribute("elementtiming")) return;
            image.setAttribute("elementtiming", "opening-still");
            image
              .decode()
              .then(() =>
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => {
                    window.loadAudit.imageDecodedMs = performance.now();
                  }),
                ),
              )
              .catch(() => {});
          };
          new MutationObserver(opening).observe(document, {
            childList: true,
            subtree: true,
          });
          try {
            new PerformanceObserver((list) => {
              for (const e of list.getEntries())
                if (e.identifier === "opening-still" && e.renderTime > 0) {
                  window.loadAudit.imagePaintEntries.push(e.renderTime);
                  window.loadAudit.imagePaintMs ??= e.renderTime;
                }
            }).observe({ type: "element", buffered: true });
          } catch {
            /* Engine may lack Element Timing. */
          }
          document.addEventListener(
            "canplaythrough",
            (e) => {
              const v = e.target;
              if (v instanceof HTMLVideoElement)
                window.loadAudit.ready[v.getAttribute("src")] ??=
                  performance.now();
            },
            true,
          );
          document.addEventListener(
            "playing",
            (e) => {
              const v = e.target;
              if (v instanceof HTMLVideoElement)
                window.loadAudit.playing.push({
                  src: v.getAttribute("src"),
                  ms: performance.now(),
                });
            },
            true,
          );
          document.addEventListener("DOMContentLoaded", () => {
            const stage = document.querySelector(".chapter");
            if (
              stage &&
              getComputedStyle(stage).backgroundImage.includes("data:image")
            )
              requestAnimationFrame(() => {
                window.loadAudit.lqipMs = performance.now();
              });
          });
        });
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
        const first = `/assets/transition-1/${orientation}-forward.mp4`;
        await page.waitForFunction(
          (src) => window.loadAudit.ready[src] !== undefined,
          first,
          { timeout: 45000 },
        );
        const firstReady = await page.evaluate(
          (src) => window.loadAudit.ready[src],
          first,
        );
        const moves = [];
        for (const [segment, direction] of [
          [1, "forward"],
          [2, "forward"],
          [3, "forward"],
          [3, "reverse"],
          [2, "reverse"],
          [1, "reverse"],
        ]) {
          const film = page.locator(
            `video[data-transition="${segment}"][data-direction="${direction}"]`,
          );
          const before = await film.evaluate((v) => ({
            ms: performance.now(),
            readyState: v.readyState,
            buffered: v.buffered.length
              ? v.buffered.end(v.buffered.length - 1)
              : 0,
          }));
          await page.keyboard.press(
            direction === "forward" ? "PageDown" : "PageUp",
          );
          await page.waitForFunction(
            ({ segment, direction, ms }) => {
              const v = document.querySelector(
                `video[data-transition="${segment}"][data-direction="${direction}"]`,
              );
              return v.ended || (v.paused && performance.now() - ms > 7000);
            },
            { segment, direction, ms: before.ms },
            { timeout: 20000 },
          );
          const src = `/assets/transition-${segment}/${orientation}-${direction}.mp4`;
          const playing = await page.evaluate(
            ({ src, ms }) =>
              window.loadAudit.playing.find((e) => e.src === src && e.ms >= ms),
            { src, ms: before.ms },
          );
          moves.push({
            segment,
            direction,
            readyStateAtGesture: before.readyState,
            bufferedAtGesture: before.buffered,
            gestureMs: before.ms,
            delayMs: playing ? playing.ms - before.ms : null,
          });
        }
        const menu = page.getByRole("button", { name: "Otvori izbornik" });
        if (await menu.isVisible()) {
          await menu.click();
          await page.evaluate(() => document.fonts.ready);
          await page.keyboard.press("Escape");
        }
        for (const id of [
          "o-nama",
          "usluge",
          "priprema",
          "projekti",
          "kontakt",
        ])
          await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        await page.waitForLoadState("networkidle", { timeout: 45000 });
        const data = await page.evaluate(() => ({
          ...window.loadAudit,
          navigation: performance.getEntriesByType("navigation")[0].toJSON(),
          openingSelection: {
            portrait: matchMedia("(max-aspect-ratio: 9/10)").matches,
            currentSrc: document.querySelector(".chapter-still img").currentSrc,
            preloads: [
              ...document.querySelectorAll('head link[as="image"]'),
            ].map((link) => ({
              href: link.href,
              media: link.media,
              matches: matchMedia(link.media).matches,
            })),
          },
          paints: performance
            .getEntriesByType("paint")
            .map((e) => ({ name: e.name, ms: e.startTime })),
        }));
        const report = {
          run,
          label,
          url,
          profile,
          network,
          orientation,
          transferScope:
            "All six films, mobile menu and business sections; optional PDF excluded",
          firstReadyMs: firstReady,
          ...data,
          moves,
          totalBytes: [...requests.values()].reduce((s, r) => s + r.bytes, 0),
          requests: [...requests.values()],
        };
        reports.push(report);
        await writeFile(output, JSON.stringify(reports, null, 2));
        console.log(
          JSON.stringify({
            run,
            label,
            profile,
            orientation,
            imagePaintMs: data.imagePaintMs,
            imageDecodedMs: data.imageDecodedMs,
            firstReadyMs: firstReady,
            laterDelayMs: Math.max(
              ...moves.slice(1).map((m) => m.delayMs ?? Infinity),
            ),
            totalBytes: report.totalBytes,
          }),
        );
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}
