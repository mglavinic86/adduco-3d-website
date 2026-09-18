/* global document, performance, window */
import { chromium, webkit } from "playwright";
import { stat, writeFile } from "node:fs/promises";
import { URL } from "node:url";

const base =
  process.argv[2] ?? "https://adduco-crveni-monolit.mglavinic.chatgpt.site/";
const output = process.argv[3] ?? "/tmp/adduco-native-transfer.json";
const results = [];
for (const [engine, type] of Object.entries({ chrome: chromium, webkit })) {
  const browser = await type.launch(
    engine === "chrome" ? { channel: "chrome" } : {},
  );
  try {
    for (const orientation of ["portrait", "landscape"]) {
      const context = await browser.newContext({
        ...(engine === "webkit" ? { isMobile: true, hasTouch: true } : {}),
        viewport:
          orientation === "portrait"
            ? { width: 390, height: 844 }
            : { width: 1440, height: 900 },
      });
      const page = await context.newPage();
      const responses = [];
      const failed = [];
      page.on("requestfailed", (r) => {
        if (r.url().endsWith(".mp4"))
          failed.push({ url: r.url(), reason: r.failure() });
      });
      page.on("requestfinished", (r) => {
        if (!r.url().endsWith(".mp4")) return;
        responses.push(
          (async () => {
            const response = await r.response();
            const headers = await response.allHeaders();
            // Read the completed native response. This does not issue fetch() or
            // another media request. Keep wire-size metrics separate from payload.
            const bytes = (await response.body()).length;
            return {
              url: r.url(),
              range: r.headers().range,
              status: response.status(),
              contentLength: headers["content-length"],
              contentRange: headers["content-range"],
              payloadBytes: bytes,
              sizes: await r.sizes(),
            };
          })(),
        );
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(
        () =>
          [...document.querySelectorAll("video")].every(
            (v) =>
              v.readyState === 4 &&
              v.buffered.length === 1 &&
              v.buffered.start(0) === 0 &&
              v.buffered.end(0) >= v.duration - 0.001,
          ),
        null,
        { timeout: 30000 },
      );
      await page.waitForLoadState("networkidle");
      const preparedResponses = responses.length;
      const preparedMs = await page.evaluate(() => {
        window.preparedVideoElements = [...document.querySelectorAll("video")];
        return performance.now();
      });
      for (const [segment, direction] of [
        [1, "forward"],
        [2, "forward"],
        [3, "forward"],
        [3, "reverse"],
        [2, "reverse"],
        [1, "reverse"],
        [1, "forward"],
      ]) {
        await page.keyboard.press(
          direction === "forward" ? "PageDown" : "PageUp",
        );
        await page.waitForFunction(
          ({ segment, direction }) =>
            document.querySelector(
              `video[data-transition="${segment}"][data-direction="${direction}"]`,
            ).ended,
          { segment, direction },
          { timeout: 10000 },
        );
      }
      await page.waitForLoadState("networkidle");
      const retainedElements = await page.evaluate(() =>
        [...document.querySelectorAll("video")].every(
          (v, i) => v === window.preparedVideoElements[i],
        ),
      );
      const received = await Promise.all(responses);
      let diskBytes = 0;
      for (let segment = 1; segment <= 3; segment++)
        for (const direction of ["forward", "reverse"])
          diskBytes += (
            await stat(
              new URL(
                `../public/assets/transition-${segment}/${orientation}-${direction}.mp4`,
                import.meta.url,
              ),
            )
          ).size;
      const payloadBytes = received.reduce((sum, r) => sum + r.payloadBytes, 0);
      const result = {
        engine,
        engineVersion: browser.version(),
        orientation,
        url: base,
        profile:
          "unthrottled cold context; native preparation then seven gestures",
        diskBytes,
        payloadBytes,
        withinDiskTotal: failed.length === 0 && payloadBytes <= diskBytes,
        preparedMs,
        preparedResponses,
        playbackResponses: responses.length - preparedResponses,
        retainedElements,
        failed,
        responses: received,
      };
      results.push(result);
      await writeFile(output, JSON.stringify(results, null, 2));
      console.log(
        JSON.stringify({
          engine,
          orientation,
          diskBytes,
          payloadBytes,
          withinDiskTotal: result.withinDiskTotal,
          playbackResponses: result.playbackResponses,
          retainedElements,
        }),
      );
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
