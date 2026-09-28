import { test, expect, type Page } from "@playwright/test";

test("prepared film keeps drawing through continuous scroll and immediate reversals", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "0");
  for (const frame of [
    ...Array.from({ length: 81 }, (_, i) => i * 6),
    480,
    0,
  ]) {
    await page.evaluate((n) => scrollTo(0, (4050 * n) / 480), frame);
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-frame",
      String(frame),
    );
  }
  const { gaps, maxGap } = await continuous(page);
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "240");
  // Unlike isolated seeks, input never waits for the decoder. A long freeze
  // followed by one correct final frame cannot pass this regression.
  expect(gaps.length).toBeGreaterThan(400);
  expect(gaps[Math.floor(gaps.length * 0.95)]).toBeLessThanOrEqual(50);
  expect(maxGap).toBeLessThanOrEqual(100);
  const stopped = await page
    .locator("canvas")
    .evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.waitForTimeout(200);
  expect(
    await page
      .locator("canvas")
      .evaluate((c: HTMLCanvasElement) => c.toDataURL()),
  ).toBe(stopped);
});

async function continuous(page: Page) {
  return page.evaluate(async () => {
    const canvas = document.querySelector("canvas")!;
    let last = performance.now(),
      frame = canvas.dataset.frame;
    const gaps: number[] = [];
    const observer = new MutationObserver(() => {
      if (canvas.dataset.frame !== frame) {
        const now = performance.now();
        gaps.push(now - last);
        last = now;
        frame = canvas.dataset.frame;
      }
    });
    observer.observe(canvas, {
      attributes: true,
      attributeFilter: ["data-frame"],
    });
    let from = 0;
    const travel = innerHeight * 4.5;
    let maxGap = 0;
    for (const [to, ms] of [
      [480, 8000],
      [0, 4000],
      [480, 2000],
      [240, 1000],
    ]) {
      const start = performance.now();
      while (true) {
        const now = await new Promise<number>(requestAnimationFrame),
          p = Math.min(1, (now - start) / ms);
        scrollTo(0, (travel * (from + (to - from) * p)) / 480);
        maxGap = Math.max(maxGap, now - last);
        if (p === 1) break;
      }
      from = to;
    }
    observer.disconnect();
    return {
      gaps: gaps.sort((a, b) => a - b),
      maxGap: Math.max(maxGap, ...gaps),
    };
  });
}

for (const [orientation, width, height] of [
  ["portrait", 390, 844],
  ["landscape", 1440, 900],
] as const)
  test(`cold ${orientation} scrolling cannot starve the canvas behind obsolete downloads`, async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Network throttling requires CDP");
    test.setTimeout(40000);
    await page.setViewportSize({ width, height });
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 165,
      downloadThroughput: 1012500,
      uploadThroughput: 168750,
    });
    const active = new Set();
    let peak = 0;
    page.on("request", (r) => {
      if (/\.(mp4|m4s)$/.test(r.url())) {
        active.add(r);
        peak = Math.max(peak, active.size);
      }
    });
    page.on("requestfinished", (r) => active.delete(r));
    page.on("requestfailed", (r) => active.delete(r));
    await page.goto("/");
    await expect(page.locator("canvas")).toHaveAttribute("data-frame", "0");
    const { maxGap } = await continuous(page);
    await expect(page.locator("canvas")).toHaveAttribute("data-frame", "240");
    expect(peak).toBeLessThanOrEqual(2);
    // Coarse guard against the reproduced eleven-second freeze. This is not
    // the warm cadence budget and does not claim flawless cold-network motion.
    expect(maxGap).toBeLessThanOrEqual(1000);
  });
