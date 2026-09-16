import { test, expect } from "./video-fallback";

for (const scenario of [
  { seekDelay: 0, anchor: 1, offset: 0.15, interval: 160 },
  { seekDelay: 90, anchor: 1, offset: 0.15, interval: 160 },
  { seekDelay: 90, anchor: 1, offset: 0.02, interval: 360 },
  { seekDelay: 90, anchor: 2, offset: 0.02, interval: 360 },
]) {
  const { seekDelay, anchor, offset } = scenario;
  test(`rapid reversals stay continuous at ${anchor - offset} (${seekDelay}ms media delay)`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator("video.ready")).toBeVisible();
    await page.evaluate(
      (progress) =>
        window.scrollTo({
          top: document.getElementById("povjerenje")!.offsetTop * progress,
          behavior: "instant",
        }),
      anchor - offset,
    );
    await expect
      .poll(() =>
        page
          .locator("video.ready")
          .evaluate(
            (v: HTMLVideoElement) =>
              Number(v.dataset.segment) * 8 + Number(v.dataset.presentedTime),
          ),
      )
      .toBeCloseTo((anchor - offset) * 8, 1);
    await expect
      .poll(() =>
        page
          .locator(`video[data-segment="${anchor}"]`)
          .evaluate((v: HTMLVideoElement) => v.readyState),
      )
      .toBeGreaterThanOrEqual(2);

    const result = await page.evaluate(
      async ({ seekDelay: delay, anchor, offset, interval }) => {
        // Model a slower media pipeline, retaining actual browser decoding and
        // frame callbacks. A requested seek remains pending until handed off.
        const clock = Object.getOwnPropertyDescriptor(
          HTMLMediaElement.prototype,
          "currentTime",
        )!;
        const seeking = Object.getOwnPropertyDescriptor(
          HTMLMediaElement.prototype,
          "seeking",
        )!;
        const pending = new WeakSet<HTMLMediaElement>();
        if (delay) {
          Object.defineProperty(HTMLMediaElement.prototype, "currentTime", {
            get() {
              return clock.get!.call(this);
            },
            set(value: number) {
              pending.add(this);
              setTimeout(() => {
                clock.set!.call(this, value);
                pending.delete(this);
              }, delay);
            },
          });
          Object.defineProperty(HTMLMediaElement.prototype, "seeking", {
            get() {
              return pending.has(this) || seeking.get!.call(this);
            },
          });
        }
        const samples: { wall: number; time: number; scroll: number }[] = [];
        let running = true;
        const distance = document.getElementById("povjerenje")!.offsetTop;
        const observe = () => {
          const video = document.querySelector<HTMLVideoElement>("video.ready");
          if (video) {
            const time =
              Number(video.dataset.segment) * 8 +
              Number(video.dataset.presentedTime);
            if (samples.at(-1)?.time !== time)
              samples.push({
                wall: performance.now(),
                time,
                scroll: scrollY / distance,
              });
          }
          if (running) requestAnimationFrame(observe);
        };
        observe();
        const positions =
          offset === 0.02
            ? [0.12, -0.12, 0.1, -0.1, 0.08, -0.08, -0.1]
            : [0.22, -0.28, 0.18, -0.22, 0.25, -0.3, -0.1];
        for (const position of positions) {
          window.scrollTo({
            top: distance * (anchor + position),
            behavior: "instant",
          });
          await new Promise((resolve) => setTimeout(resolve, interval));
        }
        await new Promise((resolve) => setTimeout(resolve, 2200));
        running = false;
        return { samples, end: samples.at(-1)!.time };
      },
      scenario,
    );
    const jumps = result.samples
      .slice(1)
      .map((sample, i) => Math.abs(sample.time - result.samples[i].time));
    const maxJump = Math.max(...jumps);
    await testInfo.attach("rapid-reversal-frames", {
      body: JSON.stringify({ seekDelay, maxJump, ...result }),
      contentType: "application/json",
    });
    expect(result.samples.length).toBeGreaterThan(10);
    expect(
      maxJump,
      "Camera must not leap across the scene when scroll direction changes",
    ).toBeLessThanOrEqual(5 / 24 + 0.001);
    expect(result.end).toBeCloseTo((anchor - 0.1) * 8, 1);
    if (offset === 0.02) {
      expect(
        result.samples.some((sample) => sample.time > anchor * 8),
        "The test must actually cross the movie boundary",
      ).toBe(true);
    }
    const obsolete = result.samples
      .slice(1)
      .map(
        (sample, i) =>
          (sample.time - result.samples[i].time) *
            (sample.scroll * 8 - result.samples[i].time) <
          -0.002,
      );
    expect(
      obsolete.some(
        (wrong, i) =>
          wrong &&
          obsolete[i + 1] &&
          result.samples[i + 1].scroll === result.samples[i + 2].scroll,
      ),
      "One gesture must not queue multiple frames in the obsolete direction",
    ).toBe(false);
    await expect(
      page.getByRole("button", {
        name: /Pokreni animaciju|Zaustavi animaciju/,
      }),
    ).toHaveCount(0);
  });
}
