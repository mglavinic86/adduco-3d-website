import { test, expect } from "@playwright/test";

test("the film restores a previously visited frame after the browser evicts its media buffer", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const add = MediaSource.prototype.addSourceBuffer;
    MediaSource.prototype.addSourceBuffer = function (type) {
      const buffer = add.call(this, type);
      (window as unknown as { testBuffer: SourceBuffer }).testBuffer = buffer;
      return buffer;
    };
  });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "0");
  const first = await page
    .locator("canvas")
    .evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.evaluate(() => scrollTo(0, 2025));
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "240");
  await page.evaluate(async () => {
    const buffer = (window as unknown as { testBuffer: SourceBuffer })
      .testBuffer;
    if (buffer.updating)
      await new Promise<void>((resolve) =>
        buffer.addEventListener("updateend", () => resolve(), { once: true }),
      );
    await new Promise<void>((resolve) => {
      buffer.addEventListener("updateend", () => resolve(), { once: true });
      buffer.remove(0, 2);
    });
    scrollTo(0, 0);
  });
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "0");
  expect(
    await page
      .locator("canvas")
      .evaluate((c: HTMLCanvasElement) => c.toDataURL()),
  ).toBe(first);
});

test("native compatibility mode still reaches both ends when MediaSource is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "MediaSource", { value: undefined });
    Object.defineProperty(window, "ManagedMediaSource", { value: undefined });
  });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "0");
  await page.evaluate(() => scrollTo(0, 4050));
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "480");
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "0");
});

test("Managed Media Source can seek without autoplay or a play gesture", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "webkit", "Managed Media Source is a WebKit API");
  await page.addInitScript(() => {
    const host = window as unknown as {
      ManagedMediaSource: typeof MediaSource;
    };
    Object.defineProperty(window, "MediaSource", {
      value: host.ManagedMediaSource,
    });
  });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "0");
  await page.evaluate(() => scrollTo(0, 2025));
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "240");
  await page.evaluate(() => scrollTo(0, 4050));
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "480");
});

test("AVC streaming remains usable when the browser cannot decode HEVC", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const supports = MediaSource.isTypeSupported.bind(MediaSource);
    MediaSource.isTypeSupported = (type) =>
      !type.includes("hvc1") && supports(type);
  });
  const media: string[] = [];
  page.on("request", (r) => {
    if (/\.(mp4|m4s)$/.test(r.url())) media.push(r.url());
  });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-frame", "0");
  for (const frame of [23, 24, 100, 480, 0]) {
    await page.evaluate((n) => scrollTo(0, (4050 * n) / 480), frame);
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-frame",
      String(frame),
    );
  }
  expect(media.some((url) => url.includes("/story-stream/"))).toBe(true);
  expect(media.some((url) => url.includes("/story-hevc/"))).toBe(false);
});
