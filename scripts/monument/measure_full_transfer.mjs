/* global document, innerWidth, getComputedStyle, scrollTo, performance, requestAnimationFrame */
import { chromium } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
const base = process.env.ADDUCO_BASE_URL || "http://127.0.0.1:5277";
const out = process.env.ADDUCO_QA_DIR || "/tmp/adduco-scroll-film-qa";
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
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 165,
    downloadThroughput: 1012500,
    uploadThroughput: 168750,
  });
  const complete = new Map(),
    partial = new Map(),
    requests = [];
  cdp.on("Network.loadingFinished", (e) =>
    complete.set(e.requestId, e.encodedDataLength),
  );
  cdp.on("Network.dataReceived", (e) =>
    partial.set(
      e.requestId,
      (partial.get(e.requestId) || 0) + e.encodedDataLength,
    ),
  );
  cdp.on("Network.requestWillBeSent", (e) => {
    if (/\.(mp4|m4s)$/.test(e.request.url))
      requests.push({ url: e.request.url, range: e.request.headers.Range });
  });
  await page.goto(base);
  await page.locator('canvas[data-ready="true"]').waitFor();
  const firstDrawMs = await page.evaluate(() => performance.now());
  const initialTransferredBytes = [
    ...new Set([...complete.keys(), ...partial.keys()]),
  ].reduce(
    (sum, id) => sum + Math.max(complete.get(id) || 0, partial.get(id) || 0),
    0,
  );
  const traversal = await page.evaluate(async () => {
    const s = document.querySelector("#vizija"),
      c = document.querySelector("canvas"),
      travel =
        s.offsetHeight -
        parseFloat(getComputedStyle(s).getPropertyValue("--story-height"));
    const missing = [],
      start = performance.now();
    for (const frame of [
      ...Array.from({ length: 481 }, (_, i) => i),
      ...Array.from({ length: 480 }, (_, i) => 479 - i),
    ]) {
      scrollTo(0, (travel * frame) / 480);
      const t = performance.now();
      while (c.dataset.frame !== String(frame) && performance.now() - t < 8000)
        await new Promise(requestAnimationFrame);
      if (c.dataset.frame !== String(frame)) {
        missing.push(frame);
        break;
      }
    }
    return {
      missing,
      elapsedMs: performance.now() - start,
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
  await page
    .getByRole("link", { name: "Razgovarajmo o vašem projektu", exact: true })
    .first()
    .click();
  const transferredBytes = [
    ...new Set([...complete.keys(), ...partial.keys()]),
  ].reduce(
    (sum, id) => sum + Math.max(complete.get(id) || 0, partial.get(id) || 0),
    0,
  );
  results.push({
    orientation,
    initialTransferredBytes,
    firstDrawMs,
    transferredBytes,
    requests,
    traversal,
  });
  console.log(orientation, transferredBytes, traversal);
  await context.close();
}
await browser.close();
await writeFile(
  `${out}/full-transfer.json`,
  JSON.stringify(
    {
      base,
      conditions:
        "Chrome desktop, fresh contexts, 4G 165ms/1,012,500 B/s, all 481 frames forward and back, actual network bytes including unfinished request bodies",
      results,
    },
    null,
    2,
  ),
);
