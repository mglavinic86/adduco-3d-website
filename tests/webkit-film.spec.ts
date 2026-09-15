import { test, expect } from "@playwright/test";

test("WebKit phone presents requested frames, crosses scenes and returns without playback controls", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /Pokreni animaciju|Zaustavi animaciju/ }),
  ).toHaveCount(0);
  await expect(page.locator("video.ready")).toBeVisible();
  for (const progress of [25 / 192, 26 / 192, 1.1, 2.1, 1.1, 0]) {
    await page.evaluate(
      (progress) =>
        window.scrollTo({
          top: document.getElementById("povjerenje")!.offsetTop * progress,
          behavior: "instant",
        }),
      progress,
    );
    await expect(page.locator("video.ready")).toHaveAttribute(
      "data-segment",
      String(Math.floor(progress)),
    );
    await expect
      .poll(() =>
        page
          .locator("video.ready")
          .evaluate((v: HTMLVideoElement) =>
            Math.round(Number(v.dataset.presentedTime) * 24),
          ),
      )
      .toBe(Math.round((progress % 1) * 192));
  }
  await page.locator(".header-cta").click();
  await expect(page.getByLabel("Ime i prezime *")).toBeInViewport();
  await page.getByRole("button", { name: "Natrag u priču" }).click();
  await expect(page.locator("video.ready")).toBeVisible();
});
