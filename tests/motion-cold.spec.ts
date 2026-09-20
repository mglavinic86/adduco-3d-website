import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

test.skip(!process.env.MOTION_COLD, "Opt-in cold-input lab measurement");
for (const orientation of ["portrait", "landscape"]) {
  for (const profile of ["local", "4g"]) {
    test(`${orientation} ${profile}: first real input before full buffering`, async ({
      page,
      browserName,
    }, info) => {
      test.skip(
        profile === "4g" && browserName !== "chromium",
        "Chrome-only CDP profile",
      );
      test.setTimeout(75_000);
      await page.setViewportSize(
        orientation === "portrait"
          ? { width: 390, height: 844 }
          : { width: 1440, height: 900 },
      );
      let bytes = 0;
      if (browserName === "chromium") {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("Network.enable");
        await cdp.send("Network.clearBrowserCache");
        cdp.on("Network.dataReceived", (e) => {
          bytes += e.dataLength;
        });
        if (profile === "4g") {
          await cdp.send("Network.emulateNetworkConditions", {
            offline: false,
            latency: 85,
            downloadThroughput: 9_000_000 / 8,
            uploadThroughput: 1_500_000 / 8,
          });
          await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        }
      }
      await page.goto("/", {
        waitUntil: "domcontentloaded",
      });
      await page
        .locator("img.scroll-still")
        .evaluate((img: HTMLImageElement) => img.decode());
      const result = await page.evaluate(async () => {
        const v = document.querySelector("video")!;
        const h = document.querySelector<HTMLElement>(".chapter")!.clientHeight;
        const samples = [];
        const events: unknown[] = [];
        for (const type of [
          "loadedmetadata",
          "loadeddata",
          "canplay",
          "canplaythrough",
          "seeking",
          "seeked",
          "waiting",
          "stalled",
          "error",
        ])
          v.addEventListener(type, () =>
            events.push({
              type,
              at: performance.now(),
              time: v.currentTime,
              ready: v.readyState,
              seeking: v.seeking,
            }),
          );
        for (const progress of [0.05, 0.85, 0.1, 0.6, 0.25]) {
          const start = performance.now();
          const buffered = Array.from({ length: v.buffered.length }, (_, i) => [
            v.buffered.start(i),
            v.buffered.end(i),
          ]);
          const frame = await new Promise<{ latency: number; media: number }>(
            (resolve) => {
              const timeout = setTimeout(
                () => resolve({ latency: 12000, media: -1 }),
                12000,
              );
              const callback: VideoFrameRequestCallback = (_now, m) => {
                if (Math.abs(m.mediaTime / 8 - progress) < 0.012) {
                  clearTimeout(timeout);
                  resolve({
                    latency: performance.now() - start,
                    media: m.mediaTime,
                  });
                } else v.requestVideoFrameCallback(callback);
              };
              v.requestVideoFrameCallback(callback);
              window.scrollTo(0, (0.3 + progress * 2.1) * h);
            },
          );
          samples.push({ progress, start, buffered, ...frame });
          await new Promise((r) => setTimeout(r, 200));
        }
        return {
          samples,
          events,
          source: v.currentSrc,
          paused: v.paused,
          codecSupport: {
            hevc: v.canPlayType('video/mp4; codecs="hvc1.1.6.L120.B0"'),
            av1: v.canPlayType('video/mp4; codecs="av01.0.08M.08"'),
          },
        };
      });
      expect(result.paused).toBe(true);
      await mkdir("/tmp/adduco-cold", { recursive: true });
      await writeFile(
        `/tmp/adduco-cold/${process.env.MOTION_COLD}-${info.project.name}-${orientation}-${profile}.json`,
        JSON.stringify(
          { ...result, bodyBytes: browserName === "chromium" ? bytes : null },
          null,
          2,
        ),
      );
      expect(result.samples.every((s) => s.media >= 0)).toBe(true);
      console.log(
        JSON.stringify({
          orientation,
          profile,
          samples: result.samples,
          events: result.events,
          codecSupport: result.codecSupport,
          bytes,
        }),
      );
    });
  }
}
