import { test, expect } from "@playwright/test";
for (const preferred of ["av1", "hevc", "h264"]) {
  test(`selects ${preferred} and retries H.264 only after a native decoder error`, async ({
    page,
    browserName,
  }) => {
    const expected =
      browserName === "webkit" && preferred === "av1" ? "h264" : preferred;
    await page.addInitScript((preferred) => {
      const decoderErrors: { src: string; code: number }[] = [];
      Object.assign(window, { decoderErrors });
      document.addEventListener(
        "error",
        (event) => {
          if (event.target instanceof HTMLVideoElement && event.target.error) {
            decoderErrors.push({
              src: event.target.currentSrc,
              code: event.target.error.code,
            });
          }
        },
        true,
      );
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
    expect(files[0]).toContain(`-${expected}.mp4`);
    const finalSource = await page.locator("video").first().getAttribute("src");
    if (expected !== "h264" && finalSource?.endsWith("-h264.mp4")) {
      // Optimistic predictions cannot add an HEVC decoder to Linux Chrome.
      // A format retry is valid only after the actual media element rejects it.
      const errors = await page.evaluate(
        () =>
          (
            window as Window & {
              decoderErrors?: { src: string; code: number }[];
            }
          ).decoderErrors ?? [],
      );
      expect(
        errors.some(
          ({ src, code }) =>
            src.endsWith(`-${expected}.mp4`) && [3, 4].includes(code),
        ),
      ).toBe(true);
      expect(
        files.every(
          (f) => f.endsWith(`-${expected}.mp4`) || f.endsWith("-h264.mp4"),
        ),
      ).toBe(true);
    } else {
      expect(finalSource).toMatch(new RegExp(`-${expected}\\.mp4$`));
      expect(files.every((f) => f.endsWith(`-${expected}.mp4`))).toBe(true);
    }
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
    .getByRole("link", { name: "02 — Betonski radovi", exact: true })
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
  const files: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".mp4")) files.push(request.url());
  });
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
  await expect.poll(() => files.length).toBeGreaterThan(0);
  expect(files[0]).toMatch(/-hevc\.mp4$/);
  await expect
    .poll(() =>
      page
        .locator("video")
        .first()
        .evaluate((video: HTMLVideoElement) => video.readyState),
    )
    .toBe(4);
  expect(files.some((file) => file.endsWith("-av1.mp4"))).toBe(false);
});
