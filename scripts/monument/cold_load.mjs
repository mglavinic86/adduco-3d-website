/* global window, document, performance, MutationObserver, PerformanceObserver, createImageBitmap, scrollTo, getComputedStyle, requestAnimationFrame */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const out = process.env.ADDUCO_QA_DIR || "/tmp/adduco-monument-qa";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" }),
  results = [];
for (const [orientation, width, height] of [
  ["landscape", 1440, 900],
  ["portrait", 390, 844],
]) {
  for (let run = 0; run < 5; run++) {
    const context = await browser.newContext({ viewport: { width, height } }),
      page = await context.newPage(),
      cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 165,
      downloadThroughput: 1012500,
      uploadThroughput: 168750,
    });
    await page.addInitScript(() => {
      window.__initialDecoded = 0;
      window.__rangeReady = null;
      const decode = createImageBitmap;
      window.createImageBitmap = async (...args) => {
        const bitmap = await decode(...args);
        if (++window.__initialDecoded === 5)
          window.__rangeReady = performance.now();
        return bitmap;
      };
      window.__firstDraw = null;
      window.__posterPaint = null;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          if (
            e.identifier === "pilot-poster" &&
            e.renderTime > 0 &&
            window.__posterPaint === null
          )
            window.__posterPaint = e.renderTime;
      }).observe({ type: "element", buffered: true });
      const observer = new MutationObserver(() => {
        if (
          window.__firstDraw === null &&
          document.querySelector('canvas[data-ready="true"]')
        )
          window.__firstDraw = performance.now();
      });
      observer.observe(document, {
        subtree: true,
        attributes: true,
        childList: true,
      });
    });
    for (const cache of ["cold", "warm"]) {
      let bytes = 0;
      const received = (e) => {
        bytes += e.encodedDataLength;
      };
      cdp.on("Network.loadingFinished", received);
      await page.goto("http://127.0.0.1:5274/");
      await page.locator('canvas[data-ready="true"]').waitFor();
      await page.waitForFunction(() => window.__rangeReady !== null);
      await page.waitForTimeout(100);
      const timing = await page.evaluate(() => ({
        firstDrawMs: window.__firstDraw,
        initialFiveDecodedMs: window.__rangeReady,
        posterPaintMs: window.__posterPaint,
        ttfb: performance.getEntriesByType("navigation")[0].responseStart,
        posterComplete: document.querySelector(".pilot-poster img").complete,
      }));
      results.push({ orientation, run: run + 1, cache, ...timing, bytes });
      cdp.off("Network.loadingFinished", received);
      if (cache === "cold" && run === 0) {
        results.at(-1).unpreparedSeek = await page.evaluate(async () => {
          const stage = document.querySelector(".pilot-story"),
            canvas = document.querySelector("canvas"),
            start = performance.now();
          scrollTo(
            0,
            ((stage.offsetHeight -
              parseFloat(
                getComputedStyle(stage).getPropertyValue("--pilot-height"),
              )) *
              108) /
              143,
          );
          while (
            canvas.dataset.frame !== "108" &&
            performance.now() - start < 5000
          )
            await new Promise((r) => requestAnimationFrame(r));
          return { frame: canvas.dataset.frame, ms: performance.now() - start };
        });
      }
    }
    await context.close();
  }
}
await browser.close();
await writeFile(
  `${out}/cold-load.json`,
  JSON.stringify(
    {
      conditions:
        "Chrome desktop, local preview, CDP 4G 1,012,500B/s down; 168,750B/s up; 165ms latency; no CPU throttle; fresh context per cold sample, same context warm navigation",
      results,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(results, null, 2));
