import { test, expect } from "./video-fallback";

test("adjacent scroll positions settle on consecutive source frames", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("video.ready")).toBeVisible();
  for (const frame of [25, 26, 27, 28, 29, 30, 29, 28, 27, 26, 25]) {
    await page.evaluate((frame) => {
      const distance = document.getElementById("povjerenje")!.offsetTop;
      window.scrollTo({ top: (distance * frame) / 192, behavior: "instant" });
    }, frame);
    await expect
      .poll(
        () =>
          page
            .locator("video.ready")
            .evaluate((video) =>
              Math.round(
                Number((video as HTMLVideoElement).dataset.presentedTime) * 24,
              ),
            ),
        { message: `Scroll must present source frame ${frame}` },
      )
      .toBe(frame);
  }
});

test("the shared camera anchors do not pop when crossing movie boundaries", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("video.ready")).toBeVisible();
  const capture = async (progress: number) => {
    await page.evaluate((progress) => {
      window.scrollTo({
        top: document.getElementById("povjerenje")!.offsetTop * progress,
        behavior: "instant",
      });
    }, progress);
    const film = page.locator("video.ready");
    await expect(film).toHaveAttribute(
      "data-segment",
      String(Math.floor(progress)),
    );
    const expectedFrame = Math.round((progress % 1) * 192);
    await expect
      .poll(() =>
        film.evaluate((v: HTMLVideoElement) => ({
          presented: Math.round(Number(v.dataset.presentedTime) * 24),
          selected: Math.floor(v.currentTime * 24),
          seeking: v.seeking,
        })),
      )
      .toEqual({
        presented: expectedFrame,
        selected: expectedFrame,
        seeking: false,
      });
    return film.evaluate((video: HTMLVideoElement) => {
      const canvas = document.createElement("canvas");
      canvas.width = 360;
      canvas.height = 640;
      const context = canvas.getContext("2d")!;
      context.drawImage(video, 0, 0, 360, 640);
      return {
        pixels: Array.from(context.getImageData(0, 0, 360, 640).data),
        png: canvas.toDataURL(),
      };
    });
  };
  for (const [boundary, direction] of [
    [1, 1],
    [2, 1],
    [2, -1],
    [1, -1],
  ]) {
    const positions = [boundary - 0.004, boundary + 0.005];
    if (direction < 0) positions.reverse();
    const before = await capture(positions[0]);
    const after = await capture(positions[1]);
    let difference = 0;
    for (let i = 0; i < before.pixels.length; i++) {
      if (i % 4 !== 3) difference += (before.pixels[i] - after.pixels[i]) ** 2;
    }
    const rms = Math.sqrt(difference / (360 * 640 * 3));
    await testInfo.attach(`anchor-${boundary}-${direction}`, {
      body: JSON.stringify({ boundary, direction, rms }),
      contentType: "application/json",
    });
    if (rms >= 8) {
      for (const [name, image] of [["before", before], ["after", after]] as const) {
        await testInfo.attach(`anchor-${boundary}-${direction}-${name}`, {
          body: Buffer.from(image.png.split(",")[1], "base64"),
          contentType: "image/png",
        });
      }
    }
    expect(
      rms,
      `Visible discontinuity at anchor ${boundary}, direction ${direction}`,
    ).toBeLessThan(8);
  }
});
