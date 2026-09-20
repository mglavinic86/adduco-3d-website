import { test, expect } from "@playwright/test";
for (const preferred of ["av1", "hevc", "h264"]) {
  test(`loads only ${preferred} when capability prediction qualifies it`, async ({
    page,
    browserName,
  }) => {
    const expected =
      browserName === "webkit" && preferred === "av1" ? "h264" : preferred;
    await page.addInitScript((preferred) => {
      Object.defineProperty(navigator, "mediaCapabilities", {
        value: {
          decodingInfo: async (config: MediaDecodingConfiguration) => {
            const type = config.video!.contentType;
            const supported =
              preferred === "av1"
                ? type.includes("av01")
                : preferred === "hevc"
                  ? type.includes("hvc1")
                  : false;
            return { supported, smooth: supported, powerEfficient: supported };
          },
        },
      });
    }, preferred);
    const files: string[] = [];
    page.on("request", (r) => {
      if (r.url().endsWith(".mp4")) files.push(r.url());
    });
    await page.goto("/");
    await expect
      .poll(() =>
        page
          .locator("video")
          .first()
          .evaluate((v: HTMLVideoElement) => v.readyState),
      )
      .toBe(4);
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((f) => f.includes(`-${expected}.mp4`))).toBe(true);
  });
}
test("bounded capability detection falls back without a second format request", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "mediaCapabilities", {
      value: { decodingInfo: () => new Promise(() => {}) },
    }),
  );
  await page.goto("/");
  await expect(page.locator("video").first()).toHaveAttribute(
    "src",
    /-h264.mp4$/,
    {
      timeout: 2000,
    },
  );
});
test("failed efficient codec retries compatible video and retains scroll intent", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "mediaCapabilities", {
      value: {
        decodingInfo: async () => ({
          supported: true,
          smooth: true,
          powerEfficient: true,
        }),
      },
    }),
  );
  await page.route(/-(av1|hevc)\.mp4$/, (r) =>
    r.fulfill({ status: 404, body: "" }),
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page
    .getByRole("link", { name: "2 — Betonski radovi", exact: true })
    .click();
  await expect(page.locator("video").first()).toHaveAttribute(
    "src",
    /-h264.mp4$/,
  );
  await expect(page.locator("video").first()).toHaveCSS("opacity", "1");
  await expect(
    page.getByRole("heading", { name: "Snaga je u detalju." }),
  ).toBeVisible();
});

test("WebKit avoids AV1 despite optimistic capability predictions", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 AppleWebKit/605.1.15 Version/26.0 Safari/605.1.15",
    });
    Object.defineProperty(navigator, "mediaCapabilities", {
      value: {
        decodingInfo: async () => ({
          supported: true,
          smooth: true,
          powerEfficient: true,
        }),
      },
    });
  });
  await page.goto("/");
  await expect(page.locator("video").first()).toHaveAttribute(
    "src",
    /-hevc.mp4$/,
  );
});
