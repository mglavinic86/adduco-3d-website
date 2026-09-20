import { test, expect } from "@playwright/test";
import { mkdir, writeFile, stat } from "node:fs/promises";
test.skip(
  !process.env.SCROLL_PERFORMANCE,
  "Opt-in cold/warm media lab measurements",
);
for (const profile of ["local", "4g-cpu4"])
  for (const orientation of ["portrait", "landscape"]) {
    test(`${profile} ${orientation}: complete journey load and presented-frame latency`, async ({
      page,
      browserName,
      browser,
    }, info) => {
      test.skip(
        profile !== "local" && browserName !== "chromium",
        "CDP throttling is Chrome-only",
      );
      test.setTimeout(120000);
      await page.setViewportSize(
        orientation === "portrait"
          ? { width: 390, height: 844 }
          : { width: 1440, height: 900 },
      );
      const requests = new Map<
        string,
        { url: string; bytes: number; body: number }
      >();
      if (browserName === "chromium") {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("Network.enable");
        await cdp.send("Network.clearBrowserCache");
        if (profile !== "local") {
          await cdp.send("Network.emulateNetworkConditions", {
            offline: false,
            latency: 85,
            downloadThroughput: 9000000 / 8,
            uploadThroughput: 1500000 / 8,
          });
          await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        }
        cdp.on("Network.responseReceived", (e) =>
          requests.set(e.requestId, { url: e.response.url, bytes: 0, body: 0 }),
        );
        cdp.on("Network.dataReceived", (e) => {
          const r = requests.get(e.requestId);
          if (r) r.body += e.dataLength;
        });
        cdp.on("Network.loadingFinished", (e) => {
          const r = requests.get(e.requestId);
          if (r) r.bytes = e.encodedDataLength;
        });
      }
      const payloads: Promise<{
        url: string;
        bytes: number;
        range?: string;
      }>[] = [];
      page.on("requestfinished", (r) => {
        if (r.url().endsWith(".mp4"))
          payloads.push(
            (async () => {
              const response = (await r.response())!;
              return {
                url: r.url(),
                bytes: (await response.body()).length,
                range: (await response.allHeaders())["content-range"],
              };
            })(),
          );
      });
      await page.addInitScript(() => {
        Object.assign(window, { firstPlayable: 0 });
        document.addEventListener(
          "canplaythrough",
          () => {
            if (!(window as Window & { firstPlayable?: number }).firstPlayable)
              (window as Window & { firstPlayable?: number }).firstPlayable =
                performance.now();
          },
          true,
        );
      });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const opening = await page
        .locator(".scroll-still")
        .evaluate(async (img: HTMLImageElement) => {
          await img.decode();
          await new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          );
          return { paintBound: performance.now(), source: img.currentSrc };
        });
      await expect
        .poll(() =>
          page
            .locator("video")
            .first()
            .evaluate((v: HTMLVideoElement) => v.readyState),
        )
        .toBe(4);
      const firstPlayable = await page.evaluate(
        () => (window as Window & { firstPlayable?: number }).firstPlayable,
      );
      const full = (index: number) =>
        expect
          .poll(
            () =>
              page
                .locator("video")
                .nth(index)
                .evaluate(
                  (v: HTMLVideoElement) =>
                    v.buffered.length === 1 &&
                    v.buffered.start(0) === 0 &&
                    v.buffered.end(0) >= v.duration - 0.002,
                ),
            { timeout: 50000 },
          )
          .toBe(true);
      await full(0);
      await page.waitForLoadState("networkidle");
      const initial = [...requests.values()].map((r) => ({ ...r }));
      const initialMovies = await Promise.all(payloads);
      expect(new Set(initialMovies.map((r) => r.url)).size).toBe(1);
      // Approach a later transition without jumping over its unbuffered movie.
      // Direct cold jumps are covered separately; a sparse native buffer is not
      // equivalent to a completed download for this warm-reuse measurement.
      for (const i of [1, 2]) {
        await page.evaluate(
          (i) =>
            scrollTo(
              0,
              ([0.3, 3.2, 6.1][i] - 0.5) *
                document.querySelector<HTMLElement>(".chapter")!.clientHeight,
            ),
          i,
        );
        await full(i);
      }
      for (const name of [
        "2 — Betonski radovi",
        "3 — Visokogradnja",
        "4 — Vaš projekt",
      ])
        await page.getByRole("link", { name, exact: true }).click();
      await page.waitForLoadState("networkidle");
      const requestsBefore = payloads.length;
      const movement = await page.evaluate(async () => {
        const films = [...document.querySelectorAll("video")];
        const h = document.querySelector<HTMLElement>(".chapter")!.clientHeight;
        const starts = [0.3, 3.2, 6.1];
        const samples = [];
        for (const i of [0, 1, 2, 1, 0])
          for (const p of [0.25, 0.8, 0.2, 0.6]) {
            const v = films[i];
            const from = performance.now();
            const latency = await new Promise<number>((resolve, reject) => {
              const timer = setTimeout(
                () =>
                  reject(
                    new Error(
                      `No frame for segment ${i} at ${p}, current=${v.currentTime}, ready=${v.readyState}`,
                    ),
                  ),
                4000,
              );
              const watch: VideoFrameRequestCallback = (_, m) => {
                if (Math.abs(m.mediaTime / 8 - p) < 0.012) {
                  clearTimeout(timer);
                  resolve(performance.now() - from);
                } else v.requestVideoFrameCallback(watch);
              };
              v.requestVideoFrameCallback(watch);
              scrollTo(0, (starts[i] + 2.1 * p) * h);
            });
            samples.push({ segment: i, progress: p, latency });
          }
        return samples;
      });
      await page.waitForLoadState("networkidle");
      const received = await Promise.all(payloads);
      const media = await page.locator("video").evaluateAll((videos) =>
        videos.map((v) => ({
          url: (v as HTMLVideoElement).currentSrc,
          paused: (v as HTMLVideoElement).paused,
        })),
      );
      const transport = [];
      for (const m of media) {
        const disk = (await stat(`public${new URL(m.url).pathname}`)).size;
        const responses = received.filter((r) => r.url === m.url);
        const probes = responses.filter(
          (r) => r.bytes === 2 && r.range === `bytes 0-1/${disk}`,
        );
        expect(probes.length).toBeLessThanOrEqual(1);
        expect(
          responses.filter((r) => !probes.includes(r)).map((r) => r.bytes),
        ).toEqual([disk]);
        transport.push({
          url: m.url,
          disk,
          payload: responses.reduce((n, r) => n + r.bytes, 0),
          probes: probes.length,
        });
      }
      expect(payloads.length).toBe(requestsBefore);
      const report = {
        browser: browser.version(),
        engine: browserName,
        profile,
        orientation,
        opening,
        firstPlayable,
        initialTransfer:
          browserName === "chromium"
            ? initial.reduce((n, r) => n + r.bytes, 0)
            : null,
        completeTransfer:
          browserName === "chromium"
            ? [...requests.values()].reduce((n, r) => n + r.bytes, 0)
            : null,
        movement,
        transport,
        extraRequests: payloads.length - requestsBefore,
        initial,
        requests: [...requests.values()],
      };
      const output =
        process.env.SCROLL_PERFORMANCE_OUTPUT ?? "/tmp/adduco-full-performance";
      await mkdir(output, { recursive: true });
      await writeFile(
        `${output}/${info.project.name}-${profile}-${orientation}-${info.repeatEachIndex}.json`,
        JSON.stringify(report, null, 2),
      );
      console.log(
        JSON.stringify({
          profile,
          orientation,
          engine: browserName,
          opening,
          firstPlayable,
          initial: report.initialTransfer,
          complete: report.completeTransfer,
          maxSeek: Math.max(...movement.map((s) => s.latency)),
          transport,
        }),
      );
    });
  }
