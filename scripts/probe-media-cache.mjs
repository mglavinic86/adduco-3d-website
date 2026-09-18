/* global document, performance, fetch, setTimeout */
import { chromium, webkit } from "playwright";
import { writeFile } from "node:fs/promises";
const base =
  process.argv[2] ?? "https://adduco-crveni-monolit.mglavinic.chatgpt.site/";
const results = [];
for (const [engine, type] of Object.entries({ chrome: chromium, webkit })) {
  const browser = await type.launch(
    engine === "chrome" ? { channel: "chrome" } : {},
  );
  for (const method of ["preload", "fetch"]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const events = [];
    const cdpEvents = [];
    if (engine === "chrome") {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.clearBrowserCache");
      const requests = new Map();
      cdp.on("Network.requestWillBeSent", (e) => {
        if (e.request.url.includes("transition-3/portrait-reverse")) {
          const r = {
            id: e.requestId,
            url: e.request.url,
            type: e.type,
            range: e.request.headers.Range,
          };
          requests.set(e.requestId, r);
          cdpEvents.push(r);
        }
      });
      cdp.on("Network.responseReceived", (e) =>
        Object.assign(requests.get(e.requestId) ?? {}, {
          status: e.response.status,
          cached: e.response.fromDiskCache,
        }),
      );
      cdp.on("Network.loadingFinished", (e) =>
        Object.assign(requests.get(e.requestId) ?? {}, {
          bytes: e.encodedDataLength,
        }),
      );
    }
    page.on("requestfinished", async (request) => {
      if (request.url().includes("transition-3/portrait-reverse"))
        events.push({
          type: request.resourceType(),
          sizes: await request.sizes(),
        });
    });
    await page.goto(base);
    await page.waitForLoadState("networkidle");
    const state = await page
      .evaluate(async (method) => {
        performance.clearResourceTimings();
        const url = "/assets/transition-3/portrait-reverse.mp4";
        const start = performance.now();
        if (method === "preload")
          await new Promise((resolve, reject) => {
            const link = document.createElement("link");
            link.rel = "preload";
            link.as = "fetch";
            link.crossOrigin = "anonymous";
            link.href = url;
            link.onload = resolve;
            link.onerror = reject;
            document.head.append(link);
          });
        else {
          const r = await fetch(url, {
            cache: "force-cache",
            credentials: "same-origin",
          });
          await r.arrayBuffer();
        }
        const fetched = performance.now();
        const v = document.createElement("video");
        v.muted = true;
        v.playsInline = true;
        v.crossOrigin = "anonymous";
        v.preload = "auto";
        document.body.append(v);
        await new Promise((resolve, reject) => {
          v.addEventListener("canplaythrough", resolve, { once: true });
          v.addEventListener("error", reject, { once: true });
          v.src = url;
          setTimeout(() => reject(new Error("canplaythrough timeout")), 15000);
        });
        return {
          fetchMs: fetched - start,
          attachToReadyMs: performance.now() - fetched,
          resources: performance
            .getEntriesByType("resource")
            .filter((r) => r.name.includes("transition-3/portrait-reverse"))
            .map((r) => ({
              type: r.initiatorType,
              transferSize: r.transferSize,
              encodedBodySize: r.encodedBodySize,
              startTime: r.startTime,
              responseEnd: r.responseEnd,
            })),
        };
      }, method)
      .catch((e) => ({ error: String(e) }));
    await page.waitForTimeout(100);
    const result = { engine, method, url: base, state, events, cdpEvents };
    results.push(result);
    console.log(JSON.stringify(result));
    await writeFile(
      "/tmp/adduco-cache-probe.json",
      JSON.stringify(results, null, 2),
    );
    await context.close();
  }
  await browser.close();
}
