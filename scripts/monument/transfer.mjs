/* global window, document, scrollTo, getComputedStyle, requestAnimationFrame, performance */
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
  const context = await browser.newContext({ viewport: { width, height } }),
    page = await context.newPage(),
    cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  let bytes = 0;
  cdp.on("Network.loadingFinished", (e) => (bytes += e.encodedDataLength));
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5274/");
  await page.locator('canvas[data-ready="true"]').waitFor();
  const failures = await page.evaluate(async () => {
    const stage = document.querySelector(".pilot-story"),
      canvas = document.querySelector("canvas"),
      errors = [];
    for (const frame of [
      ...Array.from({ length: 144 }, (_, i) => i),
      ...Array.from({ length: 144 }, (_, i) => 143 - i),
    ]) {
      scrollTo(
        0,
        ((stage.offsetHeight -
          parseFloat(
            getComputedStyle(stage).getPropertyValue("--pilot-height"),
          )) *
          frame) /
          143,
      );
      const start = performance.now();
      while (
        Number(canvas.dataset.frame) !== frame &&
        performance.now() - start < 2000
      )
        await new Promise((r) => requestAnimationFrame(r));
      if (Number(canvas.dataset.frame) !== frame)
        errors.push({ frame, shown: canvas.dataset.frame });
    }
    return errors;
  });
  await page.getByRole("link", { name: "Preskoči priču ↗" }).click();
  await page.locator("#kontakt").scrollIntoViewIfNeeded();
  const resources = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((e) => ({
      url: e.name,
      bytes: e.transferSize,
      encoded: e.encodedBodySize,
    })),
  );
  results.push({
    orientation,
    bytes,
    errors,
    failures,
    uniqueFrames: new Set(
      resources.filter((e) => e.url.includes("/pilot/")).map((e) => e.url),
    ).size,
    wrongOrientation: resources.filter((e) =>
      e.url.includes(
        `/pilot/${orientation === "portrait" ? "landscape" : "portrait"}/`,
      ),
    ),
    resources,
  });
  await context.close();
}
for (const [width, height] of [
  [360, 640],
  [768, 1024],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto("http://127.0.0.1:5274/");
  await page.locator('canvas[data-ready="true"]').waitFor();
  await page.screenshot({ path: `${out}/responsive-${width}.png` });
  results.push({
    width,
    height,
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  });
  await page.close();
}
await browser.close();
await writeFile(`${out}/transfer.json`, JSON.stringify(results, null, 2));
console.log(
  JSON.stringify(
    results.map(({ resources, ...rest }) => ({
      ...rest,
      resourceCount: resources?.length,
    })),
    null,
    2,
  ),
);
